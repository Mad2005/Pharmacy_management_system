
import React, { useState } from 'react';
import { useDatabase } from '../../store/database';
import { 
  Package, X, RefreshCw, Pill, ShieldAlert, 
  CheckCircle, Clock, AlertTriangle, Eye, Search, 
  ChevronRight, LayoutList, Info, FileText, Building2, Trash2, Filter
} from 'lucide-react';
import { Medicine, User, UserRole } from '../../types';

type InventoryFilter = 'ALL' | 'NEAR_EXPIRY' | 'EXPIRED' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'IN_STOCK';

const InventoryManagement: React.FC<{ user: User }> = ({ user }) => {
  const { medicines, suppliers, restockMedicine, deleteMedicine } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<InventoryFilter>('ALL');
  const [viewingMed, setViewingMed] = useState<Medicine | null>(null);
  const [restockItem, setRestockItem] = useState<Medicine | null>(null);

  const isExpired = (expiry: string) => new Date(expiry) < new Date();
  const isNearExpiry = (expiry: string) => {
    const diff = (new Date(expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return diff > 0 && diff <= 30;
  };

  const getClinicalStatus = (med: Medicine) => {
    const isExp = isExpired(med.expiry);
    const isNear = isNearExpiry(med.expiry);
    const isLow = med.stock <= med.criticalStockLimit && med.stock > 0;
    const isOut = med.stock <= 0;

    if (isExp) return { label: 'Expired', color: 'text-crimson', bg: 'bg-rose/20', icon: ShieldAlert, border: 'border-crimson/30' };
    if (isNear) return { label: 'Near Expiry', color: 'text-pinkish', bg: 'bg-pinkish/10', icon: Clock, border: 'border-pinkish/30' };
    if (isOut) return { label: 'Out of Stock', color: 'text-crimson', bg: 'bg-rose/10', icon: AlertTriangle, border: 'border-crimson/20' };
    if (isLow) return { label: 'Low Stock', color: 'text-coral', bg: 'bg-coral/10', icon: AlertTriangle, border: 'border-coral/30' };
    return { label: 'In Stock', color: 'text-slate-600', bg: 'bg-slate-50', icon: CheckCircle, border: 'border-slate-200' };
  };

  // Inventory includes expired formulations for tracking/disposal
  const filteredMeds = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeFilter === 'NEAR_EXPIRY') return isNearExpiry(m.expiry) && !isExpired(m.expiry);
    if (activeFilter === 'EXPIRED') return isExpired(m.expiry);
    if (activeFilter === 'LOW_STOCK') return m.stock > 0 && m.stock <= m.criticalStockLimit;
    if (activeFilter === 'OUT_OF_STOCK') return m.stock <= 0;
    if (activeFilter === 'IN_STOCK') return m.stock > 0 && !isExpired(m.expiry) && !isNearExpiry(m.expiry);
    
    return true;
  });

  const handleDelete = (id: string, name: string) => {
    if (user.role === UserRole.STAFF) {
      alert("Clinical Protocol Error: Staff role is restricted from archival operations.");
      return;
    }
    if (confirm(`Authorize clinical disposal of formulation: ${name}?`)) {
      deleteMedicine(id);
      alert('Clinical Protocol Success: Formulation archived successfully.');
      setViewingMed(null);
    }
  };

  const MedicineDetailModal = ({ med }: { med: Medicine }) => {
    const status = getClinicalStatus(med);
    const StatusIcon = status.icon;

    return (
      <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/95 backdrop-blur-2xl p-4">
        <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row h-[80vh] animate-in zoom-in duration-300 border border-slate-200">
           <div className="w-full md:w-[380px] bg-slate-50 p-12 flex flex-col border-r border-slate-200">
              <div className="mb-10">
                 <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-crimson mb-8 border border-slate-100">
                    <Pill size={32} />
                 </div>
                 <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${status.bg} ${status.color} border border-current mb-6`}>
                    <StatusIcon size={12} /> {status.label}
                 </div>
                 <h2 className="text-3xl font-bold text-slate-800 tracking-tight uppercase leading-tight">{med.name}</h2>
                 <p className="text-sm font-semibold text-slate-400 mt-2 uppercase tracking-widest">{med.brand}</p>
              </div>

              <div className="flex-1 space-y-8">
                 <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">Stock Statistics</p>
                    <div className="flex items-baseline gap-2">
                       <p className={`text-4xl font-bold tracking-tighter ${status.color}`}>{med.stock}</p>
                       <p className="text-xs font-bold text-slate-400 uppercase">Units</p>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full mt-4 overflow-hidden">
                       <div className={`h-full rounded-full transition-all duration-700 ${status.color.replace('text', 'bg')}`} style={{ width: `${Math.min((med.stock / (med.criticalStockLimit * 3)) * 100, 100)}%` }}></div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 tracking-widest border-b pb-2">
                       <span>Audit Node Ref</span>
                       <span className="text-slate-700">{med.id}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 tracking-widest border-b pb-2">
                       <span>Clinical Low Limit</span>
                       <span className="text-crimson font-black">{med.criticalStockLimit} U</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-3 mt-8">
                <button onClick={() => { setViewingMed(null); setRestockItem(med); }} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2">
                   <RefreshCw size={18}/> Authorize Restock
                </button>
                {user.role !== UserRole.STAFF && (
                  <button onClick={() => handleDelete(med.id, med.name)} className="w-full py-4 bg-rose/10 text-crimson rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose/20 transition-all flex items-center justify-center gap-2">
                     <Trash2 size={16}/> Archive Formulation
                  </button>
                )}
              </div>
           </div>

           <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-white">
              <div className="flex justify-between items-start mb-12">
                 <div>
                    <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Clinical Data Record</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Technical Particulars & Pricing</p>
                 </div>
                 <button onClick={() => setViewingMed(null)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-300 transition-colors"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] block">Active API Composition</label>
                    <p className="text-sm font-bold text-slate-700 uppercase leading-relaxed border-b pb-2 border-slate-50">{med.saltComposition || 'N/A'}</p>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] block">Market Pricing (Unit)</label>
                    <p className="text-sm font-bold text-crimson uppercase leading-relaxed border-b pb-2 border-slate-50">${(med.price || 0).toFixed(2)} (+{med.gst}% GST)</p>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] block">Galenical Form</label>
                    <p className="text-sm font-bold text-slate-700 uppercase leading-relaxed border-b pb-2 border-slate-50">{med.classification}</p>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] block">Expiry Threshold</label>
                    <p className={`text-sm font-bold uppercase leading-relaxed border-b pb-2 border-slate-50 ${isExpired(med.expiry) ? 'text-crimson' : 'text-slate-700'}`}>
                       {new Date(med.expiry).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const RestockModal = ({ med }: { med: Medicine }) => {
    const [qty, setQty] = useState(100);
    const [exp, setExp] = useState(med.expiry);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      try {
        restockMedicine(med.id, qty, exp);
        alert(`Clinical Protocol Success: Formulation ${med.name} replenished by ${qty} units.`);
        setRestockItem(null);
      } catch (err) {
        alert('Clinical Audit Error: Restock authorization failed.');
      }
    };

    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
         <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 animate-in zoom-in duration-300 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 tracking-tight uppercase mb-2">Restock Protocol</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-8">Authorizing Refill: {med.name}</p>
            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dispatch Quantity</label>
                  <input required type="number" className="w-full p-4 bg-slate-50 border-none rounded-xl ring-1 ring-slate-100 font-black text-lg outline-none" value={qty} onChange={e => setQty(parseInt(e.target.value))} />
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Batch Expiry Target</label>
                  <input required type="date" className="w-full p-4 bg-slate-50 border-none rounded-xl ring-1 ring-slate-100 font-bold text-sm outline-none" value={exp} onChange={e => setExp(e.target.value)} />
               </div>
               <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-4 bg-crimson text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Authorize Refill</button>
                  <button type="button" onClick={() => setRestockItem(null)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-xl font-bold uppercase text-[10px] tracking-widest">Abort</button>
               </div>
            </form>
         </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto bg-white min-h-full">
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="w-full lg:w-auto">
           <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Inventory Lifecycle Monitor</h2>
           <p className="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-[0.2em]">Enterprise Stock Ledger</p>
           
           <div className="flex flex-wrap gap-2 mt-6">
              {(['ALL', 'IN_STOCK', 'NEAR_EXPIRY', 'EXPIRED', 'LOW_STOCK', 'OUT_OF_STOCK'] as InventoryFilter[]).map(f => (
                <button 
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeFilter === f ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}
                >
                  {f.replace('_', ' ')} Refills
                </button>
              ))}
           </div>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
           <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
              <input 
                 className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-xl ring-1 ring-slate-100 focus:ring-2 focus:ring-crimson outline-none font-bold text-sm transition-all"
                 placeholder="Search formulation nodes..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto">
               <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100 bg-slate-50/50">
                     <th className="px-10 py-6">Formulation Identity</th>
                     <th className="px-10 py-6 text-center">Protocol Volume</th>
                     <th className="px-10 py-6 text-center">Safety Status</th>
                     <th className="px-10 py-6 text-right">Price (Unit)</th>
                     <th className="px-10 py-6"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {filteredMeds.map(med => {
                    const status = getClinicalStatus(med);
                    const StatusIcon = status.icon;
                    return (
                      <tr key={med.id} onClick={() => setViewingMed(med)} className="hover:bg-slate-50/50 transition-all cursor-pointer group">
                         <td className="px-10 py-8">
                            <div className="flex items-center gap-6">
                               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border-2 ${status.border} ${status.bg}`}>
                                  <Pill size={24} className={status.color}/>
                               </div>
                               <div>
                                  <p className="font-black text-slate-800 text-base uppercase tracking-tight leading-none group-hover:text-crimson transition-colors">{med.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{med.brand} • {med.strength}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-8 text-center">
                            <div className="flex flex-col items-center gap-2">
                               <p className={`text-lg font-black ${status.color}`}>{med.stock} <span className="text-[9px]">U</span></p>
                               <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${status.color.replace('text', 'bg')}`} style={{ width: `${Math.min((med.stock / 500) * 100, 100)}%` }}></div>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-8 text-center">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-current ${status.bg} ${status.color}`}>
                               <StatusIcon size={12}/> {status.label}
                            </div>
                         </td>
                         <td className="px-10 py-8 text-right font-black text-slate-800 text-lg tracking-tighter">${(med.price || 0).toFixed(2)}</td>
                         <td className="px-10 py-8 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                               <button onClick={(e) => { e.stopPropagation(); setRestockItem(med); }} className="p-3 bg-white border border-slate-200 shadow-sm rounded-xl text-slate-400 hover:text-crimson transition-all" title="Initialize Restock"><RefreshCw size={16}/></button>
                               {user.role !== UserRole.STAFF && (
                                 <button onClick={(e) => { e.stopPropagation(); handleDelete(med.id, med.name); }} className="p-3 bg-white border border-slate-200 shadow-sm rounded-xl text-slate-400 hover:text-crimson transition-all" title="Archive Node"><Trash2 size={16}/></button>
                               )}
                               <ChevronRight className="text-slate-300" size={24}/>
                            </div>
                         </td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
         </div>
      </div>

      {viewingMed && <MedicineDetailModal med={viewingMed} />}
      {restockItem && <RestockModal med={restockItem} />}
    </div>
  );
};

export default InventoryManagement;
