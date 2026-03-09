
import React, { useState } from 'react';
import { useDatabase } from '../../store/database';
import { User, Prescription } from '../../types';
import { FileText, Plus, X, Upload, Eye, ShieldCheck, ShoppingCart, AlertTriangle, Check, Ban, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerPrescriptions: React.FC<{ user: User }> = ({ user }) => {
  const { prescriptions, uploadPrescription, respondToAlternative, updatePrescription } = useDatabase();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewPrescription, setViewPrescription] = useState<Prescription | null>(null);

  const myPrescriptions = prescriptions.filter(p => p.customerId === user.id && !p.isDeleted);

  const isPrescriptionValidDate = (p: Prescription) => {
    if (!p.expiryDate) return false;
    return new Date(p.expiryDate) > new Date();
  };

  const isPrescriptionValidQuota = (p: Prescription) => {
    if (p.status !== 'PROCESSED') return true;
    const approved = [...(p.approvedMedicines || [])];
    const acceptedAlts = p.alternatives?.filter(a => a.status === 'ACCEPTED').map(a => a.suggestedName) || [];
    const allAuthorized = [...approved, ...acceptedAlts];
    
    // If there are pending alternatives, it's not "expired quota" yet, it's "pending review"
    const hasPendingAlts = p.alternatives?.some(a => a.status === 'PENDING');
    if (hasPendingAlts && allAuthorized.length === 0) return true; 

    if (allAuthorized.length === 0) return false;
    return allAuthorized.some(name => (p.medicineUsage[name] || 0) < 2);
  };

  const handleOrderApprovedMeds = (p: Prescription) => {
    const approved = [...(p.approvedMedicines || [])];
    const acceptedAlts = p.alternatives?.filter(a => a.status === 'ACCEPTED').map(a => a.suggestedName) || [];
    const allMeds = [...approved, ...acceptedAlts].filter(name => (p.medicineUsage[name] || 0) < 2);
    
    if (allMeds.length === 0) return alert("System Error: Usage quota exceeded for all authorized formulations.");
    navigate('/customer/billing', { state: { prefillRxId: p.id, meds: allMeds } });
  };

  const handleRenew = (oldRx: Prescription) => {
    if (confirm('Initiate clinical renewal protocol? Old prescription will be archived.')) {
      updatePrescription(oldRx.id, { isDeleted: true });
      setIsModalOpen(true);
    }
  };

  const UploadModal = () => {
    const [formData, setFormData] = useState({ doctor: '', meds: '' });
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const handleUpload = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsUploading(true);
      const compositeHash = `${formData.doctor}-${formData.meds}-${Date.now()}`.toLowerCase();
      
      const newP: Prescription = {
        id: `PRES${Date.now()}`,
        customerId: user.id,
        doctorName: formData.doctor,
        medicines: formData.meds,
        fileUrl: preview || 'https://placehold.co/400x600/DC143C/white?text=Prescription+Scan',
        fileHash: compositeHash,
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
        medicineUsage: {}
      };

      const result = await uploadPrescription(newP);
      setIsUploading(false);
      
      if (result === 'SUCCESS') {
        setIsModalOpen(false);
        alert("Clinical Audit Initiated: Evidence submitted to Pharmacist verification desk.");
      } else {
        alert("Regulatory System Error: Prescription audit failed verification.");
      }
    };

    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4">
        <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-2xl p-16 animate-in zoom-in duration-300 flex flex-col md:flex-row gap-12">
          <div className="flex-1">
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-2">Clinical Submission</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10">Upload authorized physician sheet</p>
            <form onSubmit={handleUpload} className="space-y-6">
              <input required className="w-full p-5 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-100 focus:ring-2 focus:ring-[#DC143C] outline-none font-bold text-sm uppercase" placeholder="Issuing Doctor Name" value={formData.doctor} onChange={e => setFormData({...formData, doctor: e.target.value})} />
              <textarea required className="w-full p-5 bg-slate-50 border-none rounded-2xl ring-1 ring-slate-100 focus:ring-2 focus:ring-[#DC143C] outline-none font-bold text-sm min-h-[100px]" placeholder="Transcribe prescribed medicines..." value={formData.meds} onChange={e => setFormData({...formData, meds: e.target.value})} />
              <div className="relative border-2 border-dashed border-slate-200 p-8 rounded-[2rem] text-center bg-slate-50 hover:bg-white hover:border-[#DC143C] transition-all cursor-pointer group">
                <Upload className="mx-auto text-slate-300 mb-2 group-hover:scale-110" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Clinical Scan (IMG)</p>
                <input type="file" required className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
              </div>
              <button disabled={isUploading} className="w-full py-6 bg-[#DC143C] text-white rounded-[2rem] font-black text-lg shadow-xl shadow-red-100 disabled:opacity-50 transition-all uppercase tracking-widest">
                {isUploading ? 'Authorizing...' : 'Upload for Verification'}
              </button>
            </form>
          </div>
          <div className="hidden md:block w-60 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 relative overflow-hidden">
             {preview ? <img src={preview} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-slate-200"><FileText size={60}/></div>}
             <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg text-slate-300 hover:text-red-500"><X size={20}/></button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-10 rounded-[3rem] shadow-sm border">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Health Vault.</h2>
          <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">Authorized Clinical Records History</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#DC143C] text-white px-10 py-5 rounded-[1.8rem] font-black shadow-xl shadow-red-100 flex items-center gap-3 hover:scale-105 transition-all uppercase tracking-widest"><Plus size={24} /> Register Clinical Sheet</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {myPrescriptions.map(p => {
          const validDate = isPrescriptionValidDate(p);
          const validQuota = isPrescriptionValidQuota(p);
          const isExpired = p.status === 'PROCESSED' && (!validDate || !validQuota);
          const hasAlts = p.alternatives && p.alternatives.some(a => a.status === 'PENDING');
          
          return (
            <div key={p.id} onClick={() => setViewPrescription(p)} className={`bg-white p-10 rounded-[4rem] shadow-sm border-2 transition-all group cursor-pointer flex flex-col h-[520px] relative overflow-hidden ${isExpired ? 'grayscale border-red-100 bg-red-50/20' : 'hover:border-[#DC143C] hover:shadow-2xl border-slate-50'}`}>
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 rounded-[1.8rem] bg-slate-50 flex items-center justify-center text-[#DC143C] shadow-inner"><FileText size={32} /></div>
                <div className="flex flex-col items-end gap-2">
                   <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${p.status === 'PROCESSED' ? (!isExpired ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700') : 'bg-orange-50 text-orange-600 animate-pulse'}`}>
                    {p.status === 'PROCESSED' ? (!isExpired ? 'Authorized' : (!validDate ? 'Expired: Date' : 'Expired: Quota')) : p.status}
                   </div>
                   {hasAlts && <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[8px] font-black uppercase tracking-widest border border-indigo-100">Review Suggested Alts</div>}
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 leading-none uppercase tracking-tight">DR. {p.doctorName}</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase mt-4 tracking-widest">Clinical Audit: {p.id.slice(-6)}</p>
              
              <div className="flex-1 mt-8 overflow-hidden space-y-4">
                 <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-2">Authorization Quota</p>
                 <div className="space-y-3">
                    {p.approvedMedicines?.slice(0, 3).map((m, i) => (
                      <div key={i} className="flex justify-between items-center">
                         <span className="text-xs font-bold text-slate-500 uppercase">{m}</span>
                         <span className={`text-[10px] font-black uppercase ${ (p.medicineUsage[m] || 0) >= 2 ? 'text-red-500' : 'text-slate-400'}`}>
                            {p.medicineUsage[m] || 0}/2 Uses
                         </span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="mt-auto pt-8 border-t border-dashed flex items-center justify-between">
                 <span className={`text-[9px] font-black uppercase tracking-widest ${!validDate ? 'text-red-500' : 'text-slate-300'}`}>
                   {p.expiryDate ? `Valid Until: ${new Date(p.expiryDate).toLocaleDateString()}` : 'PENDING'}
                 </span>
                 <span className="text-[#DC143C] font-black text-[10px] flex items-center gap-1 uppercase tracking-widest group-hover:translate-x-1 transition-transform">View Details <Eye size={16}/></span>
              </div>
            </div>
          );
        })}
      </div>

      {viewPrescription && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/95 backdrop-blur-2xl p-4">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col md:flex-row h-[85vh] animate-in zoom-in duration-300">
            <div className="flex-1 bg-slate-100 flex items-center justify-center p-12 border-r relative group">
               <img src={viewPrescription.fileUrl} className="max-h-full rounded-[3rem] shadow-2xl border-[8px] border-white transition-transform group-hover:scale-[1.01]" />
            </div>

            <div className="w-full md:w-[450px] p-16 flex flex-col justify-between bg-white h-full">
              <div className="space-y-10 overflow-y-auto custom-scrollbar pr-4 -mr-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Clinical Mapping</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Physician Authority: Dr. {viewPrescription.doctorName}</p>
                  </div>
                  <button onClick={() => setViewPrescription(null)} className="p-3 hover:bg-slate-50 rounded-full text-slate-300"><X size={32}/></button>
                </div>

                <div className="space-y-8">
                  {viewPrescription.status === 'PROCESSED' && (
                    <>
                      <div className="p-8 bg-green-50/50 rounded-[3rem] border border-green-100">
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldCheck size={14}/> Dispense Authorization</p>
                        <div className="space-y-4">
                           {viewPrescription.approvedMedicines?.map((m, i) => (
                             <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-green-100/50">
                               <span className="text-xs font-black uppercase text-slate-700">{m}</span>
                               <span className={`text-[10px] font-black px-3 py-1 rounded-full ${(viewPrescription.medicineUsage[m] || 0) >= 2 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
                                 {(viewPrescription.medicineUsage[m] || 0)}/2 Used
                               </span>
                             </div>
                           ))}
                        </div>
                      </div>

                      {viewPrescription.alternatives && viewPrescription.alternatives.length > 0 && (
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 ml-1"><AlertTriangle size={14}/> Clinical Substitution</p>
                          <div className="space-y-3">
                             {viewPrescription.alternatives.map((alt, i) => (
                               <div key={i} className={`p-6 rounded-[2.5rem] border transition-all ${alt.status === 'ACCEPTED' ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                                  <div className="flex justify-between items-start mb-2">
                                     <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Substitue for {alt.originalName}</p>
                                     <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase ${alt.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-400'}`}>{alt.status}</span>
                                  </div>
                                  <p className="text-sm font-black text-slate-800 uppercase leading-tight mb-4">{alt.suggestedName}</p>
                                  
                                  {alt.status === 'PENDING' && (
                                    <div className="flex gap-2">
                                       <button onClick={() => respondToAlternative(viewPrescription.id, alt.suggestedName, 'ACCEPTED')} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"><Check size={14}/> Accept</button>
                                       <button onClick={() => respondToAlternative(viewPrescription.id, alt.suggestedName, 'REJECTED')} className="flex-1 py-3 bg-white text-red-500 border border-red-100 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Ban size={14}/> Reject</button>
                                    </div>
                                  )}
                               </div>
                             ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="pt-10 space-y-4">
                {(viewPrescription.status === 'PROCESSED' && isPrescriptionValidDate(viewPrescription) && isPrescriptionValidQuota(viewPrescription)) ? (
                   <button onClick={() => handleOrderApprovedMeds(viewPrescription)} className="w-full py-7 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-black active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-3"><ShoppingCart size={24} /> Dispatch Authorization</button>
                ) : viewPrescription.status === 'PROCESSED' && (
                  <button onClick={() => handleRenew(viewPrescription)} className="w-full py-7 bg-red-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-3"><RefreshCw size={24} /> Renew Clinical Audit</button>
                )}
                <button onClick={() => setViewPrescription(null)} className="w-full py-5 bg-slate-50 text-slate-400 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Dismiss Audit Window</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && <UploadModal />}
    </div>
  );
};

export default CustomerPrescriptions;
