import * as React from "react";

export interface IStatCardProps {}

export default function StatCard(props: IStatCardProps) {
  return (
    <div>
      <div className="stats mt-10">
        <div className="stat bg-indigo-600">
          <div className="stat-title">Trades</div>
          <div className="stat-value py-2">31K</div>
          <div className="stat-desc">Jan 1st - Feb 1st</div>
        </div>

        <div className="stat bg-indigo-600">
          <div className="stat-title">Trade Volume</div>
          <div className="stat-value py-2">$40B</div>
          <div className="stat-desc">400 (22%)</div>
        </div>

        <div className="stat bg-indigo-600">
          <div className="stat-title">Private Trade</div>
          <div className="stat-value py-2">1,200</div>
          <div className="stat-desc">90 (14%)</div>
        </div>
        <div className="stat bg-indigo-600">
          <div className="stat-title">Market Cap</div>
          <div className="stat-value py-2">$2B</div>
          <div className="stat-desc">90 (14%)</div>
        </div>
      </div>
    </div>
  );
}
