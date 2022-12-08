import type { NextPage } from "next";
import Head from "next/head";
import Home from "../views/Home";

const Index: NextPage = (props) => {
  return (
    <>
      <Head>
        <title>Bermuda | Private Swap on Solana</title>
        <meta
          name="Bermuda"
          content="Bermuda"
        />
      </Head>
      <Home />
    </>
  );
};

export default Index;
