import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export interface LasaWarning {
  med1: { id: string; name: string; composition: string };
  med2: { id: string; name: string; composition: string };
  similarity: string;
}

interface LasaWarningModalProps {
  warnings: LasaWarning[];
  onProceed: () => void;
  onCancel: () => void;
}

export const LasaWarningModal: React.FC<LasaWarningModalProps> = ({
  warnings,
  onProceed,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300 border-2 border-red-500">
        <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
          <div className="bg-red-100 p-3 rounded-2xl text-red-600 shrink-0">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-700 tracking-tight">
              Safety Alert: Name Confusion Risk
            </h3>
            <p className="text-sm text-red-600/80 mt-1 font-medium leading-relaxed">
              The medicine you are trying to add has a highly similar name to other medicines in our database, 
              but they have different active ingredients. Please verify you selected the correct medicine to prevent dispensing errors.
            </p>
          </div>
        </div>

        <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
          <div className="space-y-4">
            {warnings.map((warn, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 py-1.5 px-4 bg-red-100 text-red-700 font-bold text-[10px] rounded-bl-xl tracking-wider uppercase">
                  {warn.similarity}% Match
                </div>
                
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-400" /> Confusing Pair
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-slate-300">
                    <p className="font-bold text-slate-800 text-base">{warn.med1.name}</p>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 italic">
                      Composition: {warn.med1.composition}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-red-400">
                    <p className="font-bold text-red-600 text-base">{warn.med2.name}</p>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 italic">
                      Composition: {warn.med2.composition}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-3 justify-end items-center bg-white">
          <button 
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancel & Review Cart
          </button>
          <button 
            onClick={onProceed}
            className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <ShieldAlert size={18} /> I Verifed, Proceed Anyways
          </button>
        </div>
      </div>
    </div>
  );
};
