
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, ArrowRight, Lock, ChevronDown } from 'lucide-react';
import { ADSENSE_PUB_ID } from '../config';

// --- OPTIMIZED IMAGE ---
export const OptimizedImage: React.FC<{ src: string; alt: string; className?: string; priority?: boolean; }> = ({ src, alt, className, priority = false }) => {
  if (!src) return <div className={`bg-gray-900 ${className}`}></div>;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      // @ts-ignore
      fetchPriority={priority ? "high" : "auto"}
      onError={(e) => {
          (e.target as HTMLImageElement).style.opacity = '0.5';
      }}
    />
  );
};

// --- SKELETON LOADER ---
export const MuseSkeleton = () => (
  <div className="flex flex-col animate-pulse">
    <div className="relative aspect-[3/4] bg-gray-900 mb-8 w-full shadow-lg border border-white/5 overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-white/0"></div>
       <div className="absolute inset-0 bg-white/5 animate-shimmer"></div>
    </div>
    <div className="flex justify-between items-start pt-2 border-t border-white/10">
      <div className="space-y-3 w-full mt-2">
        <div className="h-6 bg-gray-800 w-3/4 rounded-sm"></div>
        <div className="h-3 bg-gray-900 w-1/3 rounded-sm"></div>
      </div>
      <div className="w-10 h-10 rounded-full bg-gray-800"></div>
    </div>
  </div>
);

// --- SMART AD UNIT ---
export const SmartAdUnit: React.FC<{ slotId: string; format: 'auto' | 'fluid' | 'rectangle'; className?: string }> = ({ slotId, format, className }) => {
  useEffect(() => {
    try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, [slotId]);

  return (
    <div className={`my-16 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
      <div className="w-full text-center">
        <span className="text-[9px] text-gray-700 uppercase tracking-widest block mb-2 opacity-50">Publicidade</span>
        <ins className="adsbygoogle"
             style={{ display: 'block', textAlign: 'center', minHeight: format === 'fluid' ? '100px' : '250px' }}
             data-ad-client={ADSENSE_PUB_ID}
             data-ad-slot={slotId}
             data-ad-format={format === 'fluid' ? 'fluid' : 'auto'}
             data-ad-layout={format === 'fluid' ? 'in-article' : undefined}
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
};

// --- INTERACTION BANNER ---
export const InteractionBanner: React.FC<{ name: string; type: 'whatsapp' | 'vip'; onNext: () => void }> = ({ name, type, onNext }) => {
  if (type === 'whatsapp') {
    return (
      <div onClick={onNext} className="cursor-pointer my-12 mx-auto max-w-2xl transform hover:scale-[1.02] transition-all duration-300">
        <div className="bg-[#128C7E]/10 border border-[#128C7E] rounded-xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(18,140,126,0.2)]">
           <div className="flex items-center gap-4">
              <div className="bg-[#128C7E] p-3 rounded-full text-white animate-pulse"><MessageCircle size={24} /></div>
              <div>
                 <h4 className="text-[#128C7E] font-bold text-lg leading-tight">Fale com {name} agora</h4>
                 <p className="text-gray-400 text-xs flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Online • Responde em 2 min</p>
              </div>
           </div>
           <ArrowRight className="text-[#128C7E]" />
        </div>
      </div>
    );
  }
  return (
    <div onClick={onNext} className="cursor-pointer my-12 mx-auto max-w-2xl transform hover:scale-[1.02] transition-all duration-300">
      <div className="bg-gradient-to-r from-red-900/20 to-pink-900/20 border border-red-500/30 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(239,68,68,0.2)] relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
         <h4 className="text-red-400 font-bold uppercase tracking-[0.2em] text-sm mb-2 relative z-10 flex items-center gap-2"><Lock size={14} /> Acesso Privado</h4>
         <h3 className="text-white font-serif text-2xl mb-1 relative z-10">Ver conteúdo sem censura</h3>
         <p className="text-gray-400 text-sm mb-4 relative z-10">Clique para liberar as fotos íntimas de {name}</p>
         <button className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-red-700 transition-colors relative z-10 w-full md:w-auto">Liberar Acesso</button>
      </div>
    </div>
  );
};

// --- FAQ ITEM ---
export const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full py-6 flex justify-between items-center text-left hover:bg-white/5 transition-colors px-4">
        <span className="text-lg text-gray-300 font-serif">{question}</span>
        <ChevronDown size={20} className={`text-yellow-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-6 px-4' : 'max-h-0 opacity-0'}`}>
        <p className="text-gray-300 leading-relaxed font-light">{answer}</p>
      </div>
    </div>
  );
};
