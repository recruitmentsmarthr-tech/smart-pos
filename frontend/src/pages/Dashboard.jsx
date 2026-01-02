import React, { useState } from 'react';

const Dashboard = ({ theme, products }) => {
  const [cart, setCart] = useState([]);
  const addToCart = (p) => {
    setCart((prev) => {
      const exists = prev.find(i => i.id === p.id);
      if (exists) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const currentTheme = theme === 'midnight' ? 'bg-[#1E293B] border-white/10' : 
                       theme === 'slate' ? 'bg-[#475569] border-white/20' : 'bg-white border-slate-200';
  const accentColor = theme === 'midnight' ? 'text-sky-400' : 
                      theme === 'slate' ? 'text-emerald-400' : 'text-indigo-600';

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {products.map((p) => (
            <button key={p.id} onClick={() => addToCart(p)} className={`${currentTheme} border p-4 flex flex-col h-40 text-left relative active:scale-95 group shadow-sm`}>
              <div className={`absolute top-0 right-0 w-1.5 h-full ${p.color || 'bg-slate-500'}`}></div>
              <h3 className="text-[12px] font-black uppercase flex-1">{p.name}</h3>
              <div className="flex justify-between items-end mt-4 pt-3 border-t border-inherit opacity-60">
                <span className={`text-xl font-black ${accentColor}`}>${p.price.toFixed(2)}</span>
                <span className="text-[9px] font-black">ADD+</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      <aside className={`w-72 border-l border-inherit flex flex-col shrink-0 ${currentTheme}`}>
        <div className="p-5 border-b border-inherit bg-black/5 text-[9px] font-black opacity-40 uppercase tracking-[0.4em]">Order_Summary</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 border border-white/5 bg-white/5 text-[10px] font-bold uppercase">
              <span>{item.name} x{item.qty}</span>
              <span>${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-inherit bg-black/5">
          <div className="flex justify-between items-end mb-4">
            <span className="text-[10px] font-black opacity-40 uppercase">Total</span>
            <span className={`text-3xl font-black ${accentColor}`}>${total.toFixed(2)}</span>
          </div>
          <button className="w-full bg-indigo-600 text-white py-4 font-black text-[11px] uppercase tracking-widest hover:bg-indigo-500">Finalize</button>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;