
import React from 'react';
import { useDatabase } from '../store/database';
import { UserRole } from '../types';
import { Bell, X, AlertCircle, Info } from 'lucide-react';

interface NotificationCenterProps {
  role: UserRole;
  userId?: string;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ role, userId, onClose }) => {
  const { notifications, markNotificationRead } = useDatabase();
  
  const relevantNotifs = notifications.filter(n => 
    n.targetRoles.includes(role) && 
    (role !== UserRole.CUSTOMER || n.customerId === userId)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in duration-200">
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Bell size={18} className="text-crimson" />
          Updates
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>
      
      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        {relevantNotifs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Info size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">Everything clear!</p>
          </div>
        ) : (
          relevantNotifs.map((notif) => (
            <div 
              key={notif.id} 
              onClick={() => markNotificationRead(notif.id)}
              className={`p-4 border-b hover:bg-slate-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-crimson/5' : ''}`}
            >
              <div className="flex gap-3">
                <AlertCircle size={20} className={notif.type === 'LOW_STOCK' || notif.type === 'EXPIRY' || notif.type === 'REFILL' ? 'text-crimson' : 'text-pinkish'} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{notif.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                  <p className="text-[10px] text-slate-400 mt-2">{new Date(notif.createdAt).toLocaleTimeString()}</p>
                </div>
                {!notif.isRead && <div className="w-2 h-2 bg-crimson rounded-full mt-1"></div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
