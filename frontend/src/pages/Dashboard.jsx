import React, { useState, useEffect } from 'react';
import api from '../../api';

const Dashboard = ({ theme }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const currentTheme = theme === 'midnight' ? 'bg-[#1E293B] border-white/10' :
                       theme === 'slate' ? 'bg-[#475569] border-white/20' : 'bg-white border-slate-200';
  const accentColor = theme === 'midnight' ? 'text-sky-400' :
                      theme === 'slate' ? 'text-emerald-400' : 'text-indigo-600';

  const StatCard = ({ title, value }) => (
    <div className={`${currentTheme} border p-6 shadow-sm rounded-lg`}>
      <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${accentColor}`}>{value}</p>
    </div>
  );

  return (
    <div className="h-full w-full overflow-y-auto p-6 scrollbar-hide">
        <h1 className="text-2xl font-bold mb-6">System Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {loading || !stats ? (
                <>
                    <StatCard title="Total Revenue" value="..." />
                    <StatCard title="Vouchers Issued" value="..." />
                    <StatCard title="New Customers" value="..." />
                    <StatCard title="Products in Stock" value="..." />
                </>
            ) : (
                <>
                    <StatCard title="Total Revenue" value={`£${stats.total_revenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                    <StatCard title="Vouchers Issued" value={stats.vouchers_issued.toLocaleString('en-GB')} />
                    <StatCard title="New Customers" value={stats.new_customers.toLocaleString('en-GB')} />
                    <StatCard title="Products in Stock" value={stats.products_in_stock.toLocaleString('en-GB')} />
                </>
            )}
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
