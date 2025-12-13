import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Lock, User, Key, AlertCircle } from 'lucide-react';
import { ViewState } from '../types';

interface NavigationProps {
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
}

const Navigation: React.FC<NavigationProps> = ({ onNavigate, currentView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Easter Egg & Login States
  const [logoClicks, setLogoClicks] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset clicks if idle for 3 seconds
  useEffect(() => {
    if (logoClicks > 0 && logoClicks < 15) {
      const timer = setTimeout(() => setLogoClicks(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [logoClicks]);

  const handleMenuClick = (item: string) => {
    setIsMobileMenuOpen(false);
    
    if (item === 'Talentos' || item === 'Nichos') {
      const targetId = item === 'Talentos' ? 'profiles' : 'niches';
      
      if (currentView !== 'HOME') {
        onNavigate('HOME');
        setTimeout(() => {
           const el = document.getElementById(targetId);
           if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogoClick = () => {
    // 1. Navigation Logic
    if (currentView !== 'HOME') {
        onNavigate('HOME');
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 2. Easter Egg Logic
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    
    if (newCount >= 15) {
        setShowLogin(true);
        setLogoClicks(0);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (username === 'marciobever' && password === '102030') {
          setShowLogin(false);
          setUsername('');
          setPassword('');
          setLoginError('');
          onNavigate('DASHBOARD');
      } else {
          setLoginError('Acesso Negado. Credenciais inválidas.');
      }
  };

  return (
    <>
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${scrolled ? 'bg-black/90 backdrop-blur-md py-4 border-b border-white/10 shadow-lg' : 'bg-gradient-to-b from-black/90 to-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="text-2xl font-serif font-black text-white tracking-widest cursor-pointer flex items-center gap-1 z-50 relative select-none" onClick={handleLogoClick}>
            LUMIÈRE<span className="text-yellow-600 text-3xl">.</span>
          </div>
          
          {/* Desktop Menu - Limpo, sem botão de Dashboard e sem ícone de Menu */}
          <div className="hidden md:flex items-center gap-10">
            <div className="flex items-center space-x-8 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300">
              <button onClick={() => handleMenuClick('Talentos')} className="hover:text-yellow-600 transition-colors">Talentos</button>
              <button onClick={() => handleMenuClick('Nichos')} className="hover:text-yellow-600 transition-colors">Nichos</button>
            </div>
            {/* Botão de menu hambúrguer removido do desktop conforme solicitado */}
          </div>

          {/* Mobile Menu Trigger */}
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-white hover:text-yellow-600 transition-colors z-50"><Menu size={28} /></button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-black/60 z-[150] backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}>
        <div className={`absolute top-0 right-0 h-full w-[85%] md:w-[400px] bg-[#0a0a0a] border-l border-white/10 shadow-2xl p-8 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-16">
             <div className="text-2xl font-serif font-bold text-white tracking-widest">LUMIÈRE<span className="text-yellow-600">.</span></div>
             <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white transition-transform hover:rotate-90 duration-300"><X size={28}/></button>
          </div>
          <div className="flex flex-col space-y-8">
            <button onClick={() => handleMenuClick('Talentos')} className="text-left text-xl text-gray-200 hover:text-yellow-600 transition-colors border-b border-white/5 pb-4 flex justify-between items-center group font-serif italic">Talentos <ArrowRight size={18} className="text-gray-600 group-hover:text-yellow-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" /></button>
            <button onClick={() => handleMenuClick('Nichos')} className="text-left text-xl text-gray-200 hover:text-yellow-600 transition-colors border-b border-white/5 pb-4 flex justify-between items-center group font-serif italic">Nichos de Mercado <ArrowRight size={18} className="text-gray-600 group-hover:text-yellow-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" /></button>
            {/* Dashboard removido do menu mobile também */}
          </div>
        </div>
      </div>

      {/* Login Modal (Easter Egg) */}
      {showLogin && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-[#0f0f0f] border border-yellow-600/30 rounded-lg p-8 shadow-[0_0_50px_rgba(202,138,4,0.1)] relative">
                <button onClick={() => setShowLogin(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                
                <div className="text-center mb-8">
                    <Lock className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                    <h2 className="font-serif text-2xl text-white">Área Restrita</h2>
                    <p className="text-gray-500 text-sm mt-2">Acesso administrativo exclusivo.</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 tracking-widest mb-2">Usuário</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-500" size={18} />
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded p-3 pl-10 text-white focus:border-yellow-600 focus:outline-none transition-colors"
                                placeholder="ID de Parceiro"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 tracking-widest mb-2">Senha</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-3 text-gray-500" size={18} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded p-3 pl-10 text-white focus:border-yellow-600 focus:outline-none transition-colors"
                                placeholder="Chave de Acesso"
                            />
                        </div>
                    </div>

                    {loginError && (
                        <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-3 rounded border border-red-500/20">
                            <AlertCircle size={14} /> {loginError}
                        </div>
                    )}

                    <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded uppercase tracking-widest transition-colors shadow-lg">
                        Entrar
                    </button>
                </form>
            </div>
        </div>
      )}
    </>
  );
};

export default Navigation;