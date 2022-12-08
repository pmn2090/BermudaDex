import Image from "next/image";
import SolanaLogo from "../../assets/SolanaLogo.png";

const Header = () => {
  return (
    <div className="mt-auto w-full mb-2 bg-transparent text-center">
      <Image src={SolanaLogo} alt="bermuda logo" width={122} height={18} />
    </div>
  );
};

export default Header;
