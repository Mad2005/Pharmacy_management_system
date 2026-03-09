
import React, { useState } from 'react';
import { useDatabase } from '../../store/database';
import { User, RecurringOrder } from '../../types';
import { 
  RefreshCw, Plus, AlertCircle, Clock, History, X, 
  MessageSquare, Info, Pause, Play, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecurringFills: React.FC<{ user: User }> = ({ user }) => {
  const { recurringOrders, updateRecurringOrder, requestEarlyRefill, medicines, addRecurringOrder } = useDatabase();
  const navigate = useNavigate();
  
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [modalType, setModalType] = useState<'PAUSE' | 'DELETE' | 'EARLY' | 'HISTORY' | 'CREATE' | null>(null);
  const [selectedSub, setSelectedSub] = useState<RecurringOrder | null>(null);
  const [reason, setReason] = useState('');

  // Create Refill State
  const [selectedMedId, setSelectedMedId] = useState('');
  const [qty, setQty] = useState(1);
  const [interval, setInterval] = useState(30);

  const mySubs = recurringOrders
    .filter(ro => ro.customerId === user.id)
    .filter(ro => {
      if (activeFilter === 'ACTIVE') return ro.status === 'ACTIVE' || ro.status === 'PAUSED';
      if (activeFilter === 'INACTIVE') return ro.status === 'COMPLETED';
      return true;
    })
    .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime());

  const getSubProgress = (sub: RecurringOrder) => {
    const next = new Date(sub.nextReorderDate).getTime();
    const now = new Date().getTime();
    const diff = Math.max(0, Math.ceil((next - now) / (1000 * 3600 * 24)));
    const total = sub.repeatIntervalDays;
    const percent = Math.min(100, Math.max(0, ((total - diff) / total) * 100));
    
    // Reorder is due if days remaining is 0 OR early refill is approved
    const isDue = (diff === 0 || sub.earlyRefillRequest?.status === 'APPROVED') && sub.status !== 'COMPLETED';
    const isWarning = diff <= 5 && diff > 0 && sub.status === 'ACTIVE';

    return { diff, percent, isDue, isWarning, nextDate: sub.nextReorderDate };
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (modalType === 'CREATE') {
      const med = medicines.find(m => m.id === selectedMedId);
      if (!med) return;
      const next = new Date();
      next.setDate(next.getDate() + interval);
      addRecurringOrder({
        id: `REC${Date.now()}`,
        customerId: user.id,
        items: [{ medicineId: med.id, name: med.name, quantity: qty }],
        deliveryDate: new Date().toISOString(),
        repeatIntervalDays: interval,
        nextReorderDate: next.toISOString(),
        status: 'ACTIVE',
        history: [],
        actionLog: [{ date: new Date().toISOString(), action: 'RESUME', reason: 'Subscription initialized by user', performedBy: 'CUSTOMER' }]
      });
      setModalType(null);
      return;
    }

    if (!selectedSub) return;

    if (modalType === 'EARLY') {
       if (!reason.trim()) {
          alert('System Requirement: A clinical reason is mandatory for this action.');
          return;
       }
    }

    if (modalType === 'PAUSE') {
      updateRecurringOrder(selectedSub.id, { status: selectedSub.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED' });
      alert(`Clinical Protocol Success: Refill cycle ${selectedSub.status === 'PAUSED' ? 'resumed' : 'paused'}.`);
    } else if (modalType === 'DELETE') {
      updateRecurringOrder(selectedSub.id, { status: 'COMPLETED' });
      alert('Clinical Protocol Success: Recurring node terminated and archived.');
    } else if (modalType === 'EARLY') {
      requestEarlyRefill(selectedSub.id, reason, 'CUSTOMER');
      alert('Clinical Protocol Success: Early refill request submitted for audit.');
    }

    setModalType(null);
    setReason('');
    setSelectedSub(null);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-10 rounded-[3rem] shadow-sm border">
        <div>
           <h2 className="text-4xl font-black text-gray-800 tracking-tighter uppercase leading-none">Refill Vault.</h2>
           <p className="text-gray-400 font-medium text-sm mt-2 uppercase tracking-widest">Clinical Dispatch Cycles</p>
           
           <div className="flex gap-2 mt-8">
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(f => (
                <button 
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeFilter === f ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}
                >
                  {f} Refills
                </button>
              ))}
           </div>
        </div>
        <button onClick={() => setModalType('CREATE')} className="bg-[#DC143C] text-white px-10 py-5 rounded-[1.5rem] font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 uppercase text-xs tracking-widest w-full md:w-auto justify-center">
          <Plus size={24} /> Initialize Refill
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {mySubs.map(sub => {
          const prog = getSubProgress(sub);
          const isEarlyApproved = sub.earlyRefillRequest?.status === 'APPROVED';
          const isInactive = sub.status === 'COMPLETED';
          
          return (
            <div key={sub.id} className={`bg-white p-10 rounded-[4rem] shadow-sm border-2 transition-all relative overflow-hidden group flex flex-col min-h-[600px] ${isInactive ? 'opacity-60 border-slate-100 bg-slate-50/30' : prog.isDue ? 'border-green-400 ring-4 ring-green-50' : prog.isWarning ? 'border-red-400 ring-4 ring-red-50' : 'border-slate-50'}`}>
              
              <div className="flex justify-between items-start mb-8">
                <div className={`p-6 rounded-[2.5rem] ${isInactive ? 'bg-slate-200 text-slate-400' : prog.isDue ? 'bg-green-100 text-green-600' : prog.isWarning ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                   <RefreshCw size={32} className={(prog.isDue && !isEarlyApproved && !isInactive) ? 'animate-spin-slow' : ''} />
                </div>
                <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${sub.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : sub.status === 'PAUSED' ? 'bg-orange-50 text-orange-700' : 'bg-slate-200 text-slate-500'}`}>
                  {sub.status}
                </div>
              </div>
              
              <div className="space-y-3 mb-8">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Medication Node</p>
                 {sub.items.map(item => (
                   <div key={item.medicineId} className="flex justify-between items-center bg-slate-50 p-5 rounded-[1.8rem] border border-slate-100 shadow-sm">
                      <span className="font-black text-sm text-gray-700 uppercase">{item.name}</span>
                      <span className="font-black text-xs text-[#DC143C] bg-white px-3 py-1 rounded-full shadow-sm">x{item.quantity}</span>
                   </div>
                 ))}
              </div>

              <div className="flex-1 space-y-6 pt-6 border-t border-dashed">
                 <div className="flex justify-between items-end">
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cycle Status</p>
                       <span className={`text-xl font-black uppercase tracking-tight ${isInactive ? 'text-slate-400' : isEarlyApproved ? 'text-indigo-600' : prog.isDue ? 'text-green-600' : prog.isWarning ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                          {isInactive ? 'Terminated' : isEarlyApproved ? 'Early Auth' : prog.isDue ? 'Reorder Ready' : 'In Progress'}
                       </span>
                    </div>
                    {!isInactive && (
                      <div className="text-right">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Interval: {sub.repeatIntervalDays}d</p>
                         <p className={`font-black text-sm ${prog.isDue ? 'text-green-600' : 'text-slate-600'}`}>{prog.diff} Days Left</p>
                      </div>
                    )}
                 </div>

                 {!isInactive && (
                    <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden shadow-inner p-1 border border-slate-200">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isEarlyApproved ? 'bg-indigo-500' : prog.isDue ? 'bg-green-500' : prog.isWarning ? 'bg-red-500' : 'bg-blue-500'}`} 
                        style={{ width: `${prog.percent}%` }}
                      ></div>
                    </div>
                 )}

                 {sub.earlyRefillRequest?.status === 'PENDING' && !isInactive && (
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-3">
                       <Clock size={20} className="text-orange-500 shrink-0"/>
                       <p className="text-[10px] font-black text-orange-600 uppercase tracking-tight italic">Pharmacist auditing override request.</p>
                    </div>
                 )}

                 <div className="grid grid-cols-1 gap-3 mt-auto pt-6">
                    <button 
                      type="button"
                      disabled={!prog.isDue || isInactive}
                      onClick={() => navigate('/customer/billing', { state: { preload: sub.items, refillId: sub.id, existingInterval: sub.repeatIntervalDays, isEarly: isEarlyApproved } })}
                      className={`py-6 rounded-[2rem] font-black text-lg uppercase tracking-widest transition-all shadow-xl ${prog.isDue && !isInactive ? 'bg-slate-900 text-white hover:bg-black active:scale-95' : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'}`}
                    >
                      {isInactive ? 'Node Inactive' : prog.isDue ? 'Reorder Now' : 'Cycle Locked'}
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        disabled={isInactive}
                        onClick={() => { setSelectedSub(sub); setModalType('PAUSE'); }} 
                        className={`py-4 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 border-2 ${isInactive ? 'bg-gray-50 text-gray-300 border-transparent' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-900 hover:text-slate-900'}`}
                      >
                         {sub.status === 'PAUSED' ? <><Play size={14}/> Resume</> : <><Pause size={14}/> Pause</>}
                      </button>
                      <button 
                        type="button"
                        disabled={isInactive || prog.isDue || sub.earlyRefillRequest?.status === 'PENDING'} 
                        onClick={() => { setSelectedSub(sub); setModalType('EARLY'); }} 
                        className={`py-4 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${isInactive || prog.isDue || sub.earlyRefillRequest?.status === 'PENDING' ? 'bg-gray-100 text-gray-300' : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-600 hover:text-white shadow-sm'}`}
                      >
                        <AlertCircle size={14}/> Early Request
                      </button>
                    </div>

                    <button 
                      type="button"
                      onClick={() => { setSelectedSub(sub); setModalType('HISTORY'); }} 
                      className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <History size={14}/> Audit Trail
                    </button>
                 </div>
              </div>
            </div>
          );
        })}
        {mySubs.length === 0 && (
           <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50">
              <Info className="mx-auto text-slate-100 mb-6" size={64} />
              <p className="text-slate-300 font-black uppercase text-xs tracking-[0.3em]">No refill nodes found in this sector.</p>
           </div>
        )}
      </div>

      {modalType && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4">
           <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-xl p-16 relative animate-in zoom-in duration-300">
              <button onClick={() => setModalType(null)} className="absolute top-10 right-10 p-3 hover:bg-slate-100 rounded-full text-slate-300"><X size={28}/></button>
              
              {modalType === 'HISTORY' && selectedSub ? (
                <div className="space-y-8">
                   <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Subscription Audit</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Lifecycle Log Registry</p>
                   <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                      {selectedSub.history.map((h, i) => (
                        <div key={i} className="p-6 bg-slate-50 rounded-[2.5rem] flex items-start gap-4 border border-slate-100">
                           <div className={`p-3 bg-white rounded-xl shadow-sm ${h.status === 'EMERGENCY' ? 'text-red-500' : h.status === 'DELAYED' ? 'text-orange-500' : 'text-green-500'}`}>
                             {h.status === 'DELAYED' ? <RefreshCw size={16} className="animate-spin-slow"/> : <CheckCircle2 size={16}/>}
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-700 uppercase">{h.status}</p>
                              <p className="text-xs text-slate-400 mt-1 italic">"{h.notes || 'No clinical notes recorded.'}"</p>
                              <p className="text-[9px] text-slate-300 font-black uppercase mt-2">{new Date(h.date).toLocaleString()}</p>
                           </div>
                        </div>
                      ))}
                      {selectedSub.actionLog.map((log, i) => (
                        <div key={'log-'+i} className="p-6 bg-slate-50/50 rounded-[2.5rem] flex items-start gap-4 border border-slate-50">
                           <div className="p-3 bg-white rounded-xl shadow-sm text-slate-300"><Info size={16}/></div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase">{log.action}</p>
                              <p className="text-[9px] text-slate-400 mt-1 italic">"{log.reason}"</p>
                              <p className="text-[8px] text-slate-300 font-black uppercase mt-2">{new Date(log.date).toLocaleString()}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              ) : modalType === 'CREATE' ? (
                <form onSubmit={handleActionSubmit} className="space-y-8">
                  <div className="text-center">
                     <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl"><RefreshCw size={36}/></div>
                     <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Initialize Cycle</h3>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Select Formulation</label>
                     <select required className="w-full p-5 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-100 font-black text-xs uppercase" value={selectedMedId} onChange={e => setSelectedMedId(e.target.value)}>
                        <option value="">Select medicine...</option>
                        {medicines.filter(m => m.stock > 0 && new Date(m.expiry) > new Date()).map(m => <option key={m.id} value={m.id}>{m.name} - {m.strength}</option>)}
                     </select>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Units Per Refill</label>
                           <input type="number" min="1" required className="w-full p-5 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-100 font-black text-sm" value={qty} onChange={e => setQty(parseInt(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Cycle (Days)</label>
                           <input type="number" min="7" required className="w-full p-5 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-100 font-black text-sm" value={interval} onChange={e => setInterval(parseInt(e.target.value))} />
                        </div>
                     </div>
                  </div>
                  <button type="submit" className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl shadow-xl hover:bg-black transition-all uppercase tracking-widest">Activate Subscription</button>
                </form>
              ) : (
                <form onSubmit={handleActionSubmit} className="space-y-8">
                  <div className="text-center">
                     <div className="w-20 h-20 bg-[#DC143C] text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl"><MessageSquare size={36}/></div>
                     <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">
                        {modalType === 'EARLY' ? 'Request Early Refill' : 'Confirm Action'}
                     </h3>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Clinical Justification (Mandatory)</label>
                     <textarea required className="w-full p-6 bg-slate-50 border-none rounded-3xl ring-1 ring-slate-100 focus:ring-2 focus:ring-[#DC143C] font-bold text-sm min-h-[120px]" placeholder="Transcribe reasoning for this override..." value={reason} onChange={e => setReason(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-lg shadow-xl hover:bg-black transition-all uppercase tracking-widest">Authorize Change</button>
                </form>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default RecurringFills;
