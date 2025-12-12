
import React, { useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { OptimizedImage } from './Shared';
import { updateMetaTags } from '../utils';

const Hero: React.FC = () => {
  useEffect(() => {
    updateMetaTags(
        "LUMIÈRE | Exclusive Muse Collective",
        "Uma plataforma exclusiva onde a estética refinada encontra a inteligência de mercado. Descubra perfis de alto nível em finanças, luxo e tecnologia.",
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop"
    );
  }, []);

  return (
    <header className="relative h-[95vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <OptimizedImage src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60 animate-slow-zoom" alt="Luxury background" priority={true} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
      </div>
      <div className="absolute left-0 right-0 bottom-0 flex flex-col items-center justify-end pb-20 md:pb-32 max-h-[55vh] pointer-events-none">
        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto pointer-events-auto">
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-10 leading-none tracking-tight drop-shadow-2xl">A COLEÇÃO <br/> <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-700">LUMIÈRE</span></h1>
          <p className="text-gray-200 text-lg md:text-2xl font-light max-w-3xl mx-auto mb-16 leading-relaxed tracking-wide drop-shadow-lg font-serif italic opacity-95">"Uma plataforma exclusiva onde a estética refinada encontra a inteligência de mercado de alto nível."</p>
          <button onClick={() => document.getElementById('profiles')?.scrollIntoView({behavior: 'smooth'})} className="animate-bounce mt-4 text-white/50 hover:text-yellow-600 transition-colors cursor-pointer"><ChevronDown size={40} strokeWidth={1} /></button>
        </div>
      </div>
    </header>
  );
};

export default Hero;
