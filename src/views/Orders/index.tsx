import { FC, useEffect, useState } from "react";
import { getLatestOrders, Order } from "../../api/endpoints";

import { useWallet } from "@solana/wallet-adapter-react";
import OrderCard from "../../components/OrderCard";
import Header from "../Home/Header";
import Footer from "../Home/Footer";

const REFRESH_INTERVAL_MS = 3000;

function ordersByCreatedTimeDesc(a: Order, b: Order): number {
  const tsA = new Date(a.createdAt).getTime();
  const tsB = new Date(b.createdAt).getTime();
  return tsB - tsA;
}

const OrdersView: FC = ({}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const wallet = useWallet();

  useEffect(() => {
    const reloadOrders = async () => {
      if (!wallet.publicKey) {
        return;
      }
      const orders = await getLatestOrders(wallet.publicKey.toString());
      if (!orders) {
        return;
      }
      orders.sort(ordersByCreatedTimeDesc);
      setOrders(orders);
    };
    reloadOrders();
    const interval = setInterval(reloadOrders, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [wallet.publicKey]);

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0 h-full">
      <div className="flex flex-col items-center h-full w-full">
        <Header />
        <div className="flex flex-col items-center w-full mb-8">
          <h1 className="mt-24 mb-6 font-bold text-white text-5xl">
            Orders
          </h1>
          {/* <StatCard /> */}
          {
            orders.map(order => <OrderCard key={order.orderid} order={order} />)
          }
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default OrdersView;
