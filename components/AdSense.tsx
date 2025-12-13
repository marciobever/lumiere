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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Reinicia o estado se o slot mudar
    adRef.current = false;
    setIsLoaded(false);

    // O segredo para React: Esperar o componente ser "pintado" no DOM
    // Um delay de 200-500ms garante que a div tenha altura/largura antes do script do Google rodar.
    const timer = setTimeout(() => {
      // Proteção contra React StrictMode (execução dupla)
      if (adRef.current) return;

      try {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.adsbygoogle) {
            // @ts-ignore
            window.adsbygoogle.push({});
            adRef.current = true;
            setIsLoaded(true);
        }
      } catch (e) {
        console.error("AdSense push error:", e);
      }
    }, 300); // 300ms de delay

    return () => clearTimeout(timer);
  }, [slotId]);

  // Define altura mínima baseada no formato para evitar CLS (Cumulative Layout Shift)
  const getMinHeight = () => {
      if (format === 'fluid') return '120px';
      if (format === 'rectangle') return '250px';
      return '280px';
  };

  return (
    <div className={`my-8 flex flex-col items-center justify-center relative bg-white/5 rounded-lg border border-white/5 overflow-hidden transition-all duration-500 ${className}`}>
      
      {/* Label de Publicidade (Discreto) */}
      <div className="w-full bg-white/5 px-4 py-1 flex justify-center border-b border-white/5">
        <span className="text-[9px] text-gray-500 uppercase tracking-[0.2em]">Publicidade</span>
      </div>

      <div className="w-full flex items-center justify-center bg-black/20" style={{ minHeight: getMinHeight() }}>
          <ins className="adsbygoogle"
              style={{ 
                  display: 'block', 
                  textAlign: 'center', 
                  width: '100%', 
                  minHeight: getMinHeight() 
              }}
              data-ad-client={ADSENSE_PUB_ID}
              data-ad-slot={slotId}
              data-ad-format={format === 'fluid' ? 'fluid' : 'auto'}
              data-ad-layout={format === 'fluid' ? 'in-article' : undefined}
              data-full-width-responsive={responsive ? "true" : "false"}
          ></ins>
      </div>
    </div>
  );
};