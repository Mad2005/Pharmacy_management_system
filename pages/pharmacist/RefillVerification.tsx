
import React, { useState } from 'react';
import { useDatabase } from '../../store/database';
import { RecurringOrder, User } from '../../types';
import { 
  ShieldCheck, Clock, X, Check, AlertCircle, 
  History, User as UserIcon, MessageSquare, 
  Trash2, Pause, Play, FastForward, CheckCircle2, ChevronRight, RefreshCw
} from 'lucide-react';

const RefillVerification: React.FC = () => {
  const { recurringOrders, users, respondToEarlyRefill } = useDatabase();
  const [selectedOrder, setSelectedOrder] = useState<RecurringOrder | null>(null);
  const [feedback, setFeedback] = useState('');

  const requests = recurringOrders.filter(ro => ro.earlyRefillRequest?.status === 'PENDING');
  const allAudits = recurringOrders.filter(ro => ro.actionLog.length > 0);

  const handleResponse = (status: 'APPROVED' | 'DENIED') => {
    if (!selectedOrder) return;
    respondToEarlyRefill(selectedOrder.id, status, feedback);
    setSelectedOrder(null);
    setFeedback('');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end bg-white p-10 rounded-[3rem] shadow-sm border">
        <div>
           <h2 className="text-4xl font-black text-gray-800 tracking-tighter uppercase">Refill Audit Desk.</h2>
           <p className="text-gray-400 font-medium text-sm mt-1 uppercase tracking-widest">Clinical review & subscription overrides</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-indigo-100">
              {requests.length} Requests Pending
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Request Queue */}
        <div className="lg:col-span-1 space-y-6">
           <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2 px-2">
              <Clock className="text-[#DC143C]" /> Pending Overrides
           </h3>
           <div className="space-y-4">
              {requests.map(order => {
                const customer = users.find(u => u.id === order.customerId);
                return (
                  <div key={order.id} onClick={() => setSelectedOrder(order)} className={`p-6 bg-white rounded-[2.5rem] border-2 transition-all cursor-pointer hover:shadow-xl ${selectedOrder?.id === order.id ? 'border-indigo-500 shadow-lg' : 'border-slate-50'}`}>
                     <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600"><UserIcon size={24}/></div>
                        <span className="text-[8px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">Early Refill</span>
                     </div>
                     <p className="font-black text-slate-800 text-sm uppercase">{customer?.fullName || 'Patient'}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Requested {new Date(order.earlyRefillRequest!.requestedAt).toLocaleDateString()}</p>
                     <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Stated Reason</p>
                        <p className="text-xs text-slate-600 italic line-clamp-2">"{order.earlyRefillRequest?.reason}"</p>
                     </div>
                  </div>
                );
              })}
              {requests.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed">
                   <ShieldCheck className="mx-auto text-slate-100 mb-4" size={48} />
                   <p className="text-slate-300 font-black uppercase text-[10px]">Queue Clear</p>
                </div>
              )}
           </div>
        </div>

        {/* Center: Detail View */}
        <div className="lg:col-span-2 space-y-10">
           {selectedOrder ? (
              <div className="bg-white p-12 rounded-[4rem] shadow-sm border animate-in slide-in-from-right duration-300">
                 <div className="flex justify-between items-start mb-10">
                    <div>
                       <h4 className="text-3xl font-black text-gray-800 tracking-tighter uppercase leading-none">Clinical Review Node</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3">Auth Ref: {selectedOrder.id}</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="p-3 hover:bg-slate-50 rounded-full text-slate-300"><X size={32}/></button>
                 </div>

                 <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="p-8 bg-slate-50 rounded-[3rem] space-y-6">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Medication Summary</p>
                       <div className="space-y-4">
                          {selectedOrder.items.map(i => (
                             <div key={i.medicineId} className="flex justify-between items-center text-sm font-black text-slate-700 uppercase">
                                <span>{i.name}</span>
                                <span className="text-[#DC143C]">x{i.quantity}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[3rem] space-y-6">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Adherence Pulse</p>
                       <div className="flex items-end gap-2">
                          <p className="text-4xl font-black text-slate-800">{selectedOrder.history.length}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Past Successes</p>
                       </div>
                       <p className="text-xs text-slate-500 font-medium">Next standard refill scheduled for {new Date(selectedOrder.nextReorderDate).toLocaleDateString()}</p>
                    </div>
                 </div>

                 <div className="space-y-6 mb-10">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <MessageSquare size={14}/> Decision Feedback / Notes
                    </label>
                    <textarea 
                       className="w-full p-8 bg-slate-50 border-none rounded-[2.5rem] ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500 font-medium text-sm min-h-[150px] outline-none"
                       placeholder="Transcribe clinical verification notes or denial reasons..."
                       value={feedback}
                       onChange={e => setFeedback(e.target.value)}
                    />
                 </div>

                 <div className="flex gap-4">
                    <button onClick={() => handleResponse('APPROVED')} className="flex-1 py-7 bg-green-500 text-white rounded-[2rem] font-black text-xl shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest">
                       <Check size={28}/> Authorize Dispatch
                    </button>
                    <button onClick={() => handleResponse('DENIED')} className="flex-1 py-7 bg-red-500 text-white rounded-[2rem] font-black text-xl shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest">
                       <X size={28}/> Deny Request
                    </button>
                 </div>
              </div>
           ) : (
              <div className="space-y-10">
                 <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2 px-2">
                    <History className="text-slate-400" /> Subscription Action Logs
                 </h3>
                 <div className="grid grid-cols-1 gap-6">
                    {allAudits.map(order => {
                      const customer = users.find(u => u.id === order.customerId);
                      return (
                        <div key={order.id} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                           <div className="flex justify-between items-center mb-8 border-b border-dashed pb-6">
                              <div className="flex items-center gap-6">
                                 <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-[#DC143C]"><RefreshCw size={28}/></div>
                                 <div>
                                    <p className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{customer?.fullName || 'Patient Node'}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Refill Cycle: {order.repeatIntervalDays} Days</p>
                                 </div>
                              </div>
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${order.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>{order.status}</span>
                           </div>
                           <div className="space-y-4">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Historical Audit Trail</p>
                              {order.actionLog.slice(0, 3).map((log, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                                   <div className={`p-3 rounded-xl ${log.action.includes('EARLY') ? 'bg-indigo-100 text-indigo-600' : log.action === 'PAUSE' ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'}`}>
                                      {log.action === 'PAUSE' ? <Pause size={14}/> : log.action === 'SKIP' ? <FastForward size={14}/> : <ShieldCheck size={14}/>}
                                   </div>
                                   <div>
                                      <p className="text-xs font-black text-slate-800 uppercase leading-none">{log.action} <span className="text-[10px] text-slate-400 font-bold ml-2">by {log.performedBy}</span></p>
                                      <p className="text-xs text-slate-500 mt-2 italic">"{log.reason}"</p>
                                      <p className="text-[9px] text-slate-300 font-black uppercase mt-2 tracking-widest">{new Date(log.date).toLocaleString()}</p>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      );
                    })}
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default RefillVerification;
