import React, { useMemo, useState } from 'react';
import { useDatabase } from '../../store/database';
import { User, RecurringOrder, DosageTiming } from '../../types';
import { 
  RefreshCw, Plus, Bell, TrendingUp, 
  Clock, CheckCircle2, ShieldAlert, Activity, 
  Stethoscope, Pill, ArrowRight, UserCheck, X, Trash2, Check, Timer
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CustomerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const { notifications, recurringOrders, prescriptions, medicationSchedules, medicationLogs, addSchedule, deleteSchedule, logMedicationStatus } = useDatabase();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    dosage: '',
    instruction: '',
    timing: [] as DosageTiming[]
  });

  const myNotifications = notifications.filter(n => n.customerId === user.id);
  const activeSubs = recurringOrders.filter(ro => ro.customerId === user.id && ro.status === 'ACTIVE');
  const mySchedules = medicationSchedules.filter(s => s.customerId === user.id && s.isActive);
  
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate Prescription Expiry Status
  const rxExpiryStatus = useMemo(() => {
    return prescriptions
      .filter(p => p.customerId === user.id && p.status === 'PROCESSED')
      .map(p => {
        const uploadedAt = new Date(p.uploadedAt);
        const diffDays = Math.ceil((new Date().getTime() - uploadedAt.getTime()) / (1000 * 3600 * 24));
        const remaining = 15 - diffDays;
        
        // Check if quota is exceeded
        const approved = [...(p.approvedMedicines || [])];
        const acceptedAlts = p.alternatives?.filter(a => a.status === 'ACCEPTED').map(a => a.suggestedName) || [];
        const allAuthorized = [...approved, ...acceptedAlts];
        const quotaExceeded = allAuthorized.length > 0 && allAuthorized.every(name => (p.medicineUsage[name] || 0) >= 2);

        return { ...p, remaining, isCritical: remaining <= 3 || quotaExceeded, quotaExceeded };
      })
      .filter(p => p.remaining >= 0 && !p.quotaExceeded); // Hide if quota exceeded
  }, [prescriptions, user.id]);

  const getSubProgress = (sub: RecurringOrder) => {
    const total = sub.repeatIntervalDays;
    const next = new Date(sub.nextReorderDate).getTime();
    const now = new Date().getTime();
    const diff = Math.max(0, Math.ceil((next - now) / (1000 * 3600 * 24)));
    const percent = Math.min(100, Math.max(0, ((total - diff) / total) * 100));
    return { diff, percent, isWarning: diff <= 3 };
  };

  const scheduleSlots: { label: DosageTiming; icon: any; color: string; bg: string; time: string }[] = [
    { label: 'MORNING', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', time: '08:00 AM' },
    { label: 'AFTERNOON', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50', time: '01:00 PM' },
    { label: 'EVENING', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50', time: '07:00 PM' },
    { label: 'NIGHT', icon: Pill, color: 'text-slate-500', bg: 'bg-slate-50', time: '10:00 PM' },
  ];

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.name || !newSchedule.dosage || newSchedule.timing.length === 0) return alert('Please fill all required fields');
    
    addSchedule({
      id: `SCH${Date.now()}`,
      customerId: user.id,
      medicineName: newSchedule.name,
      dosage: newSchedule.dosage,
      timing: newSchedule.timing,
      instruction: newSchedule.instruction,
      isActive: true
    });
    
    setNewSchedule({ name: '', dosage: '', instruction: '', timing: [] });
    setShowAddModal(false);
  };

  const toggleTiming = (t: DosageTiming) => {
    setNewSchedule(prev => ({
      ...prev,
      timing: prev.timing.includes(t) ? prev.timing.filter(i => i !== t) : [...prev.timing, t]
    }));
  };

  // Mock implementation for getLogStatus as it relies on medicationLogs which should be tracked properly
  const getLogStatus = (scheduleId: string, slot: DosageTiming) => {
    const log = medicationLogs.find(l => l.scheduleId === scheduleId && l.slot === slot && l.date === todayStr);
    return log?.status || 'PENDING';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Professional Welcome Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Stethoscope size={180} />
        </div>
        <div className="relative z-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold tracking-wide mb-3 border border-green-100">
            <UserCheck size={12}/> Verified patient
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight leading-none">
            Welcome back, <span className="text-[#DC143C]">{user.fullName.split(' ')[0]}</span>
          </h2>
          <p className="text-slate-400 font-bold tracking-wide text-[10px] mt-2">
            Patient ID: {user.id.slice(-8)} • Health score: <span className="text-[#DC143C]">{user.healthPoints || 100}%</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full lg:w-auto">
           <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs">
             <Plus size={18} /> Add schedule
           </button>
           <Link to="/customer/billing" className="bg-[#DC143C] text-white px-6 py-3 rounded-xl font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs">
             <Activity size={18} /> Order medicines
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Schedule & Active Refills */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Medication Schedule System */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <Clock className="text-[#DC143C]" size={20}/> Medication schedule
              </h3>
              <span className="text-[10px] font-bold text-slate-300 tracking-wide">Today: {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scheduleSlots.map((slot) => {
                const SlotIcon = slot.icon;
                const medsInSlot = mySchedules.filter(s => s.timing.includes(slot.label));
                
                return (
                  <div key={slot.label} className={`p-6 rounded-2xl border transition-all hover:shadow-md ${slot.bg} ${medsInSlot.length > 0 ? 'border-slate-200' : 'border-dashed border-slate-100 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm ${slot.color}`}>
                        <SlotIcon size={20} />
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 tracking-tight text-[10px]">{slot.label}</p>
                        <p className="text-[9px] font-bold text-slate-400">{slot.time}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {medsInSlot.map(m => {
                        const status = getLogStatus(m.id, slot.label);
                        return (
                          <div key={m.id} className="bg-white/90 p-4 rounded-xl border border-white shadow-sm group">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <span className="text-xs font-bold text-slate-700 leading-none block">{m.medicineName}</span>
                                <span className="text-[9px] font-bold text-slate-400 mt-1 block">{m.dosage} • {m.instruction}</span>
                              </div>
                              <button onClick={() => deleteSchedule(m.id)} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={12} />
                              </button>
                            </div>
                            
                            {/* Dose Status Tracking Buttons */}
                            <div className="flex gap-1.5">
                               <button 
                                onClick={() => logMedicationStatus({ scheduleId: m.id, date: todayStr, slot: slot.label, status: 'TAKEN' })}
                                className={`flex-1 flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all ${status === 'TAKEN' ? 'bg-green-500 border-green-600 text-white' : 'bg-white border-slate-100 text-slate-400 hover:bg-green-50'}`}
                               >
                                 <Check size={12}/>
                                 <span className="text-[8px] font-bold mt-1">Taken</span>
                               </button>
                               <button 
                                onClick={() => logMedicationStatus({ scheduleId: m.id, date: todayStr, slot: slot.label, status: 'DELAYED' })}
                                className={`flex-1 flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all ${status === 'DELAYED' ? 'bg-yellow-500 border-yellow-600 text-white' : 'bg-white border-slate-100 text-slate-400 hover:bg-yellow-50'}`}
                               >
                                 <Timer size={12}/>
                                 <span className="text-[8px] font-bold mt-1">Delayed</span>
                               </button>
                               <button 
                                onClick={() => logMedicationStatus({ scheduleId: m.id, date: todayStr, slot: slot.label, status: 'MISSED' })}
                                className={`flex-1 flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all ${status === 'MISSED' ? 'bg-red-500 border-red-600 text-white' : 'bg-white border-slate-100 text-slate-400 hover:bg-red-50'}`}
                               >
                                 <X size={12}/>
                                 <span className="text-[8px] font-bold mt-1">Missed</span>
                               </button>
                            </div>
                          </div>
                        );
                      })}
                      {medsInSlot.length === 0 && <p className="text-[9px] text-slate-400 font-bold italic py-2 text-center">No medications scheduled</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Refill Progress & Renewal Assistant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
               <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
                  <RefreshCw className="text-[#DC143C]" size={18}/> Recurring orders
               </h3>
               <div className="space-y-6">
                  {activeSubs.length > 0 ? activeSubs.map(sub => {
                    const prog = getSubProgress(sub);
                    return (
                      <div key={sub.id} className="space-y-2">
                        <div className="flex justify-between items-end">
                           <span className="font-bold text-slate-700 text-[10px] tracking-wide">{sub.items[0].name} {sub.items.length > 1 ? `+${sub.items.length-1}` : ''}</span>
                           <span className={`text-[9px] font-bold ${prog.isWarning ? 'text-red-500' : 'text-blue-500'}`}>{prog.diff} days left</span>
                        </div>
                        <div className="h-3 bg-slate-50 rounded-full overflow-hidden shadow-inner p-0.5 border border-slate-100">
                           <div className={`h-full rounded-full transition-all duration-1000 ${prog.isWarning ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${prog.percent}%` }}></div>
                        </div>
                        {prog.isWarning && <p className="text-[8px] font-bold text-red-600 animate-pulse">Refill due in 3 days</p>}
                      </div>
                    );
                  }) : (
                    <div className="py-8 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                       <p className="text-[10px] text-slate-300 font-bold tracking-wide">No recurring orders</p>
                    </div>
                  )}
               </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
               <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
                  <ShieldAlert className="text-[#DC143C]" size={18}/> Prescription renewals
               </h3>
               <div className="space-y-3">
                  {rxExpiryStatus.length > 0 ? rxExpiryStatus.map(rx => (
                    <div key={rx.id} className={`p-3 rounded-xl border transition-all ${rx.isCritical ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                       <div className="flex justify-between items-center mb-1">
                          <p className="text-[10px] font-bold text-slate-800">Dr. {rx.doctorName}</p>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${rx.isCritical ? 'bg-white text-red-600 border-red-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                             {rx.remaining}d left
                          </span>
                       </div>
                       <p className="text-[9px] font-bold text-slate-400 tracking-wide">ID: {rx.id.slice(-6)}</p>
                       {rx.isCritical && (
                         <button className="w-full mt-2 py-1.5 bg-red-600 text-white rounded-lg text-[8px] font-bold tracking-wide shadow-md hover:brightness-110 transition-all">
                            Request renewal
                         </button>
                       )}
                    </div>
                  )) : (
                    <div className="py-8 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                       <p className="text-[10px] text-slate-300 font-bold tracking-wide">No active prescriptions</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Notifications & Metrics */}
        <div className="space-y-8">
           <div className="bg-[#DC143C] p-8 rounded-3xl shadow-lg text-white relative overflow-hidden group">
              <div className="absolute -top-8 -right-8 opacity-10 group-hover:scale-110 transition-transform">
                 <Bell size={140} />
              </div>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 tracking-tight"><Bell size={20}/> Notifications</h3>
              <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                {myNotifications.slice(0, 5).map(n => (
                  <div key={n.id} className="p-4 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all cursor-pointer">
                     <p className="text-[10px] font-bold tracking-wide mb-1">{n.title}</p>
                     <p className="text-xs font-medium text-white/80 leading-relaxed line-clamp-3">{n.message}</p>
                     <div className="flex justify-between items-center mt-3">
                        <span className="text-[8px] text-white/40 font-bold">{new Date(n.createdAt).toLocaleDateString()}</span>
                        <ArrowRight size={12} className="text-white/40" />
                     </div>
                  </div>
                ))}
                {myNotifications.length === 0 && (
                   <div className="text-center py-16">
                      <p className="text-[10px] font-bold text-white/30 tracking-widest">No new notifications</p>
                   </div>
                )}
              </div>
           </div>

           <div className="bg-[#FDEBC0] p-8 rounded-3xl border border-white shadow-md group hover:shadow-lg transition-all">
              <h3 className="text-lg font-bold text-slate-800 mb-1 tracking-tight flex items-center gap-2"><Activity size={18}/> Health score</h3>
              <div className="mt-6 flex items-end gap-2">
                 <p className="text-5xl font-bold text-[#DC143C] tracking-tight">{user.healthPoints || 100}%</p>
                 <TrendingUp size={24} className="text-[#DC143C] mb-2 animate-bounce" />
              </div>
              <p className="text-[9px] font-bold text-gray-500 mt-3 tracking-wide leading-relaxed">
                 Calculated based on medication adherence.
              </p>
              <div className="mt-6 pt-6 border-t border-white/50 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-400">Platinum tier</span>
                 <CheckCircle2 size={20} className="text-[#DC143C]" />
              </div>
           </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative animate-in zoom-in duration-300">
             <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
             <h3 className="text-xl font-bold text-slate-800 mb-1 tracking-tight">Add medication</h3>
             <p className="text-[10px] font-bold text-slate-400 tracking-wide mb-6">Register a new medication schedule</p>
             
             <form onSubmit={handleAddSchedule} className="space-y-4">
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">Medicine name</label>
                 <input 
                  required
                  placeholder="e.g. Amoxicillin 500mg"
                  className="w-full p-3 bg-slate-50 border-none rounded-xl ring-1 ring-slate-100 focus:ring-2 focus:ring-[#DC143C] outline-none font-bold text-sm"
                  value={newSchedule.name}
                  onChange={e => setNewSchedule({...newSchedule, name: e.target.value})}
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">Dosage</label>
                   <input 
                    required
                    placeholder="e.g. 1 capsule"
                    className="w-full p-3 bg-slate-50 border-none rounded-xl ring-1 ring-slate-100 focus:ring-2 focus:ring-[#DC143C] outline-none font-bold text-sm"
                    value={newSchedule.dosage}
                    onChange={e => setNewSchedule({...newSchedule, dosage: e.target.value})}
                   />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">Instruction</label>
                   <input 
                    placeholder="e.g. After food"
                    className="w-full p-3 bg-slate-50 border-none rounded-xl ring-1 ring-slate-100 focus:ring-2 focus:ring-[#DC143C] outline-none font-bold text-sm"
                    value={newSchedule.instruction}
                    onChange={e => setNewSchedule({...newSchedule, instruction: e.target.value})}
                   />
                 </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1 block">Timing</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'].map((t) => (
                       <button 
                        key={t}
                        type="button"
                        onClick={() => toggleTiming(t as DosageTiming)}
                        className={`p-3 rounded-xl font-bold text-[10px] tracking-wide transition-all border-2 ${newSchedule.timing.includes(t as DosageTiming) ? 'bg-[#DC143C] border-[#DC143C] text-white shadow-md' : 'bg-white border-slate-50 text-slate-400'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
               </div>

               <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-base shadow-md hover:bg-black active:scale-95 transition-all tracking-wide mt-4">
                 Save schedule
               </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
