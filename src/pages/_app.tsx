import {
  ConnectionProvider
} from "@solana/wallet-adapter-react";
import type { AppProps } from "next/app";
import "tailwindcss/tailwind.css";
import { SOLANA_RPC_ENDPOINT } from "../constants";
import WalletProvider from "../contexts/ClientWalletProvider";
import "../styles/App.css";
import "../styles/globals.css";

export const SECOND_TO_REFRESH = 30 * 1000;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
      <WalletProvider autoConnect={true}>
        <Component {...pageProps} />
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default MyApp;
