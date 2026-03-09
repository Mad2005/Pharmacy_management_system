
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDatabase } from '../../store/database';
import { ShoppingBag, ArrowRight, Receipt, User, KeyRound, Activity, Package, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../../types';

const StaffLogin: React.FC<{ onLogin: (user: any) => void }> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { users, addAuditLog } = useDatabase();
  const [formData, setFormData] = useState({ user: '', pass: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = users.find(u => u.username === formData.user && u.password === formData.pass && u.role === 'STAFF');
    if (staff) {
      addAuditLog({
        userId: staff.id,
        userName: staff.fullName,
        userRole: UserRole.STAFF,
        action: 'LOGIN',
        details: `Staff ${staff.fullName} logged in successfully.`,
        timestamp: new Date().toISOString()
      });
      onLogin(staff);
      alert('Success: Staff Shift Started.');
      navigate('/staff/dashboard');
    } else {
      setError('Staff authentication failed. Incorrect ID or Key.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden font-['Inter']">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <ShoppingBag className="absolute top-20 left-20 w-32 h-32" />
        <Package className="absolute top-1/2 right-10 w-40 h-40 -rotate-12" />
        <Receipt className="absolute bottom-20 right-20 w-48 h-48 rotate-12" />
      </div>

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] p-12 relative z-10 animate-in fade-in duration-700 border border-slate-100">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-crimson rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-crimson/20 mb-6">
            <Receipt size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Sales Hub</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Pharmacy Staff Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                required
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-crimson/5 focus:border-crimson transition-all outline-none font-bold text-slate-700"
                placeholder="staff_ref"
                value={formData.user}
                onChange={e => setFormData({...formData, user: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Passphrase</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                required
                type={showPass ? "text" : "password"}
                className="w-full pl-12 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-crimson/5 focus:border-crimson transition-all outline-none font-bold text-slate-700"
                placeholder="••••••••"
                value={formData.pass}
                onChange={e => setFormData({...formData, pass: e.target.value})}
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showPass ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>
            <div className="text-right">
              <Link to={`/forgot-password?role=${UserRole.STAFF}`} className="text-[10px] font-black text-crimson uppercase tracking-widest hover:underline">Forgot Password?</Link>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose/20 rounded-2xl flex items-center gap-3 border border-rose/50 animate-shake">
              <Activity className="text-crimson" size={18} />
              <p className="text-xs font-bold text-crimson">{error}</p>
            </div>
          )}

          <button className="w-full py-5 bg-crimson text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-crimson/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest">
            Begin Shift <ArrowRight size={22}/>
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-50 flex justify-center gap-8">
           <Link to="/pharmacist-login" className="text-xs font-black text-slate-400 hover:text-crimson uppercase">Pharmacist</Link>
           <Link to="/admin-login" className="text-xs font-black text-slate-400 hover:text-crimson uppercase">Admin</Link>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
