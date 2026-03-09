
import React, { useState, useMemo } from 'react';
import { useDatabase } from '../../store/database';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, DollarSign, ShoppingBag, Calendar, Printer, 
  FileBarChart, Download, Search, Package, ClipboardList, 
  Activity, Brain, AlertTriangle, XCircle,
  Users, Clock, CreditCard, PieChart as PieChartIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Reports: React.FC = () => {
  const { bills, medicines, prescriptions, purchases, auditLogs, users, suppliers } = useDatabase();
  
  // Filters State
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'SALES' | 'INVENTORY' | 'PRESCRIPTION' | 'FINANCIAL' | 'ACTIVITY' | 'AI'>('SALES');

  // Colors for charts
  const COLORS = ['#DC143C', '#F75270', '#F7CAC9', '#F08787', '#FDEBD0', '#FEE2AD', '#F8FAB4'];

  // 1. Filtered Data Logic
  const filteredData = useMemo(() => {
    let filteredBills = [...bills];
    let filteredPurchases = [...purchases];
    let filteredPrescriptions = [...prescriptions];
    let filteredLogs = [...auditLogs];

    if (dateRange.start) {
      filteredBills = filteredBills.filter(b => b.date >= dateRange.start);
      filteredPurchases = filteredPurchases.filter(p => p.date >= dateRange.start);
      filteredPrescriptions = filteredPrescriptions.filter(p => p.uploadedAt >= dateRange.start);
      filteredLogs = filteredLogs.filter(l => l.timestamp >= dateRange.start);
    }
    if (dateRange.end) {
      filteredBills = filteredBills.filter(b => b.date <= dateRange.end);
      filteredPurchases = filteredPurchases.filter(p => p.date <= dateRange.end);
      filteredPrescriptions = filteredPrescriptions.filter(p => p.uploadedAt <= dateRange.end);
      filteredLogs = filteredLogs.filter(l => l.timestamp <= dateRange.end);
    }
    if (selectedStaff) {
      filteredBills = filteredBills.filter(b => b.processedBy === selectedStaff);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredBills = filteredBills.filter(b => b.id.toLowerCase().includes(term) || b.customerName.toLowerCase().includes(term));
    }

    return { filteredBills, filteredPurchases, filteredPrescriptions, filteredLogs };
  }, [bills, purchases, prescriptions, auditLogs, dateRange, selectedStaff, searchTerm]);

  // 2. Sales Analytics
  const salesStats = useMemo(() => {
    const totalRevenue = filteredData.filteredBills.reduce((acc, b) => acc + b.grandTotal, 0);
    const totalTax = filteredData.filteredBills.reduce((acc, b) => acc + b.tax, 0);
    const totalOrders = filteredData.filteredBills.length;
    
    const paymentMethods = filteredData.filteredBills.reduce((acc: any, b) => {
      acc[b.paymentMode] = (acc[b.paymentMode] || 0) + b.grandTotal;
      return acc;
    }, {});

    const topSelling = filteredData.filteredBills.flatMap(b => b.items).reduce((acc: any, item) => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity;
      return acc;
    }, {});

    const salesTrend = filteredData.filteredBills.reduce((acc: any, b) => {
      const date = b.date?.split('T')[0] || 'Unknown';
      acc[date] = (acc[date] || 0) + (b.grandTotal || 0);
      return acc;
    }, {});

    return {
      totalRevenue,
      totalTax,
      totalOrders,
      paymentData: Object.entries(paymentMethods).map(([name, value]) => ({ name, value })),
      topSellingData: Object.entries(topSelling).map(([name, value]) => ({ name, value: value as number })).sort((a, b) => b.value - a.value).slice(0, 5),
      trendData: Object.entries(salesTrend).map(([date, sales]) => ({ date, sales: sales as number })).sort((a, b) => a.date.localeCompare(b.date))
    };
  }, [filteredData.filteredBills]);

  // 3. Inventory Analytics
  const inventoryStats = useMemo(() => {
    const lowStock = medicines.filter(m => m.stock <= m.criticalStockLimit);
    const outOfStock = medicines.filter(m => m.stock === 0);
    const totalStockValue = medicines.reduce((acc, m) => acc + (m.stock * m.price), 0);
    
    const categoryData = medicines.reduce((acc: any, m) => {
      acc[m.classification] = (acc[m.classification] || 0) + m.stock;
      return acc;
    }, {});

    const expiringSoon = medicines.filter(m => {
      const expiryDate = new Date(m.expiry);
      const today = new Date();
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 90;
    });

    return {
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      totalStockValue,
      categoryData: Object.entries(categoryData).map(([name, value]) => ({ name, value })),
      expiringSoon
    };
  }, [medicines]);

  // 4. Financial Analytics
  const financialStats = useMemo(() => {
    const totalSales = salesStats.totalRevenue;
    const totalPurchases = filteredData.filteredPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
    const grossProfit = totalSales - (totalPurchases * 0.8); // Simplified COGS estimation
    const netProfit = grossProfit - (salesStats.totalTax);

    return {
      totalSales,
      totalPurchases,
      grossProfit,
      netProfit,
      taxCollected: salesStats.totalTax
    };
  }, [salesStats, filteredData.filteredPurchases]);

  // 5. AI Insights
  const aiInsights = useMemo(() => {
    const slowMoving = medicines.filter(m => {
      const soldQty = bills.flatMap(b => b.items).filter(i => i.medicineId === m.id).reduce((acc, i) => acc + i.quantity, 0);
      return soldQty < 5 && m.stock > 50;
    });

    const highDemand = medicines.filter(m => {
      const soldQty = bills.flatMap(b => b.items).filter(i => i.medicineId === m.id).reduce((acc, i) => acc + i.quantity, 0);
      return soldQty > 100;
    });

    return { slowMoving, highDemand };
  }, [medicines, bills]);

  // Export Functions
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(220, 20, 60); // Crimson
    doc.text('PharmaFlow Pro - Business Audit', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Report Type: ${activeTab} Analysis`, 14, 35);

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Executive Summary', 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', `$${salesStats.totalRevenue.toFixed(2)}`],
        ['Total Tax Collected', `$${salesStats.totalTax.toFixed(2)}`],
        ['Total Orders Processed', salesStats.totalOrders],
        ['Current Inventory Value', `$${inventoryStats.totalStockValue.toFixed(2)}`],
        ['Low Stock Items', medicines.filter(m => m.stock <= m.criticalStockLimit).length],
        ['Pending Prescriptions', prescriptions.filter(p => p.status === 'PENDING').length],
      ],
      theme: 'striped',
      headStyles: { fillColor: [220, 20, 60] }
    });

    if (activeTab === 'SALES') {
      doc.addPage();
      doc.text('Detailed Sales Records', 14, 22);
      autoTable(doc, {
        startY: 30,
        head: [['ID', 'Customer', 'Date', 'Total', 'Payment']],
        body: filteredData.filteredBills.map(b => [
          b.id.slice(-8),
          b.customerName,
          new Date(b.date).toLocaleDateString(),
          `$${b.grandTotal.toFixed(2)}`,
          b.paymentMode
        ]),
        headStyles: { fillColor: [220, 20, 60] }
      });
    }

    doc.save(`PharmaFlow_Audit_${activeTab}_${Date.now()}.pdf`);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.filteredBills.map(b => ({
      ID: b.id,
      Customer: b.customerName,
      Date: b.date,
      Total: b.grandTotal,
      Payment: b.paymentMode,
      Staff: b.processedBy
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, `PharmaFlow_Sales_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-8 pb-20 bg-white min-h-full animate-in fade-in duration-500">
      {/* Header & Main Controls */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 no-print">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 uppercase">
            <FileBarChart className="text-crimson" size={32} />
            Analytical Intelligence
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Real-time business performance & regulatory auditing</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={exportToPDF} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-5 py-3 rounded-2xl font-bold text-sm transition-all border border-slate-100">
            <Download size={18} /> PDF
          </button>
          <button onClick={exportToExcel} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-5 py-3 rounded-2xl font-bold text-sm transition-all border border-slate-100">
            <Download size={18} /> Excel
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-crimson text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-crimson/20 hover:scale-105 transition-all">
            <Printer size={18} /> Print Report
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 no-print">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Range</label>
          <div className="flex gap-2">
            <input 
              type="date" 
              value={dateRange.start} 
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-crimson/20"
            />
            <input 
              type="date" 
              value={dateRange.end} 
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-crimson/20"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Filter</label>
          <select 
            value={selectedStaff} 
            onChange={e => setSelectedStaff(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-crimson/20"
          >
            <option value="">All Staff</option>
            {users.filter(u => u.role !== 'CUSTOMER').map(u => (
              <option key={u.id} value={u.fullName}>{u.fullName}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-crimson/20"
          >
            <option value="">All Categories</option>
            {Array.from(new Set(medicines.map(m => m.classification))).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier</label>
          <select 
            value={selectedSupplier} 
            onChange={e => setSelectedSupplier(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-crimson/20"
          >
            <option value="">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.companyName}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Invoice/Med</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-4 py-2 text-xs font-bold focus:ring-2 focus:ring-crimson/20"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 no-print">
        {[
          { id: 'SALES', label: 'Sales', icon: ShoppingBag },
          { id: 'INVENTORY', label: 'Inventory', icon: Package },
          { id: 'PRESCRIPTION', label: 'Prescriptions', icon: ClipboardList },
          { id: 'FINANCIAL', label: 'Financials', icon: DollarSign },
          { id: 'ACTIVITY', label: 'User Activity', icon: Activity },
          { id: 'AI', label: 'AI Insights', icon: Brain },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs tracking-wider transition-all ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-xl' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'SALES' && (
          <div className="space-y-8">
            {/* Sales Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-rose/5 text-crimson rounded-2xl flex items-center justify-center mb-4 border border-rose/10">
                  <DollarSign size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">${salesStats.totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-pinkish/5 text-pinkish rounded-2xl flex items-center justify-center mb-4 border border-pinkish/10">
                  <ShoppingBag size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Orders</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{salesStats.totalOrders}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-coral/5 text-coral rounded-2xl flex items-center justify-center mb-4 border border-coral/10">
                  <TrendingUp size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Order Value</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">${(salesStats.totalRevenue / (salesStats.totalOrders || 1)).toFixed(2)}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-rose/5 text-crimson rounded-2xl flex items-center justify-center mb-4 border border-rose/10">
                  <CreditCard size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax Collected</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">${salesStats.totalTax.toLocaleString()}</h3>
              </div>
            </div>

            {/* Sales Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h4 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tighter">
                  <TrendingUp className="text-crimson" size={20} />
                  Revenue Trend
                </h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesStats.trendData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#DC143C" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#DC143C" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                      <Area type="monotone" dataKey="sales" stroke="#DC143C" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h4 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tighter">
                  <PieChartIcon className="text-pinkish" size={20} />
                  Payment Methods
                </h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesStats.paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {salesStats.paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'INVENTORY' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-rose/5 text-crimson rounded-2xl flex items-center justify-center mb-4 border border-rose/10">
                  <AlertTriangle size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Stock Items</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{inventoryStats.lowStockCount}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                  <XCircle size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Out of Stock</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{inventoryStats.outOfStockCount}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4 border border-green-100">
                  <Package size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Stock Value</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">${inventoryStats.totalStockValue.toLocaleString()}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h4 className="text-lg font-black text-slate-800 mb-8 uppercase tracking-tighter">Category-wise Distribution</h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryStats.categoryData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                      <Bar dataKey="value" fill="#DC143C" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter">
                  <Clock className="text-coral" size={20} />
                  Expiring Medicines (90 Days)
                </h4>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white">
                      <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                        <th className="pb-4">Medicine</th>
                        <th className="pb-4">Expiry</th>
                        <th className="pb-4 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {inventoryStats.expiringSoon.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 text-sm font-bold text-slate-700">{m.name}</td>
                          <td className="py-4 text-sm text-coral font-bold">{m.expiry}</td>
                          <td className="py-4 text-right text-sm font-black text-slate-800">{m.stock}</td>
                        </tr>
                      ))}
                      {inventoryStats.expiringSoon.length === 0 && (
                        <tr><td colSpan={3} className="py-10 text-center text-slate-400 italic">No near-expiry items</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'PRESCRIPTION' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Prescriptions</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{prescriptions.length}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved</p>
                <h3 className="text-3xl font-black text-green-600 mt-1">{prescriptions.filter(p => p.status === 'PROCESSED').length}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Review</p>
                <h3 className="text-3xl font-black text-coral mt-1">{prescriptions.filter(p => p.status === 'PENDING').length}</h3>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h4 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tighter">Prescription Verification Logs</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                      <th className="pb-4">ID</th>
                      <th className="pb-4">Customer</th>
                      <th className="pb-4">Doctor</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredData.filteredPrescriptions.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 text-xs font-bold text-slate-700">{p.id}</td>
                        <td className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{p.customerId}</td>
                        <td className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{p.doctorName}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            p.status === 'PROCESSED' ? 'bg-green-50 text-green-600 border border-green-100' : 
                            p.status === 'PENDING' ? 'bg-rose/5 text-crimson border border-rose/10' : 'bg-rose/5 text-crimson border border-rose/10'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 text-xs text-slate-400 font-bold">{new Date(p.uploadedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'FINANCIAL' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Sales</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">${financialStats.totalSales.toLocaleString()}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Purchases</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">${financialStats.totalPurchases.toLocaleString()}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Net Profit</p>
                <h3 className="text-3xl font-black text-green-600 mt-1">${financialStats.netProfit.toLocaleString()}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST/Tax Liability</p>
                <h3 className="text-3xl font-black text-crimson mt-1">${financialStats.taxCollected.toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h4 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tighter">Purchase & Supplier Records</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                      <th className="pb-4">Invoice #</th>
                      <th className="pb-4">Supplier</th>
                      <th className="pb-4">Date</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredData.filteredPurchases.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 text-xs font-bold text-slate-700">{p.invoiceNumber}</td>
                        <td className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{p.supplierName}</td>
                        <td className="py-4 text-xs text-slate-400 font-bold">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="py-4">
                          <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="py-4 text-right text-sm font-black text-slate-800">${p.totalAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ACTIVITY' && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter">
              <Activity className="text-crimson" size={20} />
              System Audit Logs
            </h4>
            <div className="space-y-4">
              {filteredData.filteredLogs.map(log => (
                <div key={log.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-crimson/20 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    log.action.includes('LOGIN') ? 'bg-crimson text-white' : 'bg-slate-800 text-white'
                  }`}>
                    {log.action.includes('LOGIN') ? <Users size={18} /> : <Activity size={18} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight">{log.action}</h5>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{log.details}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BY: {log.userName} ({log.userRole})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'AI' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-rose/5 text-crimson rounded-2xl flex items-center justify-center border border-rose/10">
                  <Brain size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Slow Moving Inventory</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Items with low turnover & high stock</p>
                </div>
              </div>
              <div className="space-y-4">
                {aiInsights.slowMoving.map(m => (
                  <div key={m.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-crimson/20 transition-colors">
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{m.name}</p>
                      <p className="text-[10px] font-bold text-crimson uppercase tracking-widest">Current Stock: {m.stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Recommendation</p>
                      <p className="text-xs font-bold text-slate-500 italic">Consider Discount/Promo</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center border border-green-100">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter">High Demand Prediction</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Items trending in current sales cycle</p>
                </div>
              </div>
              <div className="space-y-4">
                {aiInsights.highDemand.map(m => (
                  <div key={m.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center hover:border-green-100 transition-colors">
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{m.name}</p>
                      <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">High Velocity</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Recommendation</p>
                      <p className="text-xs font-bold text-slate-500 italic">Increase Reorder Qty</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Print Section */}
      <div className="hidden print:block p-12 space-y-10 bg-white text-black font-sans">
        <div className="text-center space-y-2 border-b-4 border-black pb-8">
          <h1 className="text-4xl font-black tracking-tighter uppercase">PharmaFlow Pro - Official Audit</h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em]">Confidential Business Performance Report</p>
        </div>
        
        <div className="grid grid-cols-2 gap-8 py-6">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase">Report Type</p>
            <p className="text-xl font-black uppercase">{activeTab} ANALYSIS</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase">Generated On</p>
            <p className="text-xl font-black uppercase">{new Date().toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 py-10 border-y-2 border-gray-100">
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Total Revenue</p>
            <p className="text-3xl font-black">${salesStats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="text-center border-x-2 border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Total Orders</p>
            <p className="text-3xl font-black">{salesStats.totalOrders}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Stock Value</p>
            <p className="text-3xl font-black">${inventoryStats.totalStockValue.toFixed(2)}</p>
          </div>
        </div>

        <div className="pt-20 flex justify-between items-end border-t border-dashed">
          <div className="w-64 border-t-2 border-black pt-4 text-center">
            <p className="text-xs font-black uppercase">Pharmacist Authority</p>
          </div>
          <div className="w-64 border-t-2 border-black pt-4 text-center">
            <p className="text-xs font-black uppercase">Admin Official Stamp</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
