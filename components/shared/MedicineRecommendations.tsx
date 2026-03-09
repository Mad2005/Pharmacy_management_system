import React, { useState, useEffect } from 'react';
import { Medicine, User } from '../../types';
import { X, Sparkles, AlertCircle, ShoppingCart } from 'lucide-react';

interface MedicineRecommendationsProps {
  baseMedicine: Medicine;
  user: User;
  onClose: () => void;
  onAddToCart: (medicine: Medicine) => void;
}

export const MedicineRecommendations: React.FC<MedicineRecommendationsProps> = ({
  baseMedicine,
  user,
  onClose,
  onAddToCart
}) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/recommendations?medicineId=${baseMedicine.id}&customerId=${user.id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch recommendations');
        }
        const data = await res.json();
        setRecommendations(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [baseMedicine.id, user.id]);

  const getTagStyle = (type: string) => {
    switch (type) {
      case 'LOWER_COST':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'GENERIC':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'BOUGHT_BEFORE':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'PRESCRIBED_BEFORE':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300 relative">
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="text-yellow-500" size={24} /> 
              Smart Alternatives
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              AI suggestions for <span className="font-bold text-slate-700">{baseMedicine.name}</span> based on your history and composition.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-500">Analyzing clinical data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-red-500 text-center">
              <AlertCircle size={32} className="mb-2" />
              <p className="font-medium text-sm">{error}</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-slate-400" />
              </div>
              <h4 className="text-lg font-bold text-slate-700 mb-1">No alternatives found</h4>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                We couldn't find any other active medicines with the identical salt composition ({baseMedicine.saltComposition}) at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div 
                  key={rec.id} 
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-4 justify-between items-start md:items-center relative overflow-hidden"
                >
                  {rec.matchScore >= 3 && (
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div className="bg-yellow-400 text-yellow-900 text-[9px] font-bold uppercase tracking-wider text-center py-1 absolute top-3 -right-5 w-24 rotate-45 shadow-sm">
                        Best Match
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1 pr-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-800 text-lg">{rec.name}</h4>
                      {rec.prescriptionRequired && (
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold tracking-wide border border-indigo-100">
                          Rx
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 mb-2">
                      {rec.brand} • {rec.strength}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {rec.tags?.map((tag: any, idx: number) => (
                        <span 
                          key={idx} 
                          className={`px-2.5 py-1 text-[10px] font-bold rounded border ${getTagStyle(tag.type)}`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-2 md:mt-0 gap-4 md:gap-2">
                    <p className="text-xl font-bold text-slate-800">
                      ${(rec.price || 0).toFixed(2)}
                      {rec.price < baseMedicine.price && (
                        <span className="text-xs text-slate-400 line-through ml-2">
                          ${(baseMedicine.price || 0).toFixed(2)}
                        </span>
                      )}
                    </p>
                    <button 
                      onClick={() => {
                        onAddToCart(rec);
                        onClose();
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95"
                    >
                      <ShoppingCart size={14} /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
