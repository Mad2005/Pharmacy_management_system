import React from 'react';
import { useDatabase } from '../../store/database';
import { ShoppingCart, Package, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const StaffDashboard: React.FC = () => {
  const { bills } = useDatabase();
  const today = new Date().toISOString().split('T')[0];
  const todayBills = bills.filter(b => b.date?.startsWith(today));
  const todayRevenue = todayBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-12 rounded-[3rem] shadow-sm border flex items-center justify-between group overflow-hidden relative">
          <div className="absolute -right-10 -bottom-10 text-gray-50 group-hover:text-gray-100 transition-colors">
            <ShoppingCart size={200} />
          </div>
          <div className="relative z-10">
            <h3 className="text-6xl font-black text-gray-800">{todayBills.length}</h3>
            <p className="text-gray-400 font-black uppercase tracking-widest text-sm mt-2">Invoices Handled Today</p>
          </div>
          <Link to="/staff/billing" className="relative z-10 w-20 h-20 bg-[#DC143C] text-white rounded-[2rem] flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
            <Zap size={32} />
          </Link>
        </div>
        <div className="bg-[#DC143C] p-12 rounded-[3rem] shadow-xl text-white flex items-center justify-between group overflow-hidden relative">
          <div className="absolute -right-10 -bottom-10 text-white/5">
            <TrendingUp size={200} />
          </div>
          <div className="relative z-10">
            <h3 className="text-6xl font-black">${(todayRevenue || 0).toFixed(0)}</h3>
            <p className="text-white/70 font-black uppercase tracking-widest text-sm mt-2">Cash Desk Revenue</p>
          </div>
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center">
            <TrendingUp size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white p-12 rounded-[3rem] border shadow-sm">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-2xl font-black text-gray-800">Recent Transactions</h3>
          <Link to="/staff/billing" className="text-[#DC143C] font-black text-sm flex items-center gap-1">Open POS Console <ChevronRight size={16}/></Link>
        </div>
        <div className="space-y-4">
          {todayBills.slice(0, 5).map(b => (
            <div key={b.id} className="p-6 bg-gray-50 rounded-[2rem] flex items-center justify-between border border-transparent hover:border-[#DC143C]/20 transition-all cursor-pointer">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-white rounded-2xl text-[#DC143C] shadow-sm">
                  <Package size={24} />
                </div>
                <div>
                  <p className="font-black text-gray-800">{b.id}</p>
                  <p className="text-xs text-gray-400 font-bold">{new Date(b.date).toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-gray-800">${(b.grandTotal || 0).toFixed(2)}</p>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">{b.paymentMode}</span>
              </div>
            </div>
          ))}
          {todayBills.length === 0 && (
            <div className="text-center py-20 text-gray-300 font-bold italic uppercase tracking-widest">No sales recorded yet today</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;