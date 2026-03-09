
import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../../store/database';
import { User, Medicine, BillItem, Bill, UserRole, RecurringOrder } from '../../types';
import { 
  Search, ShoppingCart, X, Plus, Minus,
  CreditCard, Smartphone, Banknote,
  AlertTriangle, ShieldAlert, CheckCircle, Trash2, RefreshCw, Archive
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LasaWarningModal, LasaWarning } from '../../components/shared/LasaWarningModal';

const Billing: React.FC<{ user: User }> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { medicines, createBill, users, addRecurringOrder, prescriptions } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<BillItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [showReceipt, setShowReceipt] = useState<Bill | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('WALK-IN');
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState(30);

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
          total: (med?.price || i.price || 0) * (i.quantity || 1)
        };
      });
      setCart(items);
      if (user.role === UserRole.CUSTOMER) setSelectedCustomerId(user.id);
    }
  }, [location.state, medicines, user]);

  const cartTotal = cart.reduce((acc, i) => acc + i.total, 0);
  const tax = cartTotal * 0.12;
  const grandTotal = cartTotal + tax;

  const customerPrescriptions = useMemo(() => {
    if (selectedCustomerId === 'WALK-IN') return [];
    return prescriptions.filter(p => p.customerId === selectedCustomerId && p.status === 'PROCESSED' && !p.isDeleted);
  }, [prescriptions, selectedCustomerId]);

  const cartAnalysis = useMemo(() => {
    const ready: BillItem[] = [];
    const locked: { item: BillItem; reason: string }[] = [];
    
    cart.forEach(item => {
      const med = medicines.find(m => m.id === item.medicineId);
      if (!med) return;

      if (!med.prescriptionRequired) {
        ready.push(item);
      } else {
        if (selectedCustomerId === 'WALK-IN') {
          locked.push({ item, reason: "Prescription required for this formulation." });
          return;
        }

        const rx = customerPrescriptions.find(p => p.id === selectedPrescriptionId || (p as any)._id === selectedPrescriptionId);
        if (!rx) {
          locked.push({ item, reason: "No valid prescription selected." });
          return;
        }

        const authorizedName = rx.approvedMedicines?.find(n => n.toLowerCase() === med.name.toLowerCase()) || 
                              rx.alternatives?.find(a => a.suggestedName.toLowerCase() === med.name.toLowerCase() && a.status === 'ACCEPTED')?.suggestedName;
        
        if (!authorizedName) {
          locked.push({ item, reason: "Formulation not authorized in selected prescription." });
        } else {
          const usageCount = rx.medicineUsage[authorizedName] || 0;
          if (usageCount >= 2) {
            locked.push({ item, reason: "Usage quota exceeded (2/2) for this prescription." });
          } else {
            ready.push(item);
          }
        }
      }
    });
    return { ready, locked };
  }, [cart, medicines, selectedPrescriptionId, customerPrescriptions, selectedCustomerId]);

  const handleAddToCart = async (med: Medicine, bypassLasa: boolean = false) => {
    if (new Date(med.expiry) < new Date()) return;
    if (med.stock <= 0) return;

    const existing = cart.find(i => i.medicineId === med.id);
    
    // Only perform LASA check if adding for the first time, and we aren't bypassing
    if (!existing && !bypassLasa) {
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
      if (existingInCart) {
        if (existingInCart.quantity >= med.stock) {
          alert(`Operational Cap: Only ${med.stock} units available in node.`);
          return prev;
        }
        return prev.map(i => i.medicineId === med.id ? {...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price} : i);
      }
      return [...prev, { 
        medicineId: med.id, 
        name: med.name, 
        quantity: 1, 
        price: med.price, 
        gst: med.gst, 
        total: med.price,
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
    const customer = users.find(u => u.id === selectedCustomerId);
    const refillId = location.state?.refillId;

    if (cartAnalysis.locked.length > 0) {
      alert("Cannot proceed: Some items in cart are locked due to prescription requirements.");
      return;
    }

    proceedWithBill();
  };

  const proceedWithBill = () => {
    const customer = users.find(u => u.id === selectedCustomerId);
    const refillId = location.state?.refillId;

    const bill: Bill = {
      id: `INV${Date.now()}`,
      customerId: selectedCustomerId,
      customerName: customer?.fullName || 'Walk-in Patient',
      date: new Date().toISOString(),
      items: cartAnalysis.ready,
      subTotal: cartTotal,
      tax,
      discount: 0,
      grandTotal,
      paymentMode,
      processedBy: `${user.role}: ${user.fullName}`,
      prescriptionId: selectedPrescriptionId,
      status: 'PAID'
    };

    try {
      createBill(bill, refillId, selectedPrescriptionId);

      if (isRecurring && selectedCustomerId !== 'WALK-IN') {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + repeatInterval);
        const newRecurring: RecurringOrder = {
          id: `REC${Date.now()}`,
          customerId: selectedCustomerId,
          items: cart.map(i => ({ medicineId: i.medicineId, name: i.name, quantity: i.quantity })),
          deliveryDate: new Date().toISOString(),
          repeatIntervalDays: repeatInterval,
          nextReorderDate: nextDate.toISOString(),
          status: 'ACTIVE',
          history: [],
          actionLog: [{ date: new Date().toISOString(), action: 'RESUME', reason: 'Initial checkout subscription registration', performedBy: user.role }]
        };
        addRecurringOrder(newRecurring);
      }

      setShowReceipt(bill);
      setCart([]);
      setShowCheckoutModal(false);
      if (refillId) navigate('/customer/recurring', { replace: true });
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 h-full animate-in fade-in duration-500 overflow-hidden">
      <div className="xl:col-span-3 flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center mb-6">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input className="w-full pl-14 pr-5 py-3.5 bg-slate-50 border-none rounded-xl font-medium text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-crimson" placeholder="Search medicines..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {medicines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map(m => {
             const expired = new Date(m.expiry) < new Date();
             const outOfStock = m.stock <= 0;
             const isLow = m.stock > 0 && m.stock <= m.criticalStockLimit;

             return (
              <div key={m.id} className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all flex flex-col h-[300px] relative group hover:shadow-md ${expired || outOfStock ? 'grayscale' : ''}`}>
                 {expired ? (
                    <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-2xl">
                       <div className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-wider shadow-lg flex items-center gap-2">
                          <ShieldAlert size={14}/> Expired
                       </div>
                    </div>
                 ) : outOfStock ? (
                    <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-2xl">
                       <div className="bg-slate-800 text-white px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-wider shadow-lg flex items-center gap-2">
                          <Archive size={14}/> Out of stock
                       </div>
                    </div>
                 ) : null}

                 <div className="flex-1">
                   <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-slate-800 leading-tight line-clamp-2">{m.name}</h3>
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold">{m.brand} • {m.strength}</p>
                   
                   {isLow && (
                     <div className="mt-3 p-2 bg-red-50 rounded-xl border border-red-100 inline-flex items-center gap-2">
                        <AlertTriangle size={12} className="text-red-500" />
                        <span className="text-[10px] font-bold text-red-600">Low stock: {m.stock} left</span>
                     </div>
                   )}
                 </div>

                 <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-slate-800 tracking-tight">${m.price.toFixed(2)}</p>
                      <p className="text-[9px] font-bold text-slate-300">Available: {m.stock}</p>
                    </div>
                    <button 
                       disabled={expired || outOfStock}
                       onClick={() => handleAddToCart(m)}
                       className="p-4 bg-crimson text-white rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-30 disabled:shadow-none"
                    ><Plus size={20}/></button>
                 </div>
              </div>
             );
           })}
        </div>
      </div>

      <div className="xl:col-span-1 h-[calc(100vh-8rem)]">
         <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-50 flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><ShoppingCart className="text-crimson" size={24} /> Cart</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
               {cartAnalysis.ready.map(item => (
                 <div key={item.medicineId} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group transition-all hover:bg-white hover:shadow-sm">
                    <button onClick={() => removeFromCart(item.medicineId)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    <p className="font-bold text-slate-800 text-xs leading-tight pr-6">{item.name}</p>
                    <div className="flex justify-between items-center mt-4">
                       <div className="flex items-center bg-white rounded-lg border border-slate-100 p-1 shadow-sm">
                          <button onClick={() => updateCartQuantity(item.medicineId, -1)} className="p-1 hover:bg-slate-50 rounded text-slate-400"><Minus size={12}/></button>
                          <span className="px-2 text-xs font-bold text-slate-700 min-w-[1.5rem] text-center">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.medicineId, 1)} className="p-1 hover:bg-slate-50 rounded text-crimson"><Plus size={12}/></button>
                       </div>
                       <span className="font-bold text-slate-800 text-sm tracking-tight">${item.total.toFixed(2)}</span>
                    </div>
                 </div>
               ))}
               {cartAnalysis.locked.length > 0 && (
                 <div className="space-y-2 mt-4">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest px-2">Locked Items (Rx Required)</p>
                    {cartAnalysis.locked.map(({ item, reason }) => (
                      <div key={item.medicineId} className="p-4 bg-red-50 rounded-2xl border border-red-100 relative group">
                         <button onClick={() => removeFromCart(item.medicineId)} className="absolute top-3 right-3 text-red-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                         <p className="font-bold text-slate-500 text-xs leading-tight pr-6">{item.name}</p>
                         <p className="text-[9px] font-bold text-red-600 mt-1 italic">{reason}</p>
                         <div className="flex justify-between items-center mt-3">
                            <span className="text-xs font-bold text-slate-400">Qty: {item.quantity}</span>
                            <span className="font-bold text-slate-400 text-sm tracking-tight">${item.total.toFixed(2)}</span>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
               {cart.length === 0 && <div className="text-center py-16 text-slate-300 font-bold text-xs tracking-wider opacity-40 italic">Cart is empty</div>}
            </div>

            <div className="pt-6 mt-4 border-t border-dashed space-y-3">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-slate-400">Total</span>
                  <span className="font-bold text-slate-800 text-2xl tracking-tight">${grandTotal.toFixed(2)}</span>
               </div>
               <button onClick={() => setShowCheckoutModal(true)} disabled={cart.length === 0} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-base shadow-md hover:bg-black transition-all">Checkout</button>
            </div>
         </div>
      </div>

      {showCheckoutModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 relative animate-in zoom-in duration-300">
              <button onClick={() => setShowCheckoutModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-300"><X size={20}/></button>
              <h3 className="text-xl font-bold text-slate-800 mb-6 tracking-tight">Checkout</h3>
              
              <div className="space-y-5">
                 {user.role !== UserRole.CUSTOMER && (
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-500 ml-1">Customer</label>
                       <select className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none border border-slate-100" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                          <option value="WALK-IN">Walk-in patient</option>
                          {users.filter(u => u.role === UserRole.CUSTOMER).map(u => <option key={u.id || (u as any)._id} value={u.id || (u as any)._id}>{u.fullName}</option>)}
                       </select>
                    </div>
                 )}

                 {selectedCustomerId !== 'WALK-IN' && (
                    <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                       <div className="flex items-center justify-between">
                          <label className="flex items-center gap-3 cursor-pointer">
                             <div className="relative">
                                <input type="checkbox" className="sr-only peer" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} />
                                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-crimson transition-colors"></div>
                                <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                             </div>
                             <span className="text-xs font-bold text-slate-600">Enable recurring order</span>
                          </label>
                          <RefreshCw size={16} className={`text-crimson ${isRecurring ? 'animate-spin-slow' : ''}`} />
                       </div>
                       {isRecurring && (
                          <div className="space-y-1 animate-in slide-in-from-top duration-300">
                             <label className="text-[10px] font-bold text-slate-400 ml-1">Interval (days)</label>
                             <input type="number" min="7" className="w-full p-3 bg-white border border-blue-100 rounded-xl font-bold text-sm" value={repeatInterval} onChange={e => setRepeatInterval(parseInt(e.target.value))} />
                             <p className="text-[9px] text-blue-400 font-medium">Cycle starts from delivery date.</p>
                          </div>
                       )}
                    </div>
                 )}

                 <div className="grid grid-cols-3 gap-2">
                    {(['CASH', 'CARD', 'UPI'] as const).map(mode => (
                      <button key={mode} onClick={() => setPaymentMode(mode)} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${paymentMode === mode ? 'border-crimson bg-red-50 text-crimson' : 'border-slate-50 text-slate-400'}`}>
                         {mode === 'CASH' ? <Banknote size={18}/> : mode === 'CARD' ? <CreditCard size={18}/> : <Smartphone size={18}/>}
                         <span className="text-[10px] font-bold">{mode}</span>
                      </button>
                    ))}
                 </div>

                 <button onClick={finalizeBill} className="w-full py-4 bg-crimson text-white rounded-2xl font-bold text-base shadow-lg hover:brightness-110 active:scale-95 transition-all mt-4">
                    Complete payment
                 </button>
              </div>
           </div>
        </div>
      )}

      {showReceipt && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-10 text-center animate-in slide-in-from-bottom duration-500">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg mb-6"><CheckCircle size={32}/></div>
              <h4 className="text-xl font-bold text-slate-800 tracking-tight">Payment successful</h4>
              <p className="text-xs text-slate-400 font-bold mt-1 mb-8">Invoice: {showReceipt.id.slice(-8)}</p>
              <button onClick={() => setShowReceipt(null)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-base shadow-lg hover:bg-black transition-all">Close</button>
           </div>
        </div>
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
                handleAddToCart(pendingLasaMedicine, true); // bypass LASA on retry
              }
              setPendingLasaMedicine(null);
           }}
         />
      )}
    </div>
  );
};

export default Billing;
