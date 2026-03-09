
import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '../../store/database';
import { User, Medicine, BillItem, Bill, Prescription, RecurringOrder } from '../../types';
import { Search, ShoppingBag, X, Lock, Unlock, Package, Upload, RefreshCw, AlertTriangle, Banknote, CreditCard, Smartphone, Plus, Minus, Trash2, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MedicineRecommendations } from '../../components/shared/MedicineRecommendations';
import { LasaWarningModal, LasaWarning } from '../../components/shared/LasaWarningModal';

const CustomerShop: React.FC<{ user: User }> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { medicines, createBill, prescriptions, addRecurringOrder, updateRecurringOrder } = useDatabase();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [cart, setCart] = useState<BillItem[]>([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState(30);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI'>('CARD');
  
  // Early Refill Handling
  const [replaceExistingCycle, setReplaceExistingCycle] = useState(true);

  // Recommendations
  const [selectedMedicineForAlternatives, setSelectedMedicineForAlternatives] = useState<Medicine | null>(null);

  // LASA Prevention State
  const [lasaWarnings, setLasaWarnings] = useState<LasaWarning[]>([]);
  const [pendingLasaMedicine, setPendingLasaMedicine] = useState<Medicine | null>(null);

  useEffect(() => {
    if (location.state?.preload) {
      const items = (location.state.preload as any[]).map(i => {
        const med = medicines.find(m => m.id === i.medicineId);
        return {
          medicineId: i.medicineId,
          name: i.name,
          quantity: i.quantity || 1,
          price: med?.price || i.price || 0,
          gst: med?.gst || 12,
          total: (med?.price || i.price || 0) * (i.quantity || 1),
          expiryDate: med?.expiry || i.expiryDate
        };
      });
      setCart(items);

      if (location.state.existingInterval) {
        setRepeatInterval(location.state.existingInterval);
        setIsRecurring(true);
      }
    }
  }, [location.state, medicines]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(medicines.map(m => (m.classification || '').split(' - ')[1] || 'General')))], [medicines]);

  const isPrescriptionValidDate = (p: Prescription) => {
    if (!p.expiryDate) return false;
    return new Date(p.expiryDate) > new Date();
  };

  const myPrescriptions = prescriptions.filter(p => p.customerId === user.id && !p.isDeleted);
  const myValidDatePrescriptions = myPrescriptions.filter(p => p.status === 'PROCESSED' && isPrescriptionValidDate(p));

  const cartAnalysis = useMemo(() => {
    const ready: BillItem[] = [];
    const locked: { item: BillItem; reason: string }[] = [];
    let linkedRxId: string | undefined = undefined;

    cart.forEach(item => {
      const med = medicines.find(m => m.id === item.medicineId);
      if (!med) return;

      if (new Date(med.expiry) < new Date()) {
        locked.push({ item, reason: "Regulatory Lock: Formulation Expired" });
        return;
      }

      if (!med.prescriptionRequired) {
        ready.push(item);
      } else {
        // Enforced logic: Pharmacist MUST list this medicine in an approved prescription
        const validRx = myValidDatePrescriptions.find(p => {
          const authorizedName = p.approvedMedicines?.find(n => n.toLowerCase() === med.name.toLowerCase()) || 
                                p.alternatives?.find(a => a.suggestedName.toLowerCase() === med.name.toLowerCase() && a.status === 'ACCEPTED')?.suggestedName;
          
          if (!authorizedName) return false;
          const usageCount = p.medicineUsage[authorizedName] || 0;
          return usageCount < 2; // ENFORCED: Maximum 2 uses per authorized medication
        });

        if (validRx) {
          ready.push(item);
          linkedRxId = validRx.id;
        } else {
          const authorizedButQuotaExceeded = myValidDatePrescriptions.find(p => {
             const name = p.approvedMedicines?.find(n => n.toLowerCase() === med.name.toLowerCase()) || 
                          p.alternatives?.find(a => a.suggestedName.toLowerCase() === med.name.toLowerCase() && a.status === 'ACCEPTED')?.suggestedName;
             return name && (p.medicineUsage[name] || 0) >= 2;
          });
          const expiredDateRx = myPrescriptions.find(p => p.status === 'PROCESSED' && !isPrescriptionValidDate(p));
          const pendingRx = myPrescriptions.find(p => p.status === 'PENDING');
          
          let reason = "Clinical audit required";
          if (authorizedButQuotaExceeded) reason = "Usage quota exceeded (2/2) – Renewal required";
          else if (expiredDateRx) reason = "Prescription expired (15-day validity ended)";
          else if (pendingRx) reason = "Awaiting Pharmacist verification node";
          else reason = "Formulation not authorized in your current clinical records";
          
          locked.push({ item, reason });
        }
      }
    });
    return { ready, locked, linkedRxId };
  }, [cart, medicines, myValidDatePrescriptions, myPrescriptions]);

  const addToCart = async (med: Medicine, bypassLasa: boolean = false) => {
    const expired = new Date(med.expiry) < new Date();
    if (expired || med.stock <= 0) return;
    
    const exists = cart.find(i => i.medicineId === med.id);

    // Only perform LASA check if adding for the first time, and we aren't bypassing
    if (!exists && !bypassLasa) {
      try {
        const res = await fetch('/api/verify-lasa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ medicineId: med.id })
        });
        if (res.ok) {
          const warnings = await res.json();
          if (warnings && warnings.length > 0) {
            setPendingLasaMedicine(med);
            setLasaWarnings(warnings);
            return; // Stop addition and show modal
          }
        }
      } catch (err) {
        console.error("LASA Verification failed", err);
      }
    }

    setCart(prev => {
      const existingInCart = prev.find(i => i.medicineId === med.id);
      if (existingInCart) return prev.map(i => i.medicineId === med.id ? { ...i, quantity: Math.min(i.quantity + 1, med.stock), total: Math.min(i.quantity + 1, med.stock) * i.price } : i);
      return [...prev, { 
        medicineId: med.id, 
        name: med.name, 
        quantity: 1, 
        price: med.price, 
        gst: med.gst, 
        total: med.price, 
        requiresPrescription: med.prescriptionRequired,
        expiryDate: med.expiry
      }];
    });
  };

  const updateCartQuantity = (medId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.medicineId === medId) {
          const med = medicines.find(m => m.id === medId);
          const newQty = Math.max(1, item.quantity + delta);
          if (med && newQty > med.stock) {
            alert(`Operational Cap: Only ${med.stock} units available.`);
            return item;
          }
          return { ...item, quantity: newQty, total: newQty * item.price };
        }
        return item;
      });
    });
  };

  const removeFromCart = (medId: string) => {
    setCart(prev => prev.filter(i => i.medicineId !== medId));
  };

  const finalizeBill = async () => {
    proceedWithBill();
  };

  const proceedWithBill = () => {
    const billItems = cartAnalysis.ready;
    if (billItems.length === 0) return;

    const cartSubtotal = billItems.reduce((acc, i) => acc + i.total, 0);
    const refillId = location.state?.refillId;
    const isEarly = location.state?.isEarly;
    const prescriptionId = cartAnalysis.linkedRxId;

    const bill: Bill = {
      id: `INV${Date.now()}`,
      customerId: user.id,
      customerName: user.fullName,
      date: new Date().toISOString(),
      items: billItems,
      subTotal: cartSubtotal,
      tax: cartSubtotal * 0.12,
      discount: 0,
      grandTotal: cartSubtotal * 1.12,
      paymentMode: paymentMode,
      processedBy: 'Patient Self-Service Node',
      status: 'PAID'
    };

    try {
      if (isEarly && !replaceExistingCycle && refillId) {
        updateRecurringOrder(refillId, { status: 'COMPLETED' });
        createBill(bill, undefined, prescriptionId);
      } else {
        createBill(bill, refillId, prescriptionId);
      }

      const shouldCreateNewRecord = isRecurring && (!refillId || (isEarly && !replaceExistingCycle));
      
      if (shouldCreateNewRecord) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + repeatInterval);
        const newRecurring: RecurringOrder = {
          id: `REC${Date.now()}`,
          customerId: user.id,
          items: billItems.map(i => ({ medicineId: i.medicineId, name: i.name, quantity: i.quantity })),
          deliveryDate: new Date().toISOString(),
          repeatIntervalDays: repeatInterval,
          nextReorderDate: nextDate.toISOString(),
          status: 'ACTIVE',
          history: [],
          actionLog: [{ date: new Date().toISOString(), action: 'RESUME', reason: isEarly ? 'Started new cycle following early refill' : 'Checkout subscription authorization', performedBy: 'CUSTOMER' }]
        };
        addRecurringOrder(newRecurring);
      }

      setCart(prev => prev.filter(item => !billItems.some(ready => ready.medicineId === item.medicineId)));
      setShowCheckoutModal(false);
      alert('Order Confirmed: Clinical node updated.');
      
      if (refillId) {
        navigate('/customer/recurring', { replace: true });
      } else {
        navigate('/customer/orders');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const shopMeds = useMemo(() => {
    return medicines.filter(m => {
      const isExpired = new Date(m.expiry) < new Date();
      if (isExpired) return false;
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.saltComposition.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || m.classification.includes(categoryFilter);
      const hasStock = m.stock > 0;
      return matchesSearch && matchesCategory && hasStock;
    });
  }, [medicines, searchTerm, categoryFilter]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 h-full animate-in fade-in duration-500 overflow-hidden">
      <div className="xl:col-span-3 flex flex-col h-[calc(100vh-8rem)]">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center mb-6">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input className="w-full pl-14 pr-5 py-3 bg-slate-50 border-none rounded-xl font-medium text-slate-700 outline-none ring-1 ring-slate-100 text-sm" placeholder="Search medicines..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
           <select className="px-4 py-3 bg-slate-50 rounded-xl font-bold text-xs outline-none border-none ring-1 ring-slate-100" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
           {shopMeds.map(m => {
              const isLowStock = m.stock <= m.criticalStockLimit;
              const borderColor = isLowStock ? 'border-yellow-400 shadow-yellow-50' : 'border-slate-100';
              return (
                 <div key={m.id} className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all flex flex-col h-[360px] relative group hover:shadow-md ${borderColor}`}>
                    <div className="flex justify-between items-start mb-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLowStock ? 'bg-yellow-50 text-yellow-600' : 'bg-slate-50 text-[#DC143C]'}`}><Package size={20} /></div>
                       <div className="flex flex-col items-end gap-2">
                          {m.prescriptionRequired && <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-bold tracking-wide border border-indigo-100">Prescription required</div>}
                          {isLowStock && <div className="px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full text-[9px] font-bold tracking-wide border border-yellow-100">Low stock</div>}
                       </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-800 tracking-tight line-clamp-2 leading-tight">{m.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">{m.brand} • {m.strength}</p>
                      <p className="text-xs font-medium text-slate-500 mt-3 line-clamp-2 italic">Composition: {m.saltComposition}</p>
                    </div>
                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                       <p className="text-lg font-bold text-slate-800 tracking-tight">${(m.price || 0).toFixed(2)}</p>
                       <div className="flex gap-2">
                         <button onClick={() => setSelectedMedicineForAlternatives(m)} className="p-2.5 rounded-lg font-bold text-xs transition-all active:scale-95 bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100 flex items-center gap-1.5 hover:bg-indigo-100" title="Find Alternatives">
                            <Sparkles size={14} /> AI Suggest
                         </button>
                         <button onClick={() => addToCart(m)} className="px-5 py-2.5 rounded-lg font-bold text-xs transition-all active:scale-95 bg-[#DC143C] text-white shadow-md">Add to cart</button>
                       </div>
                    </div>
                 </div>
              );
           })}
        </div>
      </div>

      <div className="xl:col-span-1 h-[calc(100vh-8rem)]">
         <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-50 flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6 tracking-tight"><ShoppingBag className="text-[#DC143C]" size={20} /> Your cart</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-1 px-1 space-y-6 pr-1">
               {cartAnalysis.ready.length > 0 && (
                 <div className="space-y-3">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider flex items-center gap-2 border-b pb-1"><Unlock size={12}/> Ready for checkout</p>
                    {cartAnalysis.ready.map(item => (
                      <div key={item.medicineId} className="p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-sm relative group transition-all hover:bg-white">
                         <button onClick={() => removeFromCart(item.medicineId)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                         <p className="font-bold text-slate-800 text-xs leading-tight pr-6">{item.name}</p>
                         <div className="flex justify-between items-center mt-3">
                            <div className="flex items-center bg-white rounded-lg border border-slate-100 p-0.5">
                               <button onClick={() => updateCartQuantity(item.medicineId, -1)} className="p-1 hover:bg-slate-50 rounded text-slate-400"><Minus size={10}/></button>
                               <span className="px-2 text-xs font-bold text-slate-700">{item.quantity}</span>
                               <button onClick={() => updateCartQuantity(item.medicineId, 1)} className="p-1 hover:bg-slate-50 rounded text-[#DC143C]"><Plus size={10}/></button>
                            </div>
                            <span className="font-bold text-slate-800 text-sm tracking-tight">${(item.total || 0).toFixed(2)}</span>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
               {cartAnalysis.locked.length > 0 && (
                 <div className="space-y-3">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-2 border-b pb-1"><Lock size={12}/> Locked items</p>
                    {cartAnalysis.locked.map(({ item, reason }) => (
                      <div key={item.medicineId} className="p-4 rounded-xl bg-red-50/50 border border-red-100/50">
                         <p className="font-bold text-slate-400 text-xs leading-tight">{item.name}</p>
                         <p className="text-[9px] font-bold text-red-500 mt-1 italic leading-tight">{reason}</p>
                         <div className="flex justify-between items-center mt-3 pt-2 border-t border-red-100/50">
                            <button onClick={() => navigate('/customer/prescriptions')} className="text-[9px] font-bold text-indigo-500 underline">View prescriptions</button>
                            <span className="font-bold text-slate-300 text-sm tracking-tight">${(item.total || 0).toFixed(2)}</span>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>

            <div className="pt-6 mt-4 border-t border-dashed space-y-3">
               {cartAnalysis.ready.length > 0 && (
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total (incl. tax)</span>
                    <span className="font-bold text-slate-800 text-xl tracking-tight">${(cartAnalysis.ready.reduce((acc, i) => acc + (i.total || 0), 0) * 1.12).toFixed(2)}</span>
                 </div>
               )}
               <button onClick={() => setShowCheckoutModal(true)} disabled={cartAnalysis.ready.length === 0} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-md hover:bg-black disabled:opacity-30 tracking-wide">Checkout</button>
            </div>
         </div>
      </div>

      {showCheckoutModal && (
         <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 animate-in zoom-in duration-300 relative">
               <button onClick={() => setShowCheckoutModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
               <h3 className="text-xl font-bold text-slate-800 mb-1 tracking-tight">Checkout</h3>
               <p className="text-xs text-slate-500 mb-6">Complete your order details below.</p>
               
               <div className="space-y-6">
                  <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                       <label className="flex items-center gap-3 cursor-pointer">
                          <div className="relative">
                             <input type="checkbox" className="sr-only peer" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} />
                             <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-[#DC143C] transition-colors"></div>
                             <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4"></div>
                          </div>
                          <span className="text-xs font-bold text-slate-600">Recurring order</span>
                       </label>
                       <RefreshCw size={16} className={`text-[#DC143C] ${isRecurring ? 'animate-spin-slow' : ''}`} />
                    </div>
                    {isRecurring && (
                       <div className="space-y-1.5 animate-in slide-in-from-top duration-300">
                          <label className="text-[10px] font-bold text-slate-400 tracking-wide">Refill interval (days)</label>
                          <input type="number" min="7" className="w-full p-3 bg-white border-none rounded-xl ring-1 ring-blue-100 font-bold text-sm" value={repeatInterval} onChange={e => setRepeatInterval(parseInt(e.target.value))} />
                          <p className="text-[9px] text-blue-400 font-medium">Order will be automatically placed every {repeatInterval} days.</p>
                       </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(['CASH', 'CARD', 'UPI'] as const).map(mode => (
                      <button key={mode} onClick={() => setPaymentMode(mode)} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${paymentMode === mode ? 'border-[#DC143C] bg-red-50 text-[#DC143C]' : 'border-slate-50 text-slate-400'}`}>
                         {mode === 'CASH' ? <Banknote size={18}/> : mode === 'CARD' ? <CreditCard size={18}/> : <Smartphone size={18}/>}
                         <span className="text-[10px] font-bold">{mode}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-6 bg-[#DC143C] rounded-2xl text-white shadow-lg">
                     <p className="text-[10px] font-bold text-white/70 tracking-wider mb-1">Total amount</p>
                     <p className="text-3xl font-bold tracking-tight">${(cartAnalysis.ready.reduce((acc, i) => acc + (i.total || 0), 0) * 1.12).toFixed(2)}</p>
                  </div>
                  <button onClick={finalizeBill} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-base shadow-md hover:bg-black active:scale-95 transition-all tracking-wide">Confirm order</button>
               </div>
            </div>
         </div>
       )}

       {selectedMedicineForAlternatives && (
          <MedicineRecommendations
            baseMedicine={selectedMedicineForAlternatives}
            user={user}
            onClose={() => setSelectedMedicineForAlternatives(null)}
            onAddToCart={addToCart}
          />
       )}

       {lasaWarnings.length > 0 && pendingLasaMedicine && (
          <LasaWarningModal
            warnings={lasaWarnings}
            onCancel={() => {
               setLasaWarnings([]);
               setPendingLasaMedicine(null);
            }}
            onProceed={() => {
               setLasaWarnings([]);
               if (pendingLasaMedicine) {
                 addToCart(pendingLasaMedicine, true);
               }
               setPendingLasaMedicine(null);
            }}
          />
       )}
    </div>
  );
};

export default CustomerShop;
