import React from 'react';

const Dashboard = ({ theme }) => {
  const currentTheme = theme === 'midnight' ? 'bg-[#1E293B] border-white/10' :
                       theme === 'slate' ? 'bg-[#475569] border-white/20' : 'bg-white border-slate-200';
  const accentColor = theme === 'midnight' ? 'text-sky-400' :
                      theme === 'slate' ? 'text-emerald-400' : 'text-indigo-600';

  const stats = [
    { title: "Total Revenue", value: "£12,345", change: "+12.5%", changeType: "positive" },
    { title: "Vouchers Issued", value: "1,204", change: "+5.2%", changeType: "positive" },
    { title: "New Customers", value: "89", change: "-2.1%", changeType: "negative" },
    { title: "Products in Stock", value: "5,678", change: "+300", changeType: "positive" },
  ];

  const StatCard = ({ title, value, change, changeType }) => (
    <div className={`${currentTheme} border p-6 shadow-sm rounded-lg`}>
      <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${accentColor}`}>{value}</p>
      <p className={`text-xs mt-2 ${changeType === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
        {change} vs last month
      </p>
    </div>
  );

  return (
    <div className="h-full w-full overflow-y-auto p-6 scrollbar-hide">
        <h1 className="text-2xl font-bold mb-6">System Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
        </div>
        {/* Placeholder for future charts and data visualizations */}
        <div className={`${currentTheme} border p-6 shadow-sm rounded-lg mt-6 h-96`}>
          <h2 className="text-lg font-semibold">Sales Trend</h2>
          <div className="flex items-center justify-center h-full text-white/40">
            Chart placeholder
          </div>
        </div>
    </div>
  );
};

export default Dashboard;
