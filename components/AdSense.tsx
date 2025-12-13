import React, { useEffect, useRef, useState } from 'react';
import { ADSENSE_PUB_ID } from '../config';

interface SmartAdUnitProps {
  slotId: string;
  format: 'auto' | 'fluid' | 'rectangle';
  className?: string;
  responsive?: boolean;
}

export const SmartAdUnit: React.FC<SmartAdUnitProps> = ({ slotId, format, className, responsive = true }) => {
  const adRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Reset estado
    adRef.current = false;
    
    // Se o container existir, limpa e recria a tag <ins>
    if (containerRef.current) {
        containerRef.current.innerHTML = '';
        
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'block';
        ins.style.textAlign = 'center';
        ins.style.width = '100%'; // Garante largura explícita
        ins.style.minHeight = format === 'fluid' ? '120px' : (format === 'rectangle' ? '250px' : '280px');
        
        ins.setAttribute('data-ad-client', ADSENSE_PUB_ID);
        ins.setAttribute('data-ad-slot', slotId);
        ins.setAttribute('data-ad-format', format === 'fluid' ? 'fluid' : 'auto');
        if (format === 'fluid') ins.setAttribute('data-ad-layout', 'in-article');
        ins.setAttribute('data-full-width-responsive', responsive ? "true" : "false");
        
        containerRef.current.appendChild(ins);
    }

    // Função para tentar carregar o anúncio com retries
    const attemptPush = (retriesLeft: number) => {
        if (adRef.current) return;

        // Verifica se o container tem largura real antes de chamar o AdSense
        if (containerRef.current && containerRef.current.offsetWidth > 0) {
            try {
                // @ts-ignore
                if (typeof window !== 'undefined' && window.adsbygoogle) {
                    // @ts-ignore
                    window.adsbygoogle.push({});
                    adRef.current = true;
                }
            } catch (e) {
                console.error("AdSense push error:", e);
            }
        } else {
            // Se a largura for 0 (oculto ou não renderizado), tenta novamente em 300ms
            if (retriesLeft > 0) {
                setTimeout(() => attemptPush(retriesLeft - 1), 300);
            }
        }
    };

    // Delay inicial de 200ms + 5 tentativas (aprox 1.5s total de tolerância)
    const timer = setTimeout(() => attemptPush(5), 200);

    return () => clearTimeout(timer);
  }, [slotId, format, responsive]);

  const getMinHeight = () => {
      if (format === 'fluid') return '120px';
      if (format === 'rectangle') return '250px';
      return '280px';
  };

  return (
    <div className={`my-8 flex flex-col items-center justify-center relative bg-white/5 rounded-lg border border-white/5 overflow-hidden transition-all duration-500 ${className}`}>
      <div className="w-full bg-white/5 px-4 py-1 flex justify-center border-b border-white/5">
        <span className="text-[9px] text-gray-500 uppercase tracking-[0.2em]">Publicidade</span>
      </div>

      <div 
        ref={containerRef}
        className="w-full flex items-center justify-center bg-black/20" 
        style={{ minHeight: getMinHeight(), width: '100%' }}
      >
          {/* A tag <ins> será injetada pelo useEffect */}
      </div>
    </div>
  );
};