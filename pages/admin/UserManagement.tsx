
import React, { useState } from 'react';
import { useDatabase } from '../../store/database';
import { Search, Plus, UserPlus, MoreVertical, Edit, Trash2, X, Settings, Shield, User as UserIcon, Activity } from 'lucide-react';
import { User, UserRole } from '../../types';

const UserManagement: React.FC = () => {
  const { users, addUser, updateUser, deleteUser } = useDatabase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const UserModal = () => {
    const [formData, setFormData] = useState<Partial<User>>(editingUser || {
      fullName: '',
      username: '',
      password: '',
      email: '',
      role: UserRole.PHARMACIST,
      phone: '',
      address: '',
      joiningDate: new Date().toISOString().split('T')[0],
      isActive: true
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingUser) {
        updateUser(editingUser.id, formData);
      } else {
        addUser({ ...formData, id: Date.now().toString() } as User);
      }
      setIsModalOpen(false);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
          <div className="p-8 border-b flex justify-between items-center bg-crimson text-white">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">{editingUser ? 'Edit Member' : 'Add New Member'}</h3>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-1">Personnel access configuration</p>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                <input required className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-crimson/20 transition-all" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Username</label>
                <input required className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-crimson/20 transition-all" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Role</label>
                <select className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-crimson/20 transition-all" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                  <option value={UserRole.ADMIN}>Administrator</option>
                  <option value={UserRole.PHARMACIST}>Pharmacist</option>
                  <option value={UserRole.STAFF}>Staff</option>
                  <option value={UserRole.CUSTOMER}>Customer</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Joining Date</label>
                <input type="date" required className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-crimson/20 transition-all" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Password</label>
                  <input required type="password" placeholder="Min. 8 chars" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-crimson/20 transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Connection</label>
                <input required type="email" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-crimson/20 transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="submit" className="flex-1 py-5 bg-crimson text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-crimson/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                {editingUser ? 'Update Details' : 'Add Member Now'}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-[2rem] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-crimson text-white border-crimson';
      case UserRole.PHARMACIST: return 'bg-rose/5 text-crimson border-rose/10';
      case UserRole.STAFF: return 'bg-pinkish/5 text-pinkish border-pinkish/10';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <div className="space-y-10 pb-20 bg-white min-h-full animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">User Management</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Personnel & Access Control</p>
        </div>
        <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="bg-crimson text-white px-8 py-4 rounded-[1.5rem] font-black shadow-xl shadow-crimson/20 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">
          <UserPlus size={22} /> Add New Node
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {users.map(user => (
          <div key={user.id || (user as any)._id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-crimson/10 transition-all group relative overflow-hidden flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-crimson shadow-inner border border-slate-100 group-hover:bg-crimson group-hover:text-white transition-all duration-500">
                {user.role === UserRole.ADMIN ? <Shield size={32} /> : <UserIcon size={32} />}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full ${user.isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-black text-slate-800 text-xl tracking-tight line-clamp-1 uppercase">{user.fullName}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">@{user.username}</p>
              
              <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                <div className="flex items-center gap-3 text-slate-500">
                  <Activity size={14} className="text-crimson/40" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Joined {new Date(user.joiningDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingUser(user); setIsModalOpen(true); }} 
                className="flex-1 py-3 bg-slate-50 text-slate-400 hover:bg-crimson hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-100"
              >
                <Edit size={14} /> Edit
              </button>
              
              {/* Delete blocked for ADMIN role only */}
              {user.role !== UserRole.ADMIN && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if(confirm(`Confirm permanent deletion of ${user.fullName}?`)) {
                      deleteUser(user.id);
                      alert(`Member ${user.fullName} has been removed from the system.`);
                    }
                  }} 
                  className="p-3 bg-rose/5 text-crimson hover:bg-crimson hover:text-white rounded-2xl transition-all shadow-sm border border-rose/10"
                  title="Remove User Node"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && <UserModal />}
    </div>
  );
};

export default UserManagement;
