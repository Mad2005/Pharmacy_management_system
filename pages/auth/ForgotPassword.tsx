
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDatabase } from '../../store/database';
import { Mail, Phone, ArrowLeft, KeyRound, ShieldCheck, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { UserRole } from '../../types';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { users, updateUser } = useDatabase();
  const params = new URLSearchParams(search);
  const roleFromUrl = params.get('role') as UserRole || UserRole.CUSTOMER;

  const [step, setStep] = useState<'IDENTITY' | 'OTP' | 'RESET' | 'SUCCESS'>('IDENTITY');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [targetUser, setTargetUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Find user by email or phone within the specific role to prevent role escalation
    const found = users.find(u => 
      (u.email === identifier || u.phone === identifier) && u.role === roleFromUrl
    );

    // Generic feedback style for security
    const fakeOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(fakeOtp);
    
    if (found) {
      setTargetUser(found);
      console.log(`[SECURE DEBUG] OTP for ${found.fullName}: ${fakeOtp}`);
      setStep('OTP');
    } else {
      // Still show the message to prevent account discovery
      setStep('OTP');
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === generatedOtp && targetUser) {
      setStep('RESET');
    } else {
      setError('Invalid verification code. Please try again.');
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    updateUser(targetUser.id, { password: newPassword });
    setStep('SUCCESS');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-['Inter']">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 relative overflow-hidden animate-in fade-in zoom-in duration-500 border border-slate-100">
        <Link to={`/${roleFromUrl.toLowerCase()}-login`} className="absolute top-8 left-8 p-2 text-slate-300 hover:text-crimson transition-colors">
          <ArrowLeft size={24} />
        </Link>

        {step === 'IDENTITY' && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-crimson/10 text-crimson rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={32} />
              </div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Recover Account</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">{roleFromUrl} Node Authorization</p>
            </div>

            <form onSubmit={handleIdentitySubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email or Mobile</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    required 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold ring-1 ring-slate-100 outline-none focus:ring-2 focus:ring-crimson"
                    placeholder="Enter registered credentials"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-crimson text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3">
                Send Reset Link <ArrowRight size={20}/>
              </button>
            </form>
          </div>
        )}

        {step === 'OTP' && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose/20 text-crimson rounded-2xl flex items-center justify-center mx-auto mb-6">
                <KeyRound size={32} />
              </div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Verify Identity</h1>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2">
                If the account exists, a 6-digit verification code has been dispatched.
              </p>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <input 
                required 
                maxLength={6}
                className="w-full text-center text-3xl font-black tracking-[0.5em] p-4 bg-slate-50 border-none rounded-2xl outline-none ring-2 ring-slate-100 focus:ring-crimson"
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
              />
              {error && <p className="text-xs text-crimson font-bold text-center">{error}</p>}
              <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Verify Code</button>
              <button type="button" onClick={() => setStep('IDENTITY')} className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-crimson">Resend Code</button>
            </form>
          </div>
        )}

        {step === 'RESET' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">New Passkey</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Establish fresh credentials</p>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                <input 
                  type="password"
                  required 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-crimson outline-none"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                <input 
                  type="password"
                  required 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold ring-1 ring-slate-100 focus:ring-2 focus:ring-crimson outline-none"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-xs text-crimson font-bold">{error}</p>}
              <button type="submit" className="w-full py-5 bg-crimson text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Reset Password</button>
            </form>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="text-center space-y-8">
            <div className="w-20 h-20 bg-cream text-crimson rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle size={48} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Reset Complete</h1>
              <p className="text-sm text-slate-400 font-medium mt-4 leading-relaxed">
                Your authorization passkey has been updated successfully.
              </p>
            </div>
            <button 
              onClick={() => navigate(`/${roleFromUrl.toLowerCase()}-login`)}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
