import React from 'react';

const StockTable = ({ current, products, onDelete }) => {
  return (
    <div className={`w-full overflow-hidden border ${current.border}`}>
      <table className="w-full text-left text-[11px]">
        <thead className="bg-black/20 text-white/40 font-black uppercase tracking-[0.2em]">
          <tr>
            <th className="p-4">Visual</th>
            <th className="p-4">Name</th>
            <th className="p-4">Price</th>
            <th className="p-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
              <td className="p-4">
                <img src={p.images[0]} className="w-10 h-10 object-cover border border-white/10" alt="" />
              </td>
              <td className="p-4 font-bold uppercase">{p.name}</td>
              <td className="p-4 font-black text-indigo-400">${p.price.toFixed(2)}</td>
              <td className="p-4 text-right">
                <button onClick={() => onDelete(p.id)} className="text-red-500 hover:underline font-black text-[9px] uppercase">Kill_Process</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockTable;