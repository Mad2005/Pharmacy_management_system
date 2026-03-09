
import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { UserCircle, Mail, Phone, MapPin, Calendar, Lock, Shield, KeyRound, CheckCircle, Trash2, X, Star, Heart } from 'lucide-react';
import { useDatabase } from '../../store/database';

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const { updateUser, deleteUser } = useDatabase();
  const [isEditing, setIsEditing] = useState(false);
  const [showCredChange, setShowCredChange] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>(user);
  const [creds, setCreds] = useState({ username: user.username, pass: '', confirm: '' });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(user.id, formData);
    onUpdate({ ...user, ...formData });
    setIsEditing(false);
  };

  const handleCredChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (creds.pass && creds.pass !== creds.confirm) return alert('Passwords mismatch!');
    const updates: Partial<User> = { username: creds.username };
    if (creds.pass) updates.password = creds.pass;
    updateUser(user.id, updates);
    onUpdate({ ...user, ...updates });
    setShowCredChange(false);
    alert('Credentials updated successfully!');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="relative h-56 bg-[#DC143C] rounded-[4rem] shadow-2xl">
        <div className="absolute inset-0 opacity-10 flex flex-wrap gap-12 p-10 overflow-hidden rounded-[4rem]">
          {[...Array(24)].map((_, i) => <Heart key={i} size={48} />)}
        </div>
        <div className="absolute -bottom-12 left-16 flex items-end gap-8 z-20">
          <div className="w-40 h-40 rounded-[3rem] bg-white p-3 shadow-2xl">
            <div className="w-full h-full rounded-[2.5rem] bg-[#F7CAC9] flex items-center justify-center text-[#DC143C] text-6xl font-black border-4 border-[#DC143C]/20">
              {user.fullName?.charAt(0) || '?'}
            </div>
          </div>
          <div className="pb-6 text-white">
            <h2 className="text-4xl font-black tracking-tighter drop-shadow-lg">{user.fullName || 'User'}</h2>
            <p className="text-white/60 font-bold tracking-wide text-xs mt-2">Node Reference: {user.id?.slice(-6) || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-16">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white p-12 rounded-[4rem] shadow-sm border">
            <div className="flex justify-between items-center mb-12">
              <h3 className="text-2xl font-black text-gray-800 tracking-tighter">Legal Profile</h3>
              <button onClick={() => setIsEditing(!isEditing)} className={`px-8 py-3 rounded-2xl font-black text-xs tracking-widest transition-all ${isEditing ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Name</label>
                  <input required disabled={!isEditing} className="w-full p-5 bg-gray-50 border-none rounded-2xl ring-1 ring-gray-100 focus:ring-2 focus:ring-[#DC143C] outline-none font-bold" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Line</label>
                  <input required disabled={!isEditing} className="w-full p-5 bg-gray-50 border-none rounded-2xl ring-1 ring-gray-100 focus:ring-2 focus:ring-[#DC143C] outline-none font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Endpoint</label>
                  <input required disabled={!isEditing} className="w-full p-5 bg-gray-50 border-none rounded-2xl ring-1 ring-gray-100 focus:ring-2 focus:ring-[#DC143C] outline-none font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dispatch Address</label>
                  <textarea required disabled={!isEditing} className="w-full p-5 bg-gray-50 border-none rounded-2xl ring-1 ring-gray-100 focus:ring-2 focus:ring-[#DC143C] outline-none font-bold min-h-[120px]" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>
              {isEditing && <button type="submit" className="w-full py-6 bg-[#DC143C] text-white rounded-[2rem] font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all">Authorize Updates</button>}
            </form>
          </div>

          <div className="bg-white p-12 rounded-[4rem] shadow-sm border">
             <h3 className="text-2xl font-black text-gray-800 mb-12 tracking-tighter">Auth & Integrity</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => setShowCredChange(true)} className="p-10 bg-slate-50 rounded-[3rem] text-left hover:bg-slate-100 transition-all group">
                   <KeyRound className="text-[#DC143C] mb-6 group-hover:scale-110 transition-transform" size={40} />
                   <h4 className="font-black text-xl text-gray-800 tracking-tight">Security Gateway</h4>
                   <p className="text-xs text-gray-400 mt-2 font-medium">Update system username or secure passkey</p>
                </button>
                {user.role === UserRole.CUSTOMER && (
                  <button onClick={() => { if(confirm('Permanently wipe all health data and account?')) deleteUser(user.id); }} className="p-10 bg-red-50 rounded-[3rem] text-left hover:bg-red-100 transition-all group">
                     <Trash2 className="text-red-500 mb-6 group-hover:scale-110 transition-transform" size={40} />
                     <h4 className="font-black text-xl text-red-800 tracking-tight">Dissolve Node</h4>
                     <p className="text-xs text-red-400 mt-2 font-medium">Permanently remove all medical records & history</p>
                  </button>
                )}
             </div>
          </div>
        </div>

        <div className="space-y-10">
           <div className="bg-[#FDEBC0] p-12 rounded-[4rem] border-4 border-white shadow-2xl">
              <h3 className="text-2xl font-black text-gray-800 mb-10 flex items-center gap-3 tracking-tighter">Membership</h3>
              <div className="space-y-10">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-orange-500 shadow-xl border-2 border-orange-50">
                       <Star size={32} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-500 tracking-widest">Loyalty Bank</p>
                       <p className="text-3xl font-black text-gray-800">{user.loyaltyPoints || 0} PTS</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-red-500 shadow-xl border-2 border-red-50">
                       <Heart size={32} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-500 tracking-widest">Health Score</p>
                       <p className="text-3xl font-black text-gray-800">{user.healthPoints || 100}%</p>
                    </div>
                 </div>
              </div>
              <button className="w-full mt-12 py-5 bg-white rounded-[1.5rem] font-black text-xs tracking-[0.2em] shadow-lg border-2 border-orange-100">Redeem Rewards</button>
           </div>

           <div className="bg-white p-12 rounded-[4rem] shadow-sm border">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">Node Metrics</p>
              <div className="space-y-4">
                 <div className="flex justify-between text-xs font-bold text-gray-500 uppercase"><span>Active Since</span><span>{user.joiningDate}</span></div>
                 <div className="flex justify-between text-xs font-bold text-gray-500 uppercase"><span>Role Verified</span><span>{user.role}</span></div>
                 <div className="flex justify-between text-xs font-bold text-gray-500 uppercase"><span>Data Node</span><span>PH-G24-001</span></div>
              </div>
           </div>
        </div>
      </div>

      {showCredChange && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-2xl p-4">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-lg p-12 relative animate-in zoom-in duration-300">
            <button onClick={() => setShowCredChange(false)} className="absolute top-10 right-10 p-2 hover:bg-gray-100 rounded-full"><X size={28}/></button>
            <h3 className="text-3xl font-black text-gray-800 tracking-tighter uppercase mb-2">Auth Reset.</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10">Modify your secure entry credentials</p>
            <form onSubmit={handleCredChange} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New System Identifier</label>
                <input required className="w-full p-5 bg-gray-50 border-none rounded-2xl ring-1 ring-gray-100 focus:ring-2 focus:ring-[#DC143C] outline-none font-bold" value={creds.username} onChange={e => setCreds({...creds, username: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Secure Passkey</label>
                <input required type="password" placeholder="••••••••" className="w-full p-5 bg-gray-50 border-none rounded-2xl ring-1 ring-gray-100 focus:ring-2 focus:ring-[#DC143C] outline-none font-bold" value={creds.pass} onChange={e => setCreds({...creds, pass: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Passkey</label>
                <input required type="password" placeholder="••••••••" className="w-full p-5 bg-gray-50 border-none rounded-2xl ring-1 ring-gray-100 focus:ring-2 focus:ring-[#DC143C] outline-none font-bold" value={creds.confirm} onChange={e => setCreds({...creds, confirm: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-black active:scale-95 transition-all uppercase tracking-widest mt-4">Complete Finishing</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
