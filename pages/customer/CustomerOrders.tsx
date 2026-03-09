import React, { useState } from 'react';
import { useDatabase } from '../../store/database';
import { User, Bill } from '../../types';
import { History, Receipt, ArrowRight, Printer, X, ShoppingCart, RefreshCw, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CustomerOrders: React.FC<{ user: User }> = ({ user }) => {
  const { bills } = useDatabase();
  const navigate = useNavigate();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  
  const myBills = bills.filter(b => b.customerId === user.id || b.customerName === user.fullName);

  const handleBuyAgain = (bill: Bill) => {
    // Navigate to Shop/Billing page with items preloaded in state
    navigate('/customer/billing', { state: { preload: bill.items } });
  };

  const downloadPDF = (bill: Bill) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(220, 20, 60); // Crimson
    doc.text('PharmaFlow Pro', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Authorized Digital Tax Invoice', 105, 28, { align: 'center' });
    
    // Invoice Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Invoice ID: ${bill.id}`, 14, 45);
    doc.text(`Date: ${new Date(bill.date).toLocaleString()}`, 14, 52);
    doc.text(`Customer: ${bill.customerName}`, 14, 59);
    doc.text(`Payment: ${bill.paymentMode}`, 14, 66);
    
    // Table
    autoTable(doc, {
      startY: 75,
      head: [['Medicine', 'Quantity', 'Expiry', 'Unit Price', 'Total']],
      body: bill.items.map(item => [
        item.name,
        item.quantity,
        item.expiryDate || 'N/A',
        `$${(item.price || 0).toFixed(2)}`,
        `$${(item.total || 0).toFixed(2)}`
      ]),
      headStyles: { fillColor: [220, 20, 60] },
      foot: [
        ['', '', '', 'Subtotal', `$${((bill.grandTotal || 0) - (bill.tax || 0)).toFixed(2)}`],
        ['', '', '', 'Tax (GST)', `$${(bill.tax || 0).toFixed(2)}`],
        ['', '', '', 'Grand Total', `$${(bill.grandTotal || 0).toFixed(2)}`]
      ],
      footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    
    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('This is a computer-generated invoice and does not require a physical signature.', 105, finalY + 20, { align: 'center' });
    doc.text('Thank you for choosing PharmaFlow Pro for your healthcare needs.', 105, finalY + 25, { align: 'center' });
    
    doc.save(`Invoice_${bill.id.slice(-6)}.pdf`);
  };

  const BillDetailModal = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative animate-in zoom-in duration-300">
        <button onClick={() => setSelectedBill(null)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full text-slate-400"><X size={20}/></button>
        <div className="text-center mb-8">
           <h4 className="text-xl font-bold text-[#DC143C] tracking-tight">PharmaFlow Pro</h4>
           <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1">Tax invoice</p>
        </div>
        <div className="border-y border-dashed py-4 mb-8 flex justify-between items-start text-[10px] font-bold text-gray-500 tracking-wide">
           <div>
              <p>Invoice: {selectedBill?.id}</p>
              <p>Date: {selectedBill && new Date(selectedBill.date).toLocaleString()}</p>
           </div>
           <div className="text-right">
              <p>Mode: {selectedBill?.paymentMode}</p>
           </div>
        </div>
        <div className="space-y-3 mb-8 max-h-40 overflow-y-auto custom-scrollbar">
           {selectedBill?.items.map(i => (
             <div key={i.medicineId} className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-black text-gray-800">{i.name} x{i.quantity}</span>
                  {i.expiryDate && <p className="text-[9px] text-red-500 font-bold uppercase">Exp: {i.expiryDate}</p>}
                </div>
                <span className="font-bold text-gray-600">${(i.total || 0).toFixed(2)}</span>
             </div>
           ))}
        </div>
        <div className="border-t border-gray-100 pt-4 space-y-1.5 mb-8 text-right">
           <div className="flex justify-between text-[10px] text-gray-400 font-bold"><span>GST (12%)</span><span>${(selectedBill?.tax || 0).toFixed(2)}</span></div>
           <div className="flex justify-between text-xl font-bold text-gray-800 tracking-tight pt-1"><span>Total</span><span>${(selectedBill?.grandTotal || 0).toFixed(2)}</span></div>
        </div>
        <div className="flex flex-col gap-2">
           <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-2"><Printer size={14}/> Print</button>
              <button onClick={() => downloadPDF(selectedBill!)} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-2"><Download size={14}/> PDF</button>
           </div>
           <button onClick={() => handleBuyAgain(selectedBill!)} className="w-full bg-[#DC143C] text-white py-4 rounded-xl font-bold text-sm shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2"><RefreshCw size={16}/> Reorder items</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end bg-white p-8 rounded-3xl shadow-sm border">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Order history</h2>
           <p className="text-gray-400 font-medium text-xs mt-1 tracking-wide">View your past orders and reorder medicines</p>
        </div>
        <div className="w-12 h-12 bg-[#FDEBC0]/50 rounded-xl flex items-center justify-center text-[#DC143C]">
           <History size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myBills.map(bill => (
          <div key={bill.id} onClick={() => setSelectedBill(bill)} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group flex flex-col h-[320px]">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-[#DC143C] group-hover:bg-[#DC143C] group-hover:text-white transition-all shadow-inner">
                <Receipt size={24} />
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-wide ${bill.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {bill.status || 'PAID'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1 leading-tight tracking-tight">Order #{bill.id?.slice(-6) || 'N/A'}</h3>
            <p className="text-[10px] text-gray-400 font-bold tracking-wide mb-4">{new Date(bill.date).toLocaleDateString()}</p>
            
            <div className="flex-1 overflow-hidden">
               <p className="text-xs font-medium text-gray-500 line-clamp-3">Items: {bill.items.map(i => `${i.name}`).join(', ')}</p>
            </div>

            <div className="mt-auto pt-4 flex items-center justify-between border-t border-dashed">
               <div>
                  <p className="text-[9px] font-bold text-slate-300 uppercase">Total</p>
                  <p className="text-lg font-bold text-gray-800">${(bill.grandTotal || 0).toFixed(2)}</p>
               </div>
               <div className="flex gap-2">
                 <button 
                  onClick={(e) => { e.stopPropagation(); handleBuyAgain(bill); }}
                  className="bg-red-50 text-[#DC143C] p-3 rounded-xl hover:bg-[#DC143C] hover:text-white transition-all"
                  title="Reorder items"
                 >
                   <RefreshCw size={16}/>
                 </button>
                 <div className="bg-gray-100 p-3 rounded-xl text-gray-400 group-hover:bg-slate-900 group-hover:text-white transition-all"><ArrowRight size={16}/></div>
               </div>
            </div>
          </div>
        ))}
        {myBills.length === 0 && (
          <div className="col-span-3 text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
             <ShoppingCart size={40} className="mx-auto text-gray-100 mb-3" />
             <p className="text-gray-300 font-bold tracking-wide italic text-sm">No transaction history detected.</p>
          </div>
        )}
      </div>

      {selectedBill && <BillDetailModal />}
    </div>
  );
};

export default CustomerOrders;