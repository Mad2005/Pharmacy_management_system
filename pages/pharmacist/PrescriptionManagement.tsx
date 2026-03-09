
import React, { useState } from 'react';
import { useDatabase } from '../../store/database';
import { FileText, CheckCircle, XCircle, Eye, Search, X, Plus, Trash2, ListChecks, MessageSquare, AlertTriangle, ShieldCheck, Clock, Check, ChevronRight, Ban, Pill } from 'lucide-react';
import { Prescription, PrescriptionAlternative, Medicine, RecurringOrder, UserRole } from '../../types';

const PrescriptionManagement: React.FC = () => {
  const { prescriptions, updatePrescription, deletePrescription, approvePrescriptionWithAlternatives, recurringOrders, respondToEarlyRefill, users, medicines, addAuditLog } = useDatabase();
  const [selectedP, setSelectedP] = useState<Prescription | null>(null);
  const [filterStatus, setFilterStatus] = useState<'PRESCRIPTIONS' | 'REFILL_REQUESTS'>('PRESCRIPTIONS');

  // Refill request processing state
  const [reviewRequest, setReviewRequest] = useState<RecurringOrder | null>(null);
  const [feedback, setFeedback] = useState('');

  const activePrescriptions = prescriptions.filter(p => !p.isDeleted);
  const refillRequests = recurringOrders.filter(ro => ro.earlyRefillRequest?.status === 'PENDING');

  const openVerificationModal = (p: Prescription) => {
    setSelectedP(p);
  };

  const handleRefillResponse = (status: 'APPROVED' | 'DENIED') => {
    if (!reviewRequest) return;
    respondToEarlyRefill(reviewRequest.id, status, feedback);
    
    addAuditLog({
      userId: 'PHARMACIST',
      userName: 'Pharmacist',
      userRole: UserRole.PHARMACIST,
      action: status === 'APPROVED' ? 'REFILL_APPROVED' : 'REFILL_DENIED',
      details: `${status} early refill for subscription ${reviewRequest.id}. Feedback: ${feedback}`,
      timestamp: new Date().toISOString()
    });

    setReviewRequest(null);
    setFeedback('');
  };

  const PrescriptionAuditModal = ({ p }: { p: Prescription }) => {
    const [approvedMeds, setApprovedMeds] = useState<string[]>([]);
    const [alts, setAlts] = useState<PrescriptionAlternative[]>([]);
    const [comment, setComment] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const customer = users.find(u => u.id === p.customerId);

    const handleApprove = () => {
      if (approvedMeds.length === 0 && alts.length === 0) {
        return alert("Audit Requirement: Select at least one formulation for authorization.");
      }
      approvePrescriptionWithAlternatives(p.id, approvedMeds, alts, comment);
      
      addAuditLog({
        userId: 'PHARMACIST',
        userName: 'Pharmacist',
        userRole: UserRole.PHARMACIST,
        action: 'PRESCRIPTION_APPROVED',
        details: `Approved prescription ${p.id} for ${customer?.fullName}. Approved meds: ${approvedMeds.join(', ')}`,
        timestamp: new Date().toISOString()
      });

      setSelectedP(null);
    };

    const addApprovedMed = (medName: string) => {
      if (!approvedMeds.includes(medName)) {
        setApprovedMeds(prev => [...prev, medName]);
      }
    };

    const addAlt = (orig: string, suggestedId: string) => {
      const med = medicines.find(m => m.id === suggestedId);
      if (!med) return;
      const newAlt: PrescriptionAlternative = {
        originalName: orig,
        suggestedMedId: med.id,
        suggestedName: med.name,
        notes: `Clinical substitution proposed by Pharmacist due to unavailability.`,
        status: 'PENDING'
      };
      setAlts(prev => [...prev, newAlt]);
    };

    const searchableMeds = medicines.filter(m => 
      (m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       m.saltComposition.toLowerCase().includes(searchTerm.toLowerCase())) &&
      new Date(m.expiry) > new Date() &&
      m.stock > 0
    );

    return (
      <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4">
        <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300">
          {/* Left: Document View */}
          <div className="flex-1 bg-slate-100 p-8 flex items-center justify-center overflow-hidden border-r">
             <div className="relative group w-full h-full flex items-center justify-center">
                <img src={p.fileUrl} alt="Prescription" className="max-h-full rounded-2xl shadow-2xl border-8 border-white transition-transform group-hover:scale-[1.02]" />
                <div className="absolute top-4 right-4 bg-white/80 p-3 rounded-xl backdrop-blur-sm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                   <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Clinical Audit ID: {p.id}</p>
                </div>
             </div>
          </div>

          {/* Right: Audit Desk */}
          <div className="w-full md:w-[520px] p-10 overflow-y-auto custom-scrollbar flex flex-col bg-white">
            <div className="flex justify-between items-start mb-8">
               <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Clinical Review Desk</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Patient: {customer?.fullName}</p>
               </div>
               <button onClick={() => setSelectedP(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-300"><X size={28}/></button>
            </div>

            <div className="space-y-8 flex-1">
               {/* Original Transcription */}
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Customer Transcription</p>
                  <p className="text-sm font-bold text-slate-700 italic">"{p.medicines}"</p>
               </div>

               {/* Inventory Search and Mapping */}
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Search size={14}/> Map Available Inventory</p>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-100 focus:ring-2 focus:ring-[#DC143C] outline-none font-bold text-sm"
                      placeholder="Search active formulations..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {searchTerm && (
                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-2 border p-2 rounded-2xl bg-slate-50">
                       {searchableMeds.map(m => (
                         <div key={m.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                            <div>
                               <p className="text-xs font-black uppercase text-slate-800">{m.name}</p>
                               <p className="text-[8px] font-bold text-slate-400 uppercase">{m.strength} • Stock: {m.stock}</p>
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => { addApprovedMed(m.name); setSearchTerm(''); }} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Check size={14}/></button>
                               <button onClick={() => { addAlt((p.medicines || '').split(',')[0].trim(), m.id); setSearchTerm(''); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"><AlertTriangle size={14}/></button>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>

               {/* Selected Authorized List */}
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-2"><CheckCircle size={14}/> Authorized Formulations</p>
                  <div className="space-y-2">
                     {approvedMeds.map((med, i) => (
                       <div key={i} className="flex justify-between items-center bg-green-50/50 p-4 rounded-2xl border border-green-100">
                          <p className="text-xs font-black uppercase text-slate-800">{med}</p>
                          <button onClick={() => setApprovedMeds(prev => prev.filter(m => m !== med))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                       </div>
                     ))}
                     {approvedMeds.length === 0 && <p className="text-[10px] text-slate-300 italic text-center py-4 border-2 border-dashed rounded-2xl">No formulations authorized yet.</p>}
                  </div>
               </div>

               {/* Substitutions */}
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={14}/> Clinical Substitutions</p>
                  <div className="space-y-2">
                     {alts.map((alt, i) => (
                       <div key={i} className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                          <div className="flex justify-between items-center">
                             <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase">Replacement for: {alt.originalName}</p>
                                <p className="text-xs font-black uppercase text-indigo-800">{alt.suggestedName}</p>
                             </div>
                             <button onClick={() => setAlts(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Pharmacist Signature Notes</label>
                  <textarea 
                    className="w-full p-6 bg-slate-50 border-none rounded-[2rem] ring-1 ring-slate-100 focus:ring-2 focus:ring-[#DC143C] outline-none font-medium text-sm min-h-[100px]"
                    placeholder="Provide clinical reasoning for substitution or verification..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
               </div>
            </div>

            <div className="pt-8 grid grid-cols-2 gap-4">
               <button onClick={handleApprove} className="py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2"><ShieldCheck size={18}/> Finalize Audit</button>
               <button onClick={() => { updatePrescription(p.id, { status: 'DENIED', feedback: comment }); setSelectedP(null); }} className="py-5 bg-red-50 text-red-600 rounded-[1.8rem] font-black text-sm uppercase tracking-widest border border-red-100 hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-2"><Ban size={18}/> Deny Rx</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Clinical Audit Queue</h2>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Verification and mapping portal</p>
        </div>
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border">
          <button onClick={() => setFilterStatus('PRESCRIPTIONS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${filterStatus === 'PRESCRIPTIONS' ? 'bg-white text-[#DC143C] shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>RX VERIFICATION ({activePrescriptions.filter(p=>p.status==='PENDING').length})</button>
          <button onClick={() => setFilterStatus('REFILL_REQUESTS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${filterStatus === 'REFILL_REQUESTS' ? 'bg-white text-[#DC143C] shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>EARLY REFILLS ({refillRequests.length})</button>
        </div>
      </div>

      {filterStatus === 'PRESCRIPTIONS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activePrescriptions.map(p => {
            const customer = users.find(u => u.id === p.customerId);
            return (
              <div key={p.id} onClick={() => openVerificationModal(p)} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 hover:shadow-2xl transition-all cursor-pointer group flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-[#DC143C] shadow-inner"><FileText size={28} /></div>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${p.status === 'PROCESSED' ? 'bg-green-50 text-green-700' : p.status === 'DENIED' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-600 animate-pulse'}`}>{p.status}</div>
                </div>
                <h3 className="text-lg font-black text-slate-800">{customer?.fullName || 'Guest Patient'}</h3>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Prescribed by: Dr. {p.doctorName}</p>
                <div className="mt-6 p-4 bg-slate-50 rounded-2xl line-clamp-2">
                   <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Transcribed Items</p>
                   <p className="text-xs font-bold text-slate-600 truncate">{p.medicines}</p>
                </div>
                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-300 uppercase">{new Date(p.uploadedAt).toLocaleDateString()}</span>
                  <div className="flex gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); if(confirm('Delete this clinical record?')) deletePrescription(p.id); }}
                      className="p-2 text-slate-200 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <span className="text-[#DC143C] font-black text-[10px] flex items-center gap-1 uppercase tracking-widest">Initiate Audit <Eye size={14}/></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {refillRequests.map(req => {
            const customer = users.find(u => u.id === req.customerId);
            return (
              <div key={req.id} onClick={() => setReviewRequest(req)} className="bg-white p-8 rounded-[3rem] shadow-sm border-2 border-indigo-100 hover:shadow-2xl transition-all cursor-pointer group flex flex-col h-full bg-indigo-50/20">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner"><Clock size={28} /></div>
                  <div className="px-3 py-1 bg-white text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">Audit Required</div>
                </div>
                <h3 className="text-lg font-black text-slate-800">{customer?.fullName || 'Patient'}</h3>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-4">Refill Cycle: {req.repeatIntervalDays} Days</p>
                <div className="p-4 bg-white rounded-2xl mb-4 border border-indigo-50">
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Items in Cycle</p>
                   <p className="font-black text-slate-700 uppercase truncate">{req.items.map(i=>i.name).join(', ')}</p>
                </div>
                <div className="mt-auto pt-6 border-t border-indigo-50 flex items-center justify-between">
                   <span className="text-[9px] font-black text-indigo-400 uppercase">Req: {new Date(req.earlyRefillRequest!.requestedAt).toLocaleDateString()}</span>
                   <span className="text-indigo-600 font-black text-[10px] flex items-center gap-1 uppercase tracking-widest group-hover:translate-x-1 transition-all">Audit Req <ChevronRight size={14}/></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedP && <PrescriptionAuditModal p={selectedP} />}

      {/* Refill Request Review Modal */}
      {reviewRequest && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/90 backdrop-blur-2xl p-4">
           <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-xl p-16 relative animate-in zoom-in duration-300">
              <button onClick={() => setReviewRequest(null)} className="absolute top-10 right-10 p-3 hover:bg-slate-100 rounded-full text-slate-300"><X size={28}/></button>
              <h3 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter uppercase leading-none">Override Audit</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10">Verification node: Early dispatch protocol</p>
              
              <div className="space-y-8">
                 <div className="p-8 bg-slate-50 rounded-[3rem] space-y-6">
                    <div>
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Patient Reasoning</p>
                       <p className="text-sm font-bold text-slate-700 italic">"{reviewRequest.earlyRefillRequest?.reason}"</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Pharmacist Audit Notes</label>
                    <textarea required className="w-full p-6 bg-slate-50 border-none rounded-3xl ring-1 ring-slate-100 focus:ring-2 focus:ring-[#DC143C] font-bold text-sm min-h-[120px]" placeholder="Transcribe clinical verification notes..." value={feedback} onChange={e => setFeedback(e.target.value)} />
                 </div>

                 <div className="flex gap-4">
                    <button onClick={() => handleRefillResponse('APPROVED')} className="flex-1 py-6 bg-green-500 text-white rounded-[2rem] font-black text-lg shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2"><Check size={20}/> Approve</button>
                    <button onClick={() => handleRefillResponse('DENIED')} className="flex-1 py-6 bg-red-50 text-red-600 rounded-[2rem] font-black text-lg shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2"><XCircle size={20}/> Deny</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionManagement;
