
import React, { useState } from 'react';
import { useDatabase } from '../../store/database';
import { User, Bill, UserRole } from '../../types';
import { 
  Search, FileText, Trash2, Eye, 
  Calendar, User as UserIcon, CreditCard, 
  Filter, Download, Printer, X
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const BillingHistory: React.FC<{ user: User }> = ({ user }) => {
  const { bills, deleteBill } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Filter bills based on role
  // Admin sees all, others see only what they processed
  const myBills = bills.filter(b => {
    const matchesSearch = (b.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (b.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    if (user.role === UserRole.ADMIN || user.role === UserRole.PHARMACIST || user.role === UserRole.STAFF) return matchesSearch;
    if (user.role === UserRole.CUSTOMER) return b.customerId === user.id && matchesSearch;
    
    return matchesSearch;
  });

  const exportToPDF = (bill: Bill) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('PharmaFlow Pro - Invoice', 14, 22);
    doc.setFontSize(10);
    doc.text(`Invoice ID: ${bill.id}`, 14, 30);
    doc.text(`Date: ${new Date(bill.date).toLocaleString()}`, 14, 35);
    doc.text(`Customer: ${bill.customerName}`, 14, 40);
    doc.text(`Processed By: ${bill.processedBy}`, 14, 45);

    autoTable(doc, {
      startY: 55,
      head: [['Item', 'Qty', 'Price', 'Expiry', 'Total']],
      body: bill.items.map(item => [
        item.name,
        item.quantity,
        `$${(item.price || 0).toFixed(2)}`,
        item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A',
        `$${(item.total || 0).toFixed(2)}`
      ]),
    });

    const finalY = (doc as any).lastAutoTable.finalY || 60;
    doc.text(`Subtotal: $${(bill.subTotal || 0).toFixed(2)}`, 140, finalY + 10);
    doc.text(`Tax: $${(bill.tax || 0).toFixed(2)}`, 140, finalY + 15);
    doc.text(`Grand Total: $${(bill.grandTotal || 0).toFixed(2)}`, 140, finalY + 22);

    doc.save(`Invoice_${bill.id}.pdf`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Billing History</h2>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Audit trail of all financial transactions</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-sm outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#DC143C]" 
            placeholder="Search by ID or Customer..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice ID</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {myBills.map(bill => (
                <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{bill.id.slice(-8)}</p>
                  </td>
                  <td className="p-6">
                    <p className="text-xs font-bold text-slate-700">{bill.customerName}</p>
                  </td>
                  <td className="p-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(bill.date).toLocaleDateString()}</p>
                  </td>
                  <td className="p-6">
                    <p className="text-xs font-black text-slate-800">${(bill.grandTotal || 0).toFixed(2)}</p>
                  </td>
                  <td className="p-6">
                    <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-100">Paid</span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setSelectedBill(bill)} className="p-2 text-slate-300 hover:text-[#DC143C] transition-colors"><Eye size={16}/></button>
                      <button onClick={() => exportToPDF(bill)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Download size={16}/></button>
                      {user.role === UserRole.ADMIN && (
                        <button onClick={() => { if(confirm('Delete this record?')) deleteBill(bill.id); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {myBills.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <FileText size={48} />
                      <p className="text-xs font-black uppercase tracking-widest">No transaction records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBill && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl p-12 relative animate-in zoom-in duration-300">
            <button onClick={() => setSelectedBill(null)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full text-slate-300"><X size={24}/></button>
            
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Invoice Detail</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">ID: {selectedBill.id}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Grand Total</p>
                <p className="text-3xl font-black text-[#DC143C] tracking-tighter">${(selectedBill.grandTotal || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Customer</p>
                  <p className="text-xs font-bold text-slate-700">{selectedBill.customerName}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Date</p>
                  <p className="text-xs font-bold text-slate-700">{new Date(selectedBill.date).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Items Purchased</p>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                  {selectedBill.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Qty: {item.quantity} • ${item.price?.toFixed(2) || '0.00'} {item.expiryDate && `• Exp: ${new Date(item.expiryDate).toLocaleDateString()}`}</p>
                      </div>
                      <p className="text-xs font-black text-slate-800">${item.total?.toFixed(2) || '0.00'}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-dashed space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Subtotal</span>
                  <span>${(selectedBill.subTotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Tax (12%)</span>
                  <span>${(selectedBill.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-800 uppercase pt-2">
                  <span>Grand Total</span>
                  <span>${(selectedBill.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button onClick={() => exportToPDF(selectedBill)} className="flex-1 py-4 bg-[#DC143C] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-100 flex items-center justify-center gap-2 hover:brightness-110 transition-all"><Download size={18}/> Download PDF</button>
                <button onClick={() => window.print()} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2"><Printer size={18}/> Print</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingHistory;
