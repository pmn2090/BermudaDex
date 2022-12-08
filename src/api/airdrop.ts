import * as borsh from '@project-serum/borsh'
import { TOKEN_PROGRAM_ID, NATIVE_MINT, syncNative, createAssociatedTokenAccount, getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction, createSyncNativeInstruction } from '@solana/spl-token'
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Key } from 'react'
import { SOLANA_RPC_ENDPOINT, USDC_ADDRESS } from '../constants'
import { createATA, getATA } from './utils'

const connection = new Connection(SOLANA_RPC_ENDPOINT);
export const airdrop_program_id = new PublicKey("2fy3LqpXg9V8hZqoQmaJLdGiGLhPYQKs3TQ8d8CzmLME")

// airdrops fake USC tokens to a user's wallet given a keypair and amount. 
// creates an associated token account if necessary as well, so just need to pass in the wallet pubkey
export async function airdropUsdc(amount: number, traderKeypair: Keypair){
    let mintPda = (await PublicKey.findProgramAddress([Buffer.from('authority')], airdrop_program_id))[0]

    const transaction = new Transaction()

    const userATA = await getATA(USDC_ADDRESS, traderKeypair.publicKey)
    let account = await connection.getAccountInfo(userATA)

    if (account == null) {
        const createATAIX = await createATA(USDC_ADDRESS, userATA, traderKeypair.publicKey)
        transaction.add(createATAIX)
    }


    const airdrop = new AirdropSchema(amount)
    const buffer = airdrop.serialize()

    const airdropIX = new TransactionInstruction({
        keys: [
        {
            pubkey: traderKeypair.publicKey,
            isSigner: true,
            isWritable: true,
        },
        {
            pubkey: userATA,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: USDC_ADDRESS,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: mintPda,
            isSigner: false,
            isWritable: false,
        },
        {
            pubkey: TOKEN_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
        }
        ],
        data: buffer,
        programId: airdrop_program_id,
    })

    transaction.add(airdropIX)

    try {
        let txid = await connection.sendTransaction(transaction, [traderKeypair])
        console.log(`Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=devnet`)
    } catch (e) {
        console.log(JSON.stringify(e))
    }

}

export class AirdropSchema {
    amount: number;

    constructor(amount: number) {
        this.amount = amount;
    }

    AIRDROP_IX_DATA_LAYOUT = borsh.struct([
        borsh.u8("variant"),
        borsh.u32("amount")
    ]);

    serialize(): Buffer {
    const payload = {
        variant: 0,
        amount: this.amount
    }

    const ixBuffer = Buffer.alloc(9);
    this.AIRDROP_IX_DATA_LAYOUT.encode(payload, ixBuffer)

    return ixBuffer
	}  
}

export async function airdropSolIx(wallet: PublicKey) {
    let instructions: TransactionInstruction[] = []

    let ata = await getAssociatedTokenAddress(NATIVE_MINT, wallet)
    // can only airdrop 2 tokens at a time
    let lamports = 2 * LAMPORTS_PER_SOL
    await connection.requestAirdrop(ata, lamports)

    let tokenAccount = await connection.getAccountInfo(ata)
    if(!tokenAccount) {
        let createAtaIx = await createAssociatedTokenAccountInstruction(wallet, ata, wallet, NATIVE_MINT)
        instructions.push(createAtaIx)
    }

    try {
        let syncNativeIx = await createSyncNativeInstruction(ata)
        instructions.push(syncNativeIx)
    } catch (e) {
        console.log("ERROR: ", e)
    }

    return instructions
}