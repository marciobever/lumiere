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
    
    // Se o container existir, tentamos limpá-lo visualmente antes de reinserir (opcional, mas ajuda a evitar glitches)
    if (containerRef.current) {
        containerRef.current.innerHTML = '';
        
        // Recria a tag ins dinamicamente para garantir um "clean slate" para o AdSense
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'block';
        ins.style.textAlign = 'center';
        ins.style.width = '100%';
        ins.style.minHeight = format === 'fluid' ? '120px' : (format === 'rectangle' ? '250px' : '280px');
        
        ins.setAttribute('data-ad-client', ADSENSE_PUB_ID);
        ins.setAttribute('data-ad-slot', slotId);
        ins.setAttribute('data-ad-format', format === 'fluid' ? 'fluid' : 'auto');
        if (format === 'fluid') ins.setAttribute('data-ad-layout', 'in-article');
        ins.setAttribute('data-full-width-responsive', responsive ? "true" : "false");
        
        containerRef.current.appendChild(ins);
    }

    const timer = setTimeout(() => {
      if (adRef.current) return;

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
    }, 200);

    return () => clearTimeout(timer);
  }, [slotId]); // O slotId ou a Key mudando dispara isso

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
        style={{ minHeight: getMinHeight() }}
      >
          {/* A tag <ins> será injetada pelo useEffect para garantir refresh */}
      </div>
    </div>
  );
};