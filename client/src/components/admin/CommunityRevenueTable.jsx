import React from "react";

const CommunityRevenueTable = ({ data, currency }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 border border-white/10 rounded-2xl bg-white/[0.02]">
        No community/indie screening revenue in this date range
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
            <th className="pb-2 pr-4">Host</th>
            <th className="pb-2 pr-4">Split</th>
            <th className="pb-2 pr-4">Bookings</th>
            <th className="pb-2 pr-4">Total Revenue</th>
            <th className="pb-2 pr-4">Host Payout</th>
            <th className="pb-2">Theater Share</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.hostId} className="border-t border-white/5">
              <td className="py-2.5 pr-4 font-medium">{row.hostName}</td>
              <td className="py-2.5 pr-4 text-gray-400">{row.revenueSplitPercent}%</td>
              <td className="py-2.5 pr-4 text-gray-400">{row.bookings}</td>
              <td className="py-2.5 pr-4">{currency}{row.totalRevenue.toLocaleString()}</td>
              <td className="py-2.5 pr-4 text-primary">{currency}{row.hostShare.toLocaleString()}</td>
              <td className="py-2.5 text-nebula-cyan">{currency}{row.theaterShare.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CommunityRevenueTable;
