import React, { useEffect, useRef } from 'react';
import { ADSENSE_PUB_ID } from '../config';

interface SmartAdUnitProps {
  slotId: string;
  format: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

export const SmartAdUnit: React.FC<SmartAdUnitProps> = ({ slotId, format, className }) => {
  const adRef = useRef<boolean>(false);

  useEffect(() => {
    // Prevent double injection in React StrictMode
    if (adRef.current) return;
    
    try {
        // @ts-ignore
        const adsbygoogle = window.adsbygoogle || [];
        adsbygoogle.push({});
        adRef.current = true;
    } catch (e) {
        console.error("AdSense push error:", e);
    }
  }, [slotId]);

  return (
    <div className={`my-12 flex flex-col items-center justify-center relative bg-white/5 rounded-lg border border-white/5 ${className}`}>
      <div className="w-full text-center p-4">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-4 border-b border-white/5 pb-2">Publicidade</span>
        <div className="min-h-[250px] w-full flex items-center justify-center">
            <ins className="adsbygoogle"
                style={{ display: 'block', textAlign: 'center', width: '100%', minHeight: format === 'fluid' ? '120px' : '280px' }}
                data-ad-client={ADSENSE_PUB_ID}
                data-ad-slot={slotId}
                data-ad-format={format === 'fluid' ? 'fluid' : 'auto'}
                data-ad-layout={format === 'fluid' ? 'in-article' : undefined}
                data-full-width-responsive="true"></ins>
        </div>
      </div>
    </div>
  );
};