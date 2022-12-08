import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import React, { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import Link from "next/link";
import Image from "next/image";
import logo from "../../assets/Logo.png";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { airdropSolIx } from "../../api/airdrop";
import { Transaction } from "@solana/web3.js"

const Header = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [airdropping, setAirdropping] = useState(false);

  const handleAirdrop = async () => {
    try {
      setAirdropping(true);
      if (!wallet.publicKey) return;
      let airdropIx = await airdropSolIx(wallet.publicKey);
      const tx = new Transaction();
      for(let i = 0; i < airdropIx.length; i++) {
        tx.add(airdropIx[i]);
      }
      await wallet.sendTransaction(tx, connection);
      toast("Airdrop received!")
    } catch (err) {
      console.error(err);
      toast("Airdrop failed!", { type: "error" });
    } finally {
      setAirdropping(false);
    }
  }

  return (
    <div className="navbar w-full mb-2 text-neutral-content rounded-box bg-transparent">
      <div className="flex-1 cursor-pointer">
        <Link href="/" passHref>
          <Image src={logo} alt="bermuda logo" width={134} height={45} />
        </Link>
      </div>
      <div className="flex-none">
        <div className="px-4">
          <button className="disabled:text-gray-500" disabled={airdropping} onClick={handleAirdrop}>Airdrop SOL</button>
        </div>        
        <div className="px-4">
          <Link href="/orders">Orders</Link>
        </div>
        <WalletMultiButton className="btn btn-ghost" />
      </div>
    </div>
  );
};

export default Header;
