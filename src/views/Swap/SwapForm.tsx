import { FC, useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  createApproveInstruction,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAccount,
  getAssociatedTokenAddress,
  NATIVE_MINT, TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import Decimal from "decimal.js";

import { addNewOrder, getQuote, CreateOrderParams } from "../../api/endpoints";
import {
  SOLVER_WALLET, SOL_NATIVE_ADDRESS, USDC_ADDRESS
} from "../../constants";

type TokenName = "sol" | "usdc";
type SwapDirection = "sell" | "buy";

interface TokenMint {
  name: TokenName;
  address: PublicKey;
  decimals: number;
}

const USDC_MINT: TokenMint = {
  name: "usdc",
  address: USDC_ADDRESS,
  decimals: 6
}

const SOL_MINT: TokenMint = {
  name: "sol",
  address: SOL_NATIVE_ADDRESS,
  decimals: 9
} 

interface FormType {
  inputAmount: Decimal;
  inputMint: TokenMint;
  outputAmount: Decimal;
  outputMint: TokenMint;
  direction: SwapDirection;
  slippage: Decimal;
}

const DefaultFormValue: FormType = {
  inputAmount: new Decimal(0),
  inputMint: SOL_MINT,
  outputAmount: new Decimal(0),
  outputMint: USDC_MINT,
  direction: "sell",
  slippage: new Decimal(0.05) // 5%
}

const SwapForm: FC<{}> = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const tokenMap = useMemo<Map<string, TokenMint>>(() => new Map([["sol", SOL_MINT],["usdc", USDC_MINT]]), []);
  const [formValue, setFormValue] = useState<FormType>(DefaultFormValue);
  const [loading, setLoading] = useState(false);
  const allTokenMints = ["sol", "usdc"];
  const [error, setError] = useState("");
  const [loadQuote, setLoadQuote] = useState(false);

  useEffect(() => {
    // NOTE: Triggers loading a quote when amounts are changed
    if (!loadQuote) {
      return;
    }
    const reloadAsync = (async() => {
      if (formValue.direction == "sell") {
        const { quoteAmount } = await getQuote(
          formValue.inputMint.name, 
          formValue.outputMint.name, 
          formValue.inputAmount.toNumber()
        );  
        setFormValue((val) => ({
          ...val,
          outputAmount: new Decimal(quoteAmount)
        }))
      } else {
        const { quoteAmount } = await getQuote(
          formValue.outputMint.name, 
          formValue.inputMint.name, 
          formValue.outputAmount.toNumber()
        );  
        setFormValue((val) => ({
          ...val,
          inputAmount: new Decimal(quoteAmount)
        }))        
      }
      setLoadQuote(false);
    });
    reloadAsync();
  }, [loadQuote, formValue]);

  const otherMint = (mint: TokenMint): TokenMint => {
    if (mint.name == "sol") return USDC_MINT;
    else if (mint.name == "usdc") return SOL_MINT;
    else throw new Error(`Invalid mint: ${mint.name}`);
  }

  const handleOnInputAmount = (e: any) => {
    let newValue = e.target?.value || "0";
    let newAmount = new Decimal(newValue);
    if (newAmount.lessThan(0)) {
      newAmount = new Decimal(0);
    }
    setFormValue((val) => ({
      ...val,
      inputAmount: newAmount,
      direction: "sell"
    }));
    setLoadQuote(true);
  }

  const handleOnInputMint = (e: any) => {
    const inputMint = tokenMap.get(e.currentTarget.value);
    const outputMint = otherMint(inputMint!);
    if (inputMint) {
      setFormValue((val) => ({
        ...val,
        inputMint,
        inputAmount: new Decimal(0),
        outputMint,
        outputAmount: new Decimal(0),
        direction: "sell"
      }));
    }
  }

  const handleOnOutputAmount = (e: any) => {
    let newValue = e.target?.value || "0";
    let newAmount = new Decimal(newValue);
    if (newAmount.lessThan(0)) {
      newAmount = new Decimal(0);
    }
    setFormValue((val) => ({
      ...val,
      direction: "buy",
      outputAmount: newAmount,
    }));
    setLoadQuote(true);
  }

  const handleOnOutputMint = (e: any) => {
    const outputMint = tokenMap.get(e.currentTarget.value);
    const inputMint = otherMint(outputMint!);
    if (outputMint) {
      setFormValue((val) => ({
        ...val,
        inputMint,
        inputAmount: new Decimal(0),
        outputMint,
        outputAmount: new Decimal(0),
        direction: "buy"
      }));
      setLoadQuote(true);
    }
  }

  const handleSwap = async () => {
    if (
      !loading &&
      wallet.signTransaction &&
      wallet.sendTransaction &&
      wallet.publicKey
    ) {
      setLoading(true);
      try {
        let baseToken: TokenMint;
        let quoteToken: TokenMint;
        let baseAmount: Decimal;
        let quoteAmountThreshold: Decimal;
        let inputAmountToSpend: Decimal;
        if (formValue.direction == "sell") {
          baseToken = formValue.inputMint;
          baseAmount = formValue.inputAmount;
          quoteToken = formValue.outputMint;
          quoteAmountThreshold = formValue.outputAmount.mul(new Decimal(1).sub(formValue.slippage));
          inputAmountToSpend = baseAmount.mul(Math.pow(10, baseToken.decimals));
        } else if (formValue.direction == "buy") {
          baseToken = formValue.outputMint;
          baseAmount = formValue.outputAmount;
          quoteToken = formValue.inputMint;
          quoteAmountThreshold = formValue.inputAmount.mul(formValue.slippage.plus(1));
          inputAmountToSpend = quoteAmountThreshold.mul(Math.pow(10, quoteToken.decimals));
        } else {
          throw new Error(`Invalid direction: ${formValue.direction}`);
        }
        const inputAmountToSpendNumber = Math.floor(inputAmountToSpend.toNumber());
        // NOTE: Always spend INPUT and receive OUTPUT
        const inputTokenAccount = await getAssociatedTokenAddress(
          formValue.inputMint.address, wallet.publicKey);
        const tx = new Transaction();
        if (formValue.inputMint.name == "sol") {
          // Create WSOL Token account.
          let hasNativeAccount = false;
          try {
            await getAccount(
              connection,
              inputTokenAccount,
              undefined,
              TOKEN_PROGRAM_ID
            );
            hasNativeAccount = true;
          } catch (err: unknown) {
            if (
              err instanceof TokenAccountNotFoundError ||
              err instanceof TokenInvalidAccountOwnerError
            ) {
              hasNativeAccount = false;
            } else {
              throw err;
            }
          }
          if (!hasNativeAccount) {
            const createNativeIx = createAssociatedTokenAccountInstruction(
              wallet.publicKey,
              inputTokenAccount,
              wallet.publicKey,
              NATIVE_MINT
            );
            tx.add(createNativeIx);
          }
          const wrapNativeIx = SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: inputTokenAccount,
            lamports: inputAmountToSpendNumber
          });
          const syncNativeIx = createSyncNativeInstruction(
            inputTokenAccount
          );
          tx.add(wrapNativeIx, syncNativeIx);
        }
        const ix = createApproveInstruction(
          inputTokenAccount, 
          SOLVER_WALLET, 
          wallet.publicKey, 
          inputAmountToSpendNumber
        );
        tx.add(ix);
        console.log("Sending Transaction..");
        // TODO: wait for the transaction and update status.
        await wallet.sendTransaction(tx, connection);
        console.log("Transaction Sent!");
        const order: CreateOrderParams = {
          baseToken: baseToken.name,
          quoteToken: quoteToken.name,
          baseAmount: baseAmount.toString(),
          quoteAmountThreshold: quoteAmountThreshold.toString(),
          direction: formValue.direction,
          receiver: wallet.publicKey.toString(),
          signature: ""
        }
        await addNewOrder(order);
        alertOrderSubmitted();
        resetForm();
      } catch {
        alertOrderFailed();
      } finally {
        setLoading(false);
      }
    }
  }

  const alertOrderSubmitted = () => toast(
    <p className="p-2">
      <p className="mb-2 font-bold text-xl text-gray-600">Order Submitted!</p>You can check the status on the Orders page.
    </p>, 
    { type: "success" }
  );

  const alertOrderFailed = () => toast(
    <p className="p-2">
      Cannot Submit Order! Please try again later.
    </p>, 
    { type: "error" }
  );

  const resetForm = () => setFormValue((val) => ({
    ...val,
    inputAmount: new Decimal(0),
    outputAmount: new Decimal(0)
  }));

  return (
    <>
      <div className="text-center pt-2">
        <div className="min-h-16 py-4">
          <div className="text-left">
            <div className="max-w-lg">
              <div className="card w-full">
                <div className="card-body max-w-lg">
                  <div className="border rounded-3xl p-5 my-2 border-bermuda-indigo">
                    <p>From</p>
                    <div className="flex flex-row gap-3">
                      <div className="basis-1/2 w-8/12">
                        <input
                          name="amount-in"
                          id="amount-in"
                          placeholder="0.00"
                          className="input w-full max-w-xs rounded-3xl text-white text-4xl font-bold bg-transparent border-transparent focus:border-transparent focus:ring-0"
                          value={formValue.inputAmount.toString()}
                          type="number"
                          pattern="^[0-9]*[.,]?[0-9]*$"
                          onInput={(e: any) => handleOnInputAmount(e)}
                        />
                      </div>
                      <div className="basis-1/4 w-4/12">
                        <select
                          id="inputMint"
                          name="inputMint"
                          className="select w-full max-w-xs text-white text-2xl font-bold rounded-3xl bg-bermuda-blue text-right "
                          value={formValue.inputMint.name}
                          onChange={handleOnInputMint}
                        >
                          {allTokenMints.map((tokenMint) => 
                              <option key={tokenMint} value={tokenMint}>
                                {tokenMint.toUpperCase()}
                              </option>
                            )
                          }
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-3xl p-5 my-2 border-bermuda-indigo">
                    <p>To</p>
                    <div className="flex flex-row gap-3">
                      <div className="basis-1/2 w-8/12">
                        <input
                          name="amount-out"
                          id="amount-out"
                          placeholder="0.00"
                          className="input w-full max-w-xs rounded-3xl text-white text-4xl font-bold bg-transparent border-transparent focus:border-transparent focus:ring-0"
                          value={formValue.outputAmount.toString()}
                          type="number"
                          pattern="^[0-9]*[.,]?[0-9]*$"
                          onInput={handleOnOutputAmount}
                        />
                      </div>
                      <div className="basis-1/4 w-4/12">
                        <select
                          id="inputMint"
                          name="inputMint"
                          className="select w-full max-w-xs text-white text-2xl font-bold rounded-3xl bg-bermuda-blue text-right "
                          value={formValue.outputMint.name}
                          onChange={handleOnOutputMint}
                        >
                          {allTokenMints.map((tokenMint) =>
                              <option key={tokenMint} value={tokenMint}>
                                {tokenMint.toUpperCase()}
                              </option>
                            )
                          }
                        </select>
                      </div>
                    </div>
                  </div>
                  {error && 
                    <div className="justify-start text-center mt-10 border rounded-3xl px-5 py-5 border-gray-600 text-gray-400">
                      Error loading, please try again later!
                    </div>}

                  <div className="card-actions justify-center mt-10">
                    <button
                      className="btn btn-primary btn-wide bg-bermuda-indigo text-2xl font-bold h-16 border-0 rounded-full hover:bg-bermuda-indigo-hover disabled:bg-bermuda-indigo-disabled disabled:text-white"
                      disabled={loading}
                      onClick={handleSwap}
                    >
                      {loading ? 'Sending..' : 'Swap'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SwapForm;
