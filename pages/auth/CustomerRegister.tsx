import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDatabase } from '../../store/database';
import { UserRole, User } from '../../types';
import { UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const CustomerRegister: React.FC = () => {
  const navigate = useNavigate();
  const { addUser } = useDatabase();
  const [formData, setFormData] = useState({
    name: '', phone: '', address: '', user: '', pass: '', confirm: '', email: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.pass !== formData.confirm) return alert('Passwords do not match');
    
    const newUser: User = {
      id: `CUST${Date.now()}`,
      fullName: formData.name,
      username: formData.user,
      password: formData.pass,
      email: formData.email,
      role: UserRole.CUSTOMER,
      phone: formData.phone,
      address: formData.address,
      joiningDate: new Date().toISOString().split('T')[0],
      isActive: true
    };
    
    addUser(newUser);
    alert('Success: Registration Successful! Your clinical node is now active.');
    navigate('/customer-login');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-['Inter']">
      <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl p-12 overflow-hidden relative border border-slate-100">
        <Link to="/customer-login" className="absolute top-8 left-8 p-2 text-slate-400 hover:text-crimson transition-colors"><ArrowLeft size={24}/></Link>
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-800 mb-2">Create Account</h1>
          <p className="text-slate-400 font-medium tracking-wide">Join PharmaFlow Pro Healthcare Portal</p>
        </div>

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Legal Name</label>
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
            <input required type="email" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Complete Home Address</label>
            <textarea required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold min-h-[80px]" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Choose Username</label>
            <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.user} onChange={e => setFormData({...formData, user: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Choose Password</label>
            <div className="relative">
              <input 
                required 
                type={showPass ? "text" : "password"} 
                className="w-full p-4 pr-14 bg-slate-50 border border-slate-100 rounded-2xl font-bold" 
                value={formData.pass} 
                onChange={e => setFormData({...formData, pass: e.target.value})} 
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                {showPass ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm Secure Password</label>
            <div className="relative">
              <input 
                required 
                type={showConfirm ? "text" : "password"} 
                className="w-full p-4 pr-14 bg-slate-50 border border-slate-100 rounded-2xl font-bold" 
                value={formData.confirm} 
                onChange={e => setFormData({...formData, confirm: e.target.value})} 
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                {showConfirm ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>
          </div>
          
          <button className="md:col-span-2 mt-4 w-full py-5 bg-crimson text-white rounded-2xl font-black text-lg shadow-xl shadow-crimson/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
             Complete Registration <UserPlus size={24}/>
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400 font-medium">Already have an account? <Link to="/customer-login" className="text-crimson font-black hover:underline">Get started here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegister;