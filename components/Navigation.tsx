import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react';
import { ViewState } from '../types';

interface NavigationProps {
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
}

const Navigation: React.FC<NavigationProps> = ({ onNavigate, currentView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMenuClick = (item: string) => {
    setIsMobileMenuOpen(false);
    if (item === 'Talentos' || item === 'Nichos') {
      const hash = item === 'Talentos' ? '#profiles' : '#niches';
      
      if (currentView !== 'HOME') {
        // Force reload to home with anchor
        window.location.href = '/' + hash;
      } else {
        // Just scroll if already on home
        document.getElementById(hash.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    if (item === 'Partner Dashboard') {
        if (currentView !== 'DASHBOARD') window.location.href = '/?view=dashboard';
    }
  };

  const handleLogoClick = () => {
    window.location.href = '/';
  };

  return (
    <>
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${scrolled ? 'bg-black/90 backdrop-blur-md py-4 border-b border-white/10 shadow-lg' : 'bg-gradient-to-b from-black/90 to-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="text-2xl font-serif font-black text-white tracking-widest cursor-pointer flex items-center gap-1 z-50 relative" onClick={handleLogoClick}>
            LUMIÈRE<span className="text-yellow-600 text-3xl">.</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <div className="flex items-center space-x-8 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300">
              <button onClick={() => handleMenuClick('Talentos')} className="hover:text-yellow-600 transition-colors">Talentos</button>
              <button onClick={() => handleMenuClick('Nichos')} className="hover:text-yellow-600 transition-colors">Nichos</button>
              <button onClick={() => handleMenuClick('Partner Dashboard')} className="hover:text-white text-yellow-600 transition-colors flex items-center gap-2">Área do Parceiro</button>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-white hover:text-yellow-600 transition-colors ml-4"><Menu size={28} /></button>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-white hover:text-yellow-600 transition-colors z-50"><Menu size={28} /></button>
        </div>
      </nav>
      <div className={`fixed inset-0 bg-black/60 z-[150] backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div className={`absolute top-0 right-0 h-full w-[85%] md:w-[400px] bg-[#0a0a0a] border-l border-white/10 shadow-2xl p-8 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-16">
             <div className="text-2xl font-serif font-bold text-white tracking-widest">LUMIÈRE<span className="text-yellow-600">.</span></div>
             <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white transition-transform hover:rotate-90 duration-300"><X size={28}/></button>
          </div>
          <div className="flex flex-col space-y-8">
            <button onClick={() => handleMenuClick('Talentos')} className="text-left text-xl text-gray-200 hover:text-yellow-600 transition-colors border-b border-white/5 pb-4 flex justify-between items-center group font-serif italic">Talentos <ArrowRight size={18} className="text-gray-600 group-hover:text-yellow-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" /></button>
            <button onClick={() => handleMenuClick('Nichos')} className="text-left text-xl text-gray-200 hover:text-yellow-600 transition-colors border-b border-white/5 pb-4 flex justify-between items-center group font-serif italic">Nichos de Mercado <ArrowRight size={18} className="text-gray-600 group-hover:text-yellow-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" /></button>
             <button onClick={() => handleMenuClick('Partner Dashboard')} className="text-left text-xl text-yellow-600 hover:text-white transition-colors border-b border-white/5 pb-4 flex justify-between items-center group font-serif italic">Área do Parceiro <LayoutDashboard size={18} /></button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;