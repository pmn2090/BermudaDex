import * as React from "react";
import { Order } from "../api/endpoints";

export interface IOrderCardProps {
  order: Order
}

function translateState(state: string): string {
  switch (state) {
    case "working":
      return "pending";
    case "funds_failed":
      return "failed";
    default:
      return state;
  }
}

export default function OrderCard(props: IOrderCardProps) {
  const { order } = props;
  const header = `${order.baseToken.toUpperCase()} / ${order.quoteToken.toUpperCase()}`;
  const baseAmount = parseFloat(order.baseAmount);
  const formattedAmount = baseAmount.toFixed(2);
  const amountRow = `${formattedAmount} ${order.baseToken.toUpperCase()}`;
  const d = new Date(order.createdAt);
  const dateRow = `${d.toDateString()}, ${d.toLocaleTimeString()}`;
  const quoteAmountThreshold = parseFloat(order.quoteAmountThreshold);
  const limitPrice = quoteAmountThreshold / baseAmount;
  const limitPriceFormatted = limitPrice.toFixed(4);
  const limitPriceRow = `${limitPriceFormatted} ${order.quoteToken.toUpperCase()}`
  const translatedState = translateState(order.orderState);
  const statusRow = translatedState.toUpperCase();
  return (
    <>
      <div className="card w-3/4 bg-base-200 shadow-xl mt-6">
        <div className="card-body">
          <h2 className="text-2xl font-bold">
            <span className="text-bermuda-blue">{header}</span>
            <span className="float-right font-normal text-xl pr-4">{dateRow}</span>
          </h2>
          <div className="flex flex-row gap-4 mt-1 text-left">
            <div className="basis-1/4 mt-4">
              <p className="p-2 text-gray-400">Order ID</p>
              <p className="p-2 font-bold underline">{order.orderid}</p>
            </div>
            <div className="basis-1/4 p-4 pb-0 rounded-xl text-center">
              <p className="p-2 text-gray-400">Direction</p>
              <p className="p-2 font-bold border rounded-box">{order.direction.toUpperCase()}</p>
            </div>
            <div className="basis-1/4 p-4 pb-0 rounded-xl text-right ml-auto">
              <p className="p-2 text-gray-400">Amount</p>
              <p className="p-2 font-bold">{amountRow}</p>
            </div>
            <div className="basis-1/4 p-4 pb-0 rounded-xl text-right">
              <p className="p-2 text-gray-400">Limit Price</p>
              <p className="p-2 font-bold">{limitPriceRow}</p>
            </div>
            <div className="basis-1/4 p-4 pb-0 rounded-xl float-right text-right">
              <p className="p-2 text-gray-400">Status</p>
              <p className="p-2 font-bold ">{statusRow}</p>
            </div>
          </div>

          {/* <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="justify-start">
              <ul className="steps">
                <li className="step step-primary text-sm">Wrapping</li>
                <li className="step step-primary text-sm">Signed</li>
                <li className="step step-primary text-sm">Sent</li>
                <li className="step text-sm">Confirmed</li>
              </ul>
            </div>

            <div className="justify-end">
              <button disabled className="btn btn-primary float-right">Cancel Order</button>
            </div>
          </div> */}
        </div>
      </div>
    </>
  );
}
