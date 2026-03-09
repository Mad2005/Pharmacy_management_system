
import React, { useState } from 'react';
import { useDatabase } from '../../store/database';
import { Truck, Plus, Edit, Trash2, X, Phone, Mail, Building, Package, ArrowRight, Pill, Info } from 'lucide-react';
import { Supplier, Medicine } from '../../types';

const SupplierManagement: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, medicines } = useDatabase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [viewingMedicine, setViewingMedicine] = useState<Medicine | null>(null);

  const SupplierModal = () => {
    const [formData, setFormData] = useState<Partial<Supplier>>(editingSupplier || {
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      isActive: true
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingSupplier) updateSupplier(editingSupplier.id, formData);
      else addSupplier({ ...formData, id: `S${Date.now()}` } as Supplier);
      setIsModalOpen(false);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-10 animate-in zoom-in-95 duration-300 border border-white/20">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Authorized Partner</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Supply chain node registration</p>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"><X size={24}/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Identity</label>
              <input required className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-crimson/20 font-bold transition-all" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lead Representative</label>
              <input required className="w-full p-5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-crimson/20 font-bold transition-all" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                <input required className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-crimson/20 transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <input required type="email" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-crimson/20 transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4 pt-6">
              <button type="submit" className="flex-1 py-5 bg-crimson text-white rounded-[2rem] font-black text-lg shadow-xl shadow-crimson/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest">Authorize Partner</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 pb-20 bg-white min-h-full animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
        <div>
           <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Supplier Network</h2>
           <p className="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-widest">Global logistics & procurement control</p>
        </div>
        <button onClick={() => { setEditingSupplier(null); setIsModalOpen(true); }} className="bg-crimson text-white px-10 py-5 rounded-[1.5rem] font-black shadow-xl shadow-crimson/20 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">
          <Plus size={24} /> Register Partner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {suppliers.map(s => (
          <div key={s.id} onClick={() => setSelectedSupplier(s)} className="bg-white p-10 rounded-[4rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-crimson/10 transition-all cursor-pointer group flex flex-col h-[420px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="p-6 bg-slate-50 rounded-[2.2rem] text-crimson group-hover:bg-crimson group-hover:text-white transition-all duration-500 border border-slate-100">
                <Building size={32} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={(e) => { e.stopPropagation(); setEditingSupplier(s); setIsModalOpen(true); }} className="p-3 bg-white text-slate-400 hover:text-crimson rounded-2xl transition-all border border-slate-100 shadow-sm"><Edit size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); if(confirm('Dissolve Partnership?')) { deleteSupplier(s.id); alert('Partnership dissolved successfully.'); } }} className="p-3 bg-rose/10 text-crimson hover:bg-crimson hover:text-white rounded-2xl transition-all border border-rose/10 shadow-sm"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-black text-slate-800 mb-2 leading-none uppercase tracking-tighter">{s.companyName}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">{s.contactPerson}</p>
            </div>
            
            <div className="mt-auto pt-8 flex items-center justify-between border-t border-dashed border-slate-100 relative z-10">
               <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.isActive ? 'bg-green-50 text-green-600 border-green-100' : 'bg-rose/5 text-crimson border-rose/10'}`}>
                 {s.isActive ? 'Verified' : 'Paused'}
               </span>
               <span className="text-crimson font-black text-[10px] flex items-center gap-2 group-hover:gap-4 transition-all uppercase tracking-widest">Medicine Log <ArrowRight size={16} /></span>
            </div>
          </div>
        ))}
      </div>

      {selectedSupplier && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row h-[85vh] border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="bg-crimson p-16 text-white flex flex-col justify-between w-full md:w-[400px] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <Building className="absolute -top-10 -left-10 w-64 h-64 rotate-12" />
              </div>
              <div className="relative z-10">
                <button onClick={() => setSelectedSupplier(null)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl mb-12 transition-colors"><X size={32}/></button>
                <h3 className="text-5xl font-black leading-[0.9] tracking-tighter uppercase mb-6">{selectedSupplier.companyName}</h3>
                <p className="text-white/50 font-black uppercase tracking-[0.3em] text-[10px]">Supply Chain Master node</p>
              </div>
              <div className="p-10 bg-white/10 rounded-[3rem] border border-white/10 shadow-inner relative z-10">
                 <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-4">Representative</p>
                 <p className="font-black text-2xl leading-tight uppercase tracking-tight">{selectedSupplier.contactPerson}</p>
                 <p className="text-sm opacity-60 mt-4 font-bold uppercase tracking-widest">{selectedSupplier.phone}</p>
              </div>
            </div>

            <div className="flex-1 p-16 overflow-y-auto custom-scrollbar bg-white">
              <div className="flex items-center justify-between mb-12">
                 <div>
                    <h4 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Inventory Log</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-widest">Sourced Formulation Registry</p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><Package size={36} className="text-crimson"/></div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {medicines.filter(m => m.supplierId === selectedSupplier.id).map((m) => (
                  <div key={m.id} onClick={() => setViewingMedicine(m)} className="p-10 bg-white rounded-[3rem] shadow-sm border border-slate-100 hover:border-crimson hover:shadow-xl transition-all cursor-pointer group flex items-center justify-between">
                    <div className="flex items-center gap-10">
                       <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-crimson font-black text-2xl group-hover:bg-crimson group-hover:text-white transition-all border border-slate-100">
                          {m.name?.charAt(0) || '?'}
                       </div>
                       <div>
                          <p className="font-black text-slate-800 text-2xl leading-none uppercase tracking-tight">{m.name}</p>
                          <p className="text-[10px] text-slate-400 font-black mt-3 uppercase tracking-widest">{m.classification} • Stock: {m.stock}</p>
                       </div>
                    </div>
                    <ArrowRight className="text-slate-200 group-hover:text-crimson transition-colors" size={28} />
                  </div>
                ))}
                {medicines.filter(m => m.supplierId === selectedSupplier.id).length === 0 && (
                   <div className="text-center py-24 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
                      <Info size={60} className="mx-auto text-slate-200 mb-6" />
                      <p className="text-slate-300 font-black uppercase tracking-widest italic">No active inventory node.</p>
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingMedicine && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4">
            <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-lg p-16 animate-in zoom-in duration-300 border border-slate-100">
               <div className="flex justify-between items-start mb-12">
                  <div className="w-24 h-24 bg-rose/5 rounded-[2.5rem] flex items-center justify-center text-crimson border border-rose/10">
                     <Pill size={48} />
                  </div>
                  <button onClick={() => setViewingMedicine(null)} className="p-3 hover:bg-slate-50 rounded-full transition-colors text-slate-400"><X size={32}/></button>
               </div>
               <div className="space-y-10">
                  <div>
                    <h5 className="text-[11px] font-black text-crimson uppercase tracking-[0.4em] mb-3">Audit Details</h5>
                    <h3 className="text-5xl font-black text-slate-800 leading-[0.9] tracking-tighter uppercase">{viewingMedicine.name}</h3>
                    <p className="text-xl font-bold text-slate-400 mt-6 uppercase tracking-widest">{viewingMedicine.brand}</p>
                  </div>
                  <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 grid grid-cols-2 gap-y-8">
                     <div><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Classification</p><p className="font-black text-slate-700 mt-1">{(viewingMedicine.classification || '').split(' - ')[1] || 'General'}</p></div>
                     <div className="text-right"><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Form</p><p className="font-black text-slate-700 mt-1">{(viewingMedicine.classification || '').split(' - ')[0] || 'N/A'}</p></div>
                     <div><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Current Stock</p><p className="font-black text-slate-700 mt-1">{viewingMedicine.stock} Units</p></div>
                     <div className="text-right"><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Unit Price</p><p className="font-black text-crimson mt-1">${(viewingMedicine.price || 0).toFixed(2)}</p></div>
                  </div>
               </div>
               <button onClick={() => setViewingMedicine(null)} className="w-full py-7 bg-slate-900 text-white rounded-[2rem] font-black text-xl mt-12 hover:bg-black transition-all uppercase tracking-widest shadow-2xl">Dismiss Profile</button>
            </div>
         </div>
      )}

      {isModalOpen && <SupplierModal />}
    </div>
  );
};

export default SupplierManagement;
