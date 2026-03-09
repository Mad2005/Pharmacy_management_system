
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Pill, Package, Truck, 
  BarChart3, Bell, LogOut, FileText, History, 
  UserCircle, ShoppingCart, RefreshCw, Settings as SettingsIcon, ShieldCheck
} from 'lucide-react';
import { User, UserRole } from '../types';
import { useDatabase } from '../store/database';
import NotificationCenter from './NotificationCenter';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { recurringOrders, addNotification, notifications } = useDatabase();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    if (user.role === UserRole.CUSTOMER) {
      const mySubs = recurringOrders.filter(ro => ro.customerId === user.id && ro.status === 'ACTIVE');
      mySubs.forEach(sub => {
        const next = new Date(sub.nextReorderDate).getTime();
        const now = new Date().getTime();
        const diff = Math.ceil((next - now) / (1000 * 3600 * 24));
        
        const notifId = `REFILL-${sub.id}-${diff}`;
        const alreadyExists = notifications.some(n => n.id === notifId);

        if (diff <= 5 && diff > 0 && !alreadyExists) {
          addNotification({
            id: notifId,
            title: 'Refill Due Soon',
            message: `Your medicine refill for ${sub.items.map(i => i.name).join(', ')} is due in ${diff} days.`,
            type: 'REFILL',
            targetRoles: [UserRole.CUSTOMER], // STICKY: Only customer role targeted
            isRead: false,
            createdAt: new Date().toISOString(),
            customerId: user.id
          });
        } else if (diff === 0 && !alreadyExists) {
          addNotification({
            id: notifId,
            title: 'Reorder Now',
            message: `It is time to reorder your recurring medicines. Access your subscription desk to finalize.`,
            type: 'REFILL',
            targetRoles: [UserRole.CUSTOMER], // STICKY: Only customer role targeted
            isRead: false,
            createdAt: new Date().toISOString(),
            customerId: user.id
          });
        }
      });
    }
  }, [recurringOrders, user.id, user.role]);

  const menuItems = {
    [UserRole.ADMIN]: [
      { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/admin/users', icon: Users, label: 'User Management' },
      { path: '/admin/medicines', icon: Pill, label: 'Medicines' },
      { path: '/admin/inventory', icon: Package, label: 'Inventory' },
      { path: '/admin/suppliers', icon: Truck, label: 'Suppliers' },
      { path: '/admin/billing', icon: ShoppingCart, label: 'POS Billing' },
      { path: '/admin/billing-history', icon: History, label: 'Billing History' },
      { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
      { path: '/admin/profile', icon: UserCircle, label: 'Profile' },
    ],
    [UserRole.PHARMACIST]: [
      { path: '/pharmacist/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/pharmacist/billing', icon: ShoppingCart, label: 'POS Billing' },
      { path: '/pharmacist/billing-history', icon: History, label: 'Billing History' },
      { path: '/pharmacist/medicines', icon: Pill, label: 'Medicines' },
      { path: '/pharmacist/inventory', icon: Package, label: 'Inventory' },
      { path: '/pharmacist/prescriptions', icon: FileText, label: 'Prescriptions' },
      { path: '/pharmacist/refill-verification', icon: ShieldCheck, label: 'Refill Audit' },
      { path: '/pharmacist/profile', icon: UserCircle, label: 'Profile' },
    ],
    [UserRole.STAFF]: [
      { path: '/staff/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/staff/billing', icon: ShoppingCart, label: 'POS Billing' },
      { path: '/staff/billing-history', icon: History, label: 'Billing History' },
      { path: '/staff/medicines', icon: Pill, label: 'Medicines' },
      { path: '/staff/inventory', icon: Package, label: 'Inventory' },
      { path: '/staff/profile', icon: UserCircle, label: 'Profile' },
    ],
    [UserRole.CUSTOMER]: [
      { path: '/customer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/customer/billing', icon: ShoppingCart, label: 'Shop Medicines' },
      { path: '/customer/orders', icon: History, label: 'Order History' },
      { path: '/customer/recurring', icon: RefreshCw, label: 'Recurring Fills' },
      { path: '/customer/prescriptions', icon: FileText, label: 'Prescriptions' },
      { path: '/customer/profile', icon: UserCircle, label: 'Profile' },
      { path: '/customer/settings', icon: SettingsIcon, label: 'Settings' },
    ],
  };

  const handleLogout = () => {
    onLogout();
    navigate('/customer-login');
  };

  return (
    <div className="flex h-screen bg-white font-['Inter']">
      <aside className="w-72 bg-white text-slate-800 flex flex-col border-r border-slate-100 shadow-sm animate-in slide-in-from-left duration-500">
        <div className="p-8 text-center border-b border-slate-50">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-8 h-8 bg-crimson rounded-lg flex items-center justify-center text-white shadow-lg shadow-crimson/20">
              <Pill size={18} />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-slate-800">PharmaFlow<span className="text-crimson">Pro</span></h1>
          </div>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest">{user.role}</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {menuItems[user.role].map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                  ? 'bg-crimson text-white shadow-md font-bold' 
                  : 'hover:bg-slate-50 text-slate-500 hover:text-crimson font-medium'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-crimson transition-colors'} />
                <span className="text-sm tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <button 
            onClick={handleLogout} 
            className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-rose/10 text-slate-400 hover:text-crimson transition-all font-medium group"
          >
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            <span className="text-sm tracking-tight">Sign out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 z-10">
          <div className="flex flex-col">
            <h2 className="text-[10px] font-bold text-slate-400 tracking-wider mb-0.5">Navigation</h2>
            <p className="text-lg font-bold text-slate-800 tracking-tight">
              {menuItems[user.role].find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="relative">
              <button 
                className="p-2.5 bg-slate-50 text-slate-400 hover:text-crimson hover:bg-rose/10 rounded-xl transition-all relative group" 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
              >
                <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                <span className={`absolute top-2 right-2 w-2 h-2 bg-crimson border-2 border-white rounded-full ${notifications.some(n => !n.isRead && n.targetRoles.includes(user.role) && (user.role !== UserRole.CUSTOMER || n.customerId === user.id)) ? 'animate-ping' : ''}`}></span>
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <NotificationCenter role={user.role} userId={user.id} onClose={() => setIsNotifOpen(false)} />
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3 pl-6 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 tracking-tight">{user.fullName}</p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <div className="w-1 h-1 rounded-full bg-green-500"></div>
                  <p className="text-[9px] font-bold text-slate-400 tracking-wider">Active session</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-crimson to-pinkish flex items-center justify-center text-white font-bold text-base shadow-md border border-white">
                {user.fullName?.charAt(0) || user.username?.charAt(0) || '?'}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
