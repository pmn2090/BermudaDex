import { Cluster, PublicKey } from "@solana/web3.js";
import { ENV as ENVChainId } from "@solana/spl-token-registry";

type ClusterWithLocal = Cluster | "local";
// Endpoints, connection
export const ENV: ClusterWithLocal =
  (process.env.NEXT_PUBLIC_CLUSTER as ClusterWithLocal) || "mainnet-beta";
export const CHAIN_ID =
  ENV === "mainnet-beta"
    ? ENVChainId.MainnetBeta
    : ENV === "devnet"
    ? ENVChainId.Devnet
    : ENV === "testnet"
    ? ENVChainId.Testnet
    : ENVChainId.MainnetBeta;

function clusterToRpcEndpoint(cluster: ClusterWithLocal): string {
  switch(cluster) {
    case "mainnet-beta":
        return "https://ssc-dao.genesysgo.net/";
    case "devnet":
      return "https://api.devnet.solana.com";
    case "local":
      return "http://127.0.0.1:8899";
    default:
      throw new Error(`Cluster not supported: ${cluster}`);
  }
}

export const SOLANA_RPC_ENDPOINT = clusterToRpcEndpoint(ENV);

// Token Mints
export const INPUT_MINT_ADDRESS =
  ENV === "devnet"
    ? "So11111111111111111111111111111111111111112" // SOL
    : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC
export const OUTPUT_MINT_ADDRESS =
  ENV === "devnet"
    ? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // USDC
    // ? "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt" // SRM
    : "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"; // USDT

// Interface
export interface Token {
  chainId: number; // 101,
  address: string; // '8f9s1sUmzUbVZMoMh6bufMueYH1u4BJSM57RCEvuVmFp',
  symbol: string; // 'TRUE',
  name: string; // 'TrueSight',
  decimals: number; // 9,
  logoURI: string; // 'https://i.ibb.co/pKTWrwP/true.jpg',
  tags: string[]; // [ 'utility-token', 'capital-token' ]
}

const SOL_NATIVE_ADDRESS_STR = "So11111111111111111111111111111111111111112";
export const SOL_NATIVE_ADDRESS = new PublicKey(SOL_NATIVE_ADDRESS_STR);

const USDC_ADDRESS_STR = process.env.NEXT_PUBLIC_USDC_ADDRESS || "missing USDC address";
export const USDC_ADDRESS = new PublicKey(USDC_ADDRESS_STR);

const SOLVER_WALLET_STR = process.env.NEXT_PUBLIC_SOLVER_WALLET || "missing solver wallet";
export const SOLVER_WALLET = new PublicKey(SOLVER_WALLET_STR);
