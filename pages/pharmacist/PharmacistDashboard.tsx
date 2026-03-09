import React from 'react';
import { useDatabase } from '../../store/database';
import { 
  ShoppingCart, FileText, Bell, 
  ChevronRight, TrendingUp, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserRole } from '../../types';

const PharmacistDashboard: React.FC = () => {
  const { medicines, bills, notifications, prescriptions } = useDatabase();

  const today = new Date().toISOString().split('T')[0];
  const todayBills = bills.filter(b => b.date?.startsWith(today));
  const pendingPrescriptions = prescriptions.filter(p => p.status === 'PENDING').length;
  // Use criticalStockLimit instead of lowStockThreshold
  const lowStock = medicines.filter(m => m.stock <= m.criticalStockLimit).length;

  const stats = [
    { label: 'Pending Validations', value: pendingPrescriptions, icon: FileText, color: 'bg-slate-900', link: '/pharmacist/prescriptions' },
    { label: 'Critical Inventory', value: lowStock, icon: AlertTriangle, color: 'bg-coral', link: '/pharmacist/inventory' },
    { label: 'Bills Today', value: todayBills.length, icon: ShoppingCart, color: 'bg-crimson', link: '/pharmacist/billing' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 bg-white min-h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.link} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
              <div className={`${stat.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                <Icon size={32} />
              </div>
              <h3 className="text-4xl font-black text-slate-800">{stat.value}</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black text-slate-800">Stock Threshold Alerts</h3>
            <Link to="/pharmacist/inventory" className="text-crimson font-black text-sm flex items-center gap-1">View Inventory <ChevronRight size={16}/></Link>
          </div>
          <div className="space-y-4">
            {/* Fixed: Use criticalStockLimit instead of lowStockThreshold */}
            {medicines.filter(m => m.stock <= m.criticalStockLimit).slice(0, 5).map(m => (
              <div key={m.id} className="p-6 bg-rose/5 rounded-3xl flex items-center justify-between border border-rose/10 hover:bg-rose/10 transition-colors cursor-pointer group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-crimson shadow-sm font-black border border-rose/10">!</div>
                  <div>
                    <p className="font-black text-slate-800">{m.name}</p>
                    <p className="text-xs text-crimson font-bold uppercase tracking-widest">Only {m.stock} units left</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">ID: {m.id}</p>
                  <span className="bg-white text-slate-800 px-4 py-1.5 rounded-full text-[10px] font-black group-hover:bg-crimson group-hover:text-white transition-colors border border-slate-100">Action Required</span>
                </div>
              </div>
            ))}
            {medicines.filter(m => m.stock <= m.criticalStockLimit).length === 0 && (
              <div className="text-center py-20 text-slate-400 italic">Inventory levels are healthy</div>
            )}
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-crimson p-10 rounded-[2.5rem] shadow-xl text-white">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3"><Bell size={24}/> Operational Alerts</h3>
            <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
              {notifications.filter(n => n.targetRoles.includes(UserRole.PHARMACIST)).slice(0, 5).map(n => (
                <div key={n.id} className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <p className="text-sm font-bold">{n.title}</p>
                  <p className="text-[10px] text-white/70 mt-1 line-clamp-2">{n.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3"><TrendingUp size={24}/> Quick POS</h3>
            <p className="text-sm text-slate-600 font-medium mb-6">Process a new walk-in customer transaction quickly.</p>
            <Link to="/pharmacist/billing" className="w-full py-4 bg-crimson text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center justify-center">Launch POS Desk</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboard;