
import React, { useState, useMemo } from 'react';
import { useDatabase } from '../../store/database';
import { Search, Plus, Edit, Trash2, X, Tag, Package, AlertCircle, Building2, ShieldAlert, BadgePercent, DollarSign, FileText } from 'lucide-react';
import { Medicine, User, UserRole } from '../../types';

const MedicineManagement: React.FC<{ user: User }> = ({ user }) => {
  const { medicines, addMedicine, updateMedicine, deleteMedicine, suppliers } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);

  const CLASSIFICATIONS = [
    'Tablet - Antibiotics & Antimicrobials',
    'Tablet - Analgesics & Anti-inflammatory',
    'Tablet - Cardiovascular',
    'Tablet - Antidiabetic',
    'Tablet - Central Nervous System',
    'Capsule - Antibiotics',
    'Syrup - Pediatric',
    'Injection - Clinical',
    'Ointment - Topical'
  ];

  // Clinical Status Color Logic
  const getClinicalStatus = (med: Medicine) => {
    const expiryDate = new Date(med.expiry);
    const today = new Date();
    const isExpired = expiryDate < today;
    const diffDays = (expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
    const isNearExpiry = diffDays > 0 && diffDays <= 30;
    const isLowStock = med.stock <= med.criticalStockLimit && med.stock > 0;
    const isOutOfStock = med.stock <= 0;

    if (isExpired) return { color: 'text-red-600', border: 'border-red-500', bg: 'bg-red-50', ring: 'ring-red-50', label: 'Expired' };
    if (isLowStock || isOutOfStock) return { color: 'text-yellow-600', border: 'border-yellow-500', bg: 'bg-yellow-50', ring: 'ring-yellow-50', label: isOutOfStock ? 'No Stock' : 'Low Stock' };
    return { color: 'text-green-600', border: 'border-green-500', bg: 'bg-green-50', ring: 'ring-green-50', label: 'In Stock' };
  };

  // Include expired medicines but filter by search/category
  const filteredMeds = medicines.filter(m => {
    const matchesFilter = categoryFilter === 'All' || m.classification.includes(categoryFilter);
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.brand.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenModal = (med?: Medicine) => {
    if (user.role === UserRole.STAFF && !med) return; 
    setEditingMed(med || null);
    setIsModalOpen(true);
  };

  const MedicineModal = () => {
    const [formData, setFormData] = useState<Partial<Medicine>>(editingMed || {
      id: `MED${Date.now().toString().slice(-6)}`,
      name: '', brand: '', saltComposition: '', classification: CLASSIFICATIONS[0], strength: '', 
      prescriptionRequired: false, expiry: '', mrp: 0, 
      price: 0, gst: 12, supplierId: suppliers[0]?.id || '', stock: 0, 
      criticalStockLimit: 10, status: 'ACTIVE'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (editingMed) {
          updateMedicine(editingMed.id, formData);
          alert(`Clinical Protocol Success: Formulation ${formData.name} records updated.`);
        } else {
          addMedicine(formData as Medicine);
          alert(`Clinical Protocol Success: New formulation ${formData.name} authorized.`);
        }
        setIsModalOpen(false);
      } catch (err) {
        alert("Clinical Audit Error: Authorization protocol failure.");
      }
    };

    const isReadOnly = user.role === UserRole.STAFF;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-100">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
            <h3 className="text-lg font-bold text-slate-800">{editingMed ? 'Medicine profile' : 'Add new medicine'}</h3>
            <button onClick={() => setIsModalOpen(false)} className="hover:bg-slate-50 p-2 rounded-full transition-colors text-slate-400"><X size={20}/></button>
          </div>
          <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Medicine name</label>
              <input required disabled={isReadOnly} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-crimson font-medium text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Brand / Manufacturer</label>
              <input required disabled={isReadOnly} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Chemical identity (API)</label>
              <input required disabled={isReadOnly} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm" value={formData.saltComposition} onChange={e => setFormData({...formData, saltComposition: e.target.value})} />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Unit MRP ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                <input required disabled={isReadOnly} type="number" step="0.01" className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm" value={formData.mrp} onChange={e => setFormData({...formData, mrp: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Selling price ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                <input required disabled={isReadOnly} type="number" step="0.01" className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm text-crimson" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">GST percentage (%)</label>
              <div className="relative">
                <BadgePercent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                <input required disabled={isReadOnly} type="number" className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm" value={formData.gst} onChange={e => setFormData({...formData, gst: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Strength</label>
              <input required disabled={isReadOnly} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm" value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Classification</label>
              <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm" value={formData.classification} onChange={e => setFormData({...formData, classification: e.target.value})}>
                {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Supplier source</label>
              <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm" value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})}>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
              </select>
            </div>

            <div className="space-y-2 col-span-1">
              <label className="text-xs font-bold text-slate-500 block ml-1">Safety lock</label>
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      disabled={isReadOnly}
                      checked={formData.prescriptionRequired} 
                      onChange={e => setFormData({...formData, prescriptionRequired: e.target.checked})} 
                    />
                    <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-crimson transition-colors"></div>
                    <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Prescription required</span>
                </label>
                <ShieldAlert size={16} className={formData.prescriptionRequired ? 'text-crimson' : 'text-slate-300'} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Regulatory expiry</label>
              <input required disabled={isReadOnly} type="date" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm" value={formData.expiry} onChange={e => setFormData({...formData, expiry: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Initial stock</label>
                <input required disabled={isReadOnly} type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Critical limit</label>
                <input required disabled={isReadOnly} type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm" value={formData.criticalStockLimit} onChange={e => setFormData({...formData, criticalStockLimit: parseInt(e.target.value) || 0})} />
              </div>
            </div>

            {!isReadOnly && (
              <div className="md:col-span-2 pt-4">
                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-base shadow-lg hover:bg-black transition-all">
                  {editingMed ? 'Update medicine' : 'Add medicine'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 bg-white min-h-full">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="w-full lg:w-auto">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Medicine ledger</h2>
          <p className="text-slate-400 font-medium text-xs mt-0.5">Authorized medication registry</p>
        </div>
        <div className="flex flex-1 gap-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-crimson font-medium text-sm" placeholder="Search medicines..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
        </div>
        {user.role !== UserRole.STAFF && (
          <button onClick={() => handleOpenModal()} className="bg-crimson text-white px-6 py-3 rounded-xl font-bold shadow-md flex items-center gap-2 w-full lg:w-auto justify-center hover:brightness-110 transition-all text-sm">
            <Plus size={20} /> Add medicine
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMeds.map(med => {
          const status = getClinicalStatus(med);
          return (
            <div key={med.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm border-2 transition-all flex flex-col group relative ${status.border}`}>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-800 text-base line-clamp-1 tracking-tight">{med.name}</h3>
                  <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border border-current ${status.bg} ${status.color}`}>
                    {status.label}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-[11px] font-medium text-slate-400">{med.brand} • {med.strength}</p>
                  {med.prescriptionRequired && (
                    <span className="px-1.5 py-0.5 bg-rose/5 text-crimson rounded-full text-[9px] font-bold border border-rose/10 flex items-center gap-1">
                      <FileText size={10}/> Rx
                    </span>
                  )}
                </div>
                
                <div className="p-3 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                   <p className="text-[10px] font-bold text-slate-400 mb-0.5">Composition</p>
                   <p className="text-xs font-medium text-slate-600 italic line-clamp-1">{med.saltComposition}</p>
                </div>

                <div className="mt-auto space-y-3 pt-3 border-t border-dashed border-slate-100">
                  <div className="flex justify-between items-end">
                      <div>
                          <p className="text-[10px] font-bold text-slate-400">Price</p>
                          <p className="text-xl font-bold text-crimson tracking-tight">${(med.price || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400">Stock</p>
                          <p className={`font-bold text-base ${status.color}`}>{med.stock} <span className="text-[10px]">units</span></p>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(med)} className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-1 shadow-sm"><Edit size={12}/> Edit</button>
                      {user.role !== UserRole.STAFF && (
                        <button onClick={() => { if(confirm('Remove this medicine?')) { deleteMedicine(med.id); alert('Medicine removed.'); } }} className="p-2 bg-rose/10 text-crimson rounded-lg hover:bg-crimson hover:text-white transition-all"><Trash2 size={14}/></button>
                      )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && <MedicineModal />}
    </div>
  );
};

export default MedicineManagement;
