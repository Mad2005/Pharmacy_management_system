import React from 'react';
import { useDatabase } from '../../store/database';
import { 
  Pill, Package, AlertTriangle, XCircle, 
  TrendingUp, Receipt, Bell, ChevronRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const AdminDashboard: React.FC = () => {
  const { medicines, bills, notifications } = useDatabase();

  const totalMeds = medicines.length;
  // Use criticalStockLimit instead of lowStockThreshold
  const lowStock = medicines.filter(m => m.stock <= m.criticalStockLimit).length;
  const nearExpiry = medicines.filter(m => {
    const diff = (new Date(m.expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return diff > 0 && diff < 30;
  }).length;
  const expired = medicines.filter(m => new Date(m.expiry) < new Date()).length;

  const today = new Date().toISOString().split('T')[0];
  const todayBills = bills.filter(b => b.date?.startsWith(today));
  const todaySales = todayBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);

  // Fixed: Updated icon reference from Pills to Pill
  const stats = [
    { label: 'Total Medicines', value: totalMeds, icon: Pill, color: 'bg-crimson', link: '/admin/medicines' },
    { label: 'Low Stock', value: lowStock, icon: Package, color: 'bg-pinkish', link: '/admin/inventory' },
    { label: 'Near Expiry', value: nearExpiry, icon: AlertTriangle, color: 'bg-coral', link: '/admin/inventory' },
    { label: 'Expired', value: expired, icon: XCircle, color: 'bg-crimson', link: '/admin/inventory' },
    { label: 'Today Sales', value: `$${todaySales.toFixed(2)}`, icon: TrendingUp, color: 'bg-pinkish', link: '/admin/reports' },
    { label: 'Bills Today', value: todayBills.length, icon: Receipt, color: 'bg-coral', link: '/admin/billing' },
  ];

  const chartData = [
    { name: 'Mon', sales: 400 },
    { name: 'Tue', sales: 300 },
    { name: 'Wed', sales: 600 },
    { name: 'Thu', sales: 800 },
    { name: 'Fri', sales: 500 },
    { name: 'Sat', sales: 900 },
    { name: 'Sun', sales: 1100 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 bg-white min-h-full">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.link} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
              <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
              </div>
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{stat.value}</h3>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Sales performance</h3>
            <select className="bg-slate-50 border-none rounded-lg text-xs px-3 py-1.5 ring-1 ring-slate-200 focus:ring-crimson">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC143C" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#DC143C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#DC143C', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#DC143C" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notifications Sidebar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Bell size={18} className="text-crimson" />
              Recent alerts
            </h3>
            <button className="text-xs text-crimson font-semibold hover:underline">View all</button>
          </div>
          <div className="flex-1 space-y-3">
            {notifications.slice(0, 5).map((notif) => (
              <div key={notif.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 group hover:border-crimson transition-colors cursor-pointer">
                <p className="text-sm font-bold text-slate-800">{notif.title}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{notif.message}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-400 font-medium">{new Date(notif.createdAt).toLocaleDateString()}</span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-crimson" />
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-20 text-slate-400 text-sm italic">No recent alerts</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">Recent transactions</h3>
          <Link to="/admin/reports" className="text-sm font-semibold text-crimson hover:underline flex items-center gap-1">
            View all reports <ChevronRight size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold tracking-wider">
                <th className="pb-3 font-semibold">Bill ID</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Total amount</th>
                <th className="pb-3 font-semibold">Payment</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bills.slice(0, 5).map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 font-medium text-slate-700">{bill.id}</td>
                  <td className="py-4 text-slate-600">{bill.customerName}</td>
                  <td className="py-4 text-slate-500 text-sm">{new Date(bill.date).toLocaleDateString()}</td>
                  <td className="py-4 font-bold text-slate-800">${(bill.grandTotal || 0).toFixed(2)}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      bill.paymentMode === 'UPI' ? 'bg-rose/10 text-crimson' :
                      bill.paymentMode === 'CARD' ? 'bg-pinkish/10 text-pinkish' :
                      'bg-rose/5 text-crimson'
                    }`}>
                      {bill.paymentMode}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="px-3 py-1 bg-rose/10 text-crimson rounded-full text-xs font-bold">Paid</span>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 italic">No transactions yet today</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;