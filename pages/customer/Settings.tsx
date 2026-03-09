
import React from 'react';
import { User } from '../../types';
import { Bell, Lock, User as UserIcon, Shield, Sliders, ToggleLeft, ToggleRight } from 'lucide-react';

interface SettingsProps {
  user: User;
  onUpdate: (user: User) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdate }) => {
  const togglePref = (key: keyof User['notificationPreferences']) => {
    const prefs = { ...(user.notificationPreferences || { stockAlerts: true, refillReminders: true, prescriptionStatus: true }) };
    prefs[key] = !prefs[key];
    onUpdate({ ...user, notificationPreferences: prefs });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-gray-800 uppercase tracking-tighter">Settings.</h2>
        <p className="text-gray-400 font-medium">Control your experience and security</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
          <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-3"><Bell className="text-[#DC143C]" /> Notifications</h3>
          <div className="space-y-6">
             {[
               { key: 'refillReminders', label: 'Refill Reminders', desc: 'Alerts when recurring medicines are due.' },
               { key: 'prescriptionStatus', label: 'Clinical Updates', desc: 'Alerts for prescription approvals or denials.' },
               { key: 'stockAlerts', label: 'Product Stock', desc: 'Alerts when items in your history are low in shop.' }
             ].map(pref => (
               <div key={pref.key} className="flex justify-between items-center p-6 bg-gray-50 rounded-[1.5rem]">
                  <div>
                     <p className="font-black text-gray-800 uppercase text-sm tracking-tight">{pref.label}</p>
                     <p className="text-xs text-gray-500 mt-1">{pref.desc}</p>
                  </div>
                  <button onClick={() => togglePref(pref.key as any)}>
                     {user.notificationPreferences?.[pref.key as keyof User['notificationPreferences']] ? (
                       <ToggleRight size={40} className="text-[#DC143C]" />
                     ) : (
                       <ToggleLeft size={40} className="text-gray-300" />
                     )}
                  </button>
               </div>
             ))}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
          <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-3"><Shield className="text-[#DC143C]" /> Privacy & Node Access</h3>
          <p className="text-sm text-gray-500 leading-relaxed italic mb-8">System node access is currently verified via Level 4 encryption. Your data is localized for immediate clinical use only.</p>
          <div className="flex gap-4">
            <button className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all">Download Data Log</button>
            <button className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all">System Audit</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
