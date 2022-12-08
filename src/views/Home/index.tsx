import { FC } from "react";
import { ToastContainer, toast } from 'react-toastify';
import Header from "./Header";
import Footer from "./Footer";
import SwapForm from "../Swap/SwapForm";

const Home: FC = ({}) => {
  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0 h-full">
      <ToastContainer />
      <div className="flex flex-col items-center h-full w-full">
        <Header />
        <div className="flex flex-col items-center">
          <h1 className="mt-24 font-bold text-white text-5xl">
            Private Swap
          </h1>
          <SwapForm />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Home;
