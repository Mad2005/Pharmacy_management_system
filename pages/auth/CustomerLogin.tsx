
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDatabase } from '../../store/database';
import { ShoppingBag, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../../types';

const CustomerLogin: React.FC<{ onLogin: (user: any) => void }> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { users } = useDatabase();
  const [formData, setFormData] = useState({ user: '', pass: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = users.find(u => u.username === formData.user && u.password === formData.pass && u.role === 'CUSTOMER');
    if (customer) {
      onLogin(customer);
      alert('Success: Welcome back to PharmaFlow Pro.');
      navigate('/customer/dashboard');
    } else {
      setError('Credentials not found. Have you registered?');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-['Inter']">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center relative overflow-hidden animate-in fade-in zoom-in duration-500 border border-slate-100">
        <div className="absolute top-0 right-0 p-4 opacity-5 text-crimson"><ShoppingBag size={200}/></div>
        <h1 className="text-3xl font-black text-crimson mb-8">PHARMAFLOW PRO</h1>
        <h2 className="text-xl font-black text-slate-800 mb-2">Welcome Patient</h2>
        <p className="text-slate-400 text-sm font-medium mb-10">Access your medical history & orders</p>
        
        <form onSubmit={handleLogin} className="space-y-6 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</label>
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.user} onChange={e => setFormData({...formData, user: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
            <div className="relative">
              <input 
                required 
                type={showPass ? "text" : "password"} 
                className="w-full p-4 pr-14 bg-slate-50 border border-slate-100 rounded-2xl font-bold" 
                value={formData.pass} 
                onChange={e => setFormData({...formData, pass: e.target.value})} 
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
              >
                {showPass ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>
            <div className="text-right mt-2">
              <Link to={`/forgot-password?role=${UserRole.CUSTOMER}`} className="text-[10px] font-black text-crimson uppercase tracking-widest hover:underline">Forgot Password?</Link>
            </div>
          </div>
          {error && <p className="text-xs text-crimson font-bold">{error}</p>}
          <button className="w-full py-5 bg-crimson text-white rounded-2xl font-black text-lg shadow-xl shadow-crimson/20 hover:scale-105 transition-all flex items-center justify-center gap-3">
            Get Started <ArrowRight size={20}/>
          </button>
        </form>

        <div className="mt-12 space-y-4">
          <p className="text-sm text-slate-500">Already have an account? No? <Link to="/customer-register" className="text-crimson font-black hover:underline">Sign up now</Link></p>
          <div className="pt-8 border-t border-slate-100 flex flex-col gap-2">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Employee Access</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/pharmacist-login" className="text-xs font-black text-slate-400 hover:text-crimson uppercase tracking-tighter">Pharmacist</Link>
              <Link to="/staff-login" className="text-xs font-black text-slate-400 hover:text-crimson uppercase tracking-tighter">Staff</Link>
              <Link to="/admin-login" className="text-xs font-black text-slate-400 hover:text-crimson uppercase tracking-tighter">Admin</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
