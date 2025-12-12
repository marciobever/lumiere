import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import { 
  Menu, X, ArrowRight, Maximize2, Lock, ChevronDown, Loader2, LayoutDashboard, ArrowLeft, Wand2, Trash2, CheckCircle, HelpCircle, Lightbulb, FileJson, Globe2, HardDrive, MessageCircle, FileUp, Webhook, Send
} from 'lucide-react';
import { MuseProfile, ViewState, DashboardInputs } from './types';

// --- CONFIGURATION ---
const ADSENSE_PUB_ID = "ca-pub-0000000000000000"; 
const LOCAL_STORAGE_KEY = 'lumiere_muses_backup';

// --- N8N CONFIGURATION ---
const N8N_WEBHOOK_URL = "https://n8n.seureview.com.br/webhook/lumiere"; 

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://wdjddlkbudtncskgawgh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkamRkbGtidWR0bmNza2dhd2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjEzMDgsImV4cCI6MjA2MjI5NzMwOH0.speHlbECXo_IMbMz3AO10C7ubU72kS1kRJNF5LH_Z0w';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- INITIAL DATA ---
const INITIAL_MUSES: MuseProfile[] = [];

// --- HELPER: API Key Handler ---
const getApiKey = () => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}
  return process.env.API_KEY || '';
};

// --- HELPER: Meta Tag Updater (SEO & Sharing) ---
const updateMetaTags = (title: string, description: string, image: string) => {
  document.title = title;
  
  const setMeta = (selector: string, attribute: string, value: string) => {
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      if (selector.startsWith('meta[name')) {
        element.setAttribute('name', selector.replace('meta[name="', '').replace('"]', ''));
      } else if (selector.startsWith('meta[property')) {
        element.setAttribute('property', selector.replace('meta[property="', '').replace('"]', ''));
      }
      document.head.appendChild(element);
    }
    element.setAttribute(attribute, value);
  };

  setMeta('meta[name="description"]', 'content', description);
  setMeta('meta[property="og:title"]', 'content', title);
  setMeta('meta[property="og:description"]', 'content', description);
  setMeta('meta[property="og:image"]', 'content', image);
  setMeta('meta[name="twitter:title"]', 'content', title);
  setMeta('meta[name="twitter:description"]', 'content', description);
  setMeta('meta[name="twitter:image"]', 'content', image);
};

// --- HELPER: Clean JSON Parsing ---
const cleanAndParseJSON = (text: string) => {
  try {
    let clean = text.replace(/```json/g, '').replace(/```/g, '');
    clean = clean.replace(/\*\*/g, ''); 
    return JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse JSON", e);
    return {};
  }
};

// --- HELPER: Delay for Rate Limiting ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- HELPER: Image Compression ---
const compressImage = (base64Str: string, quality = 0.8): Promise<string> => {
  if (base64Str.startsWith('http')) return Promise.resolve(base64Str); // Skip if already a URL
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

// --- OPTIMIZED IMAGE COMPONENT ---
const OptimizedImage: React.FC<{ src: string; alt: string; className?: string; priority?: boolean; }> = ({ src, alt, className, priority = false }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      // @ts-ignore
      fetchPriority={priority ? "high" : "auto"}
    />
  );
};

// --- SKELETON LOADER ---
const MuseSkeleton = () => (
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
const SmartAdUnit: React.FC<{ slotId: string; format: 'auto' | 'fluid' | 'rectangle'; className?: string }> = ({ slotId, format, className }) => {
  const adRef = useRef<HTMLDivElement>(null);
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
const InteractionBanner: React.FC<{ name: string; type: 'whatsapp' | 'vip'; onNext: () => void }> = ({ name, type, onNext }) => {
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

// --- FAQ COMPONENT ---
const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
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

// --- NAVIGATION ---
const Navigation: React.FC<{ onNavigate: (view: ViewState) => void, currentView: ViewState }> = ({ onNavigate, currentView }) => {
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
      if (currentView !== 'HOME') {
        onNavigate('HOME');
        setTimeout(() => document.getElementById(item === 'Talentos' ? 'profiles' : 'niches')?.scrollIntoView({ behavior: 'smooth' }), 150);
      } else {
        document.getElementById(item === 'Talentos' ? 'profiles' : 'niches')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    if (item === 'Partner Dashboard') onNavigate('DASHBOARD');
  };

  return (
    <>
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${scrolled ? 'bg-black/90 backdrop-blur-md py-4 border-b border-white/10 shadow-lg' : 'bg-gradient-to-b from-black/90 to-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="text-2xl font-serif font-black text-white tracking-widest cursor-pointer flex items-center gap-1 z-50 relative" onClick={() => onNavigate('HOME')}>
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

// --- HERO SECTION ---
const Hero: React.FC = () => {
  useEffect(() => {
    // Reset SEO to Homepage when Hero mounts
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
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-10 leading-none tracking-tight drop-shadow-2xl">THE MUSE <br/> <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-700">COLLECTIVE</span></h1>
          <p className="text-gray-200 text-lg md:text-2xl font-light max-w-3xl mx-auto mb-16 leading-relaxed tracking-wide drop-shadow-lg font-serif italic opacity-95">"Uma plataforma exclusiva onde a estética refinada encontra a inteligência de mercado de alto nível."</p>
          <button onClick={() => document.getElementById('profiles')?.scrollIntoView({behavior: 'smooth'})} className="animate-bounce mt-4 text-white/50 hover:text-yellow-600 transition-colors cursor-pointer"><ChevronDown size={40} strokeWidth={1} /></button>
        </div>
      </div>
    </header>
  );
};

// --- PROFILE PAGE ---
const ProfilePage: React.FC<{ profile: MuseProfile; allMuses: MuseProfile[]; onSelectProfile: (p: MuseProfile) => void; onBack: () => void }> = ({ profile, allMuses, onSelectProfile, onBack }) => {
  useEffect(() => { 
    window.scrollTo(0, 0); 
    // Update SEO dynamically for social sharing
    updateMetaTags(
        `${profile.name} | Lumière Collective`,
        profile.intro || `Conheça ${profile.name}, especialista em ${profile.niche}.`,
        profile.cover_url
    );
  }, [profile]);

  const relatedMuses = allMuses.filter(m => m.id !== profile.id).sort(() => 0.5 - Math.random()).slice(0, 3);
  
  // Split body string into paragraphs for layout
  const paragraphs = profile.body ? profile.body.split('\n').filter(p => p.trim().length > 0) : ["Conteúdo indisponível."];

  const handleRandomNext = () => {
     const others = allMuses.filter(m => m.id !== profile.id);
     if (others.length > 0) {
        const random = others[Math.floor(Math.random() * others.length)];
        onSelectProfile(random);
     } else {
        alert("Mais musas chegando em breve.");
     }
  };

  return (
    <div className="bg-[#050505] min-h-screen animate-fade-in pb-32">
      <div className="fixed top-28 left-8 z-40 hidden md:block">
        <button onClick={onBack} className="bg-black/50 hover:bg-yellow-600 p-3 rounded-full text-white backdrop-blur-md transition-all border border-white/10 group flex items-center gap-2 pr-4 shadow-xl">
          <ArrowLeft size={18} /> <span className="text-xs font-bold uppercase tracking-widest hidden group-hover:inline">Voltar</span>
        </button>
      </div>

      <div className="relative h-[95vh] w-full overflow-hidden">
        <OptimizedImage src={profile.cover_url} className="w-full h-full object-cover object-center" alt={profile.name} priority={true} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-black/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent opacity-100"></div>
        <div className="absolute left-0 right-0 bottom-0 z-20 flex flex-col justify-end px-6 md:px-12 pb-20 md:pb-32 pointer-events-none max-h-[55vh]">
          <div className="container mx-auto max-w-7xl pointer-events-auto flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-6 md:mb-8 animate-fade-in-up">
               <span className="bg-yellow-600 text-black px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(202,138,4,0.3)]">{profile.niche}</span>
               <span className="text-gray-300 text-xs uppercase tracking-widest border-l border-gray-500 pl-4 drop-shadow-md">12 min de leitura</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-white mb-6 md:mb-8 leading-[1.1] max-w-5xl shadow-black drop-shadow-2xl tracking-tight animate-fade-in-up delay-100 line-clamp-4">{profile.title}</h1>
            <p className="text-lg md:text-2xl text-gray-100 italic max-w-3xl font-serif md:border-l-4 border-yellow-600 md:pl-8 leading-snug drop-shadow-lg animate-fade-in-up delay-200 line-clamp-3">"{profile.intro}"</p>
          </div>
        </div>
      </div>

      <div className="bg-[#050505] text-gray-200 py-12 md:py-24 px-6 md:px-12 relative z-30">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col gap-12">
            <div className="prose prose-invert prose-lg max-w-none">
              
              {/* Paragraph 0 */}
              {paragraphs[0] && (
                 <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 first-letter:text-7xl first-letter:font-serif first-letter:text-yellow-600 first-letter:float-left first-letter:mr-4 first-letter:mt-[-8px] mb-12 font-light tracking-wide">{paragraphs[0]}</p>
              )}
              
              <SmartAdUnit slotId="1624191321" format="auto" className="w-full max-w-4xl mx-auto" />
              
              {profile.gallery_urls[0] && (
                <div className="my-16 relative group overflow-hidden shadow-2xl border border-white/5">
                  <OptimizedImage src={profile.gallery_urls[0]} className="w-full h-[400px] md:h-[800px] object-cover transition-transform duration-1000 group-hover:scale-105" alt="Editorial 1" />
                </div>
              )}

              {/* Paragraph 1 */}
              {paragraphs[1] && (
                  <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-12 tracking-wide font-light">{paragraphs[1]}</p>
              )}
              
              <InteractionBanner name={profile.name} type="whatsapp" onNext={handleRandomNext} />
              
              {/* Paragraph 2 */}
              {paragraphs[2] && (
                  <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-16 tracking-wide font-light">{paragraphs[2]}</p>
              )}

              <div className="my-20 p-6 md:p-10 bg-gradient-to-r from-yellow-900/20 to-black border border-yellow-600/30 rounded-lg relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><Lightbulb size={120} className="text-yellow-600" /></div>
                 <h4 className="text-yellow-500 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2"><Lock size={14} /> Segredo de Mercado</h4>
                 <h3 className="font-serif text-2xl text-white mb-6">A Estratégia Oculta</h3>
                 <p className="text-lg text-gray-100 leading-relaxed relative z-10 font-medium">{profile.insider_secret}</p>
                 {profile.keywords && (
                    <div className="mt-8 flex gap-3 flex-wrap">{profile.keywords.slice(0,3).map(kw => (<span key={kw} className="text-xs bg-yellow-600/10 text-yellow-500 px-3 py-1 rounded border border-yellow-600/20">{kw}</span>))}</div>
                 )}
              </div>
              
              <SmartAdUnit slotId="6844728415" format="fluid" className="w-full" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-20">
                 {profile.gallery_urls[1] && (
                   <div className="h-[400px] md:h-[500px] md:mt-12 shadow-lg border border-white/5">
                      <OptimizedImage src={profile.gallery_urls[1]} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt="Detail 1" />
                   </div>
                 )}
                 {profile.gallery_urls[2] && (
                   <div className="h-[400px] md:h-[500px] shadow-lg border border-white/5">
                      <OptimizedImage src={profile.gallery_urls[2]} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt="Detail 2" />
                   </div>
                 )}
              </div>
              
              {/* Paragraphs 3 & 4 */}
              {paragraphs[3] && <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-12 tracking-wide font-light">{paragraphs[3]}</p>}
              {paragraphs[4] && <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-12 tracking-wide font-light">{paragraphs[4]}</p>}
              
              <InteractionBanner name={profile.name} type="vip" onNext={handleRandomNext} />
              <SmartAdUnit slotId="1006896613" format="auto" className="w-full max-w-[336px] mx-auto" />
              
              <div className="my-24 border-l-4 border-white pl-8 md:pl-12 py-4">
                 <h3 className="font-serif text-3xl text-white mb-6">O Veredito da Lumière</h3>
                 <p className="text-xl text-gray-200 italic font-serif leading-relaxed">"{profile.expert_verdict}"</p>
                 <div className="mt-6 flex items-center gap-4">
                    <OptimizedImage src={profile.cover_url} className="w-12 h-12 rounded-full object-cover border border-white/20" alt="Author" />
                    <div><p className="text-sm text-white font-bold uppercase">{profile.name}</p><p className="text-xs text-gray-500">{profile.niche} Specialist</p></div>
                 </div>
              </div>
              
              {paragraphs[5] && <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-20 tracking-wide font-light">{paragraphs[5]}</p>}
              
              {/* If there are more paragraphs, render them here */}
              {paragraphs.length > 6 && paragraphs.slice(6).map((p, i) => (
                   <p key={i} className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-12 tracking-wide font-light">{p}</p>
              ))}

              {profile.faqs && profile.faqs.length > 0 && (
                <div className="my-24 bg-gray-900/30 p-8 md:p-12 rounded-xl border border-white/5">
                   <h3 className="font-serif text-3xl text-white mb-8 flex items-center gap-3"><HelpCircle className="text-yellow-600" /> Perguntas Frequentes</h3>
                   <div className="space-y-2">{profile.faqs.map((faq, idx) => (<FAQItem key={idx} question={faq.question} answer={faq.answer} />))}</div>
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-white/10 pt-24 mt-12">
            <h3 className="font-serif text-4xl md:text-5xl text-white text-center mb-16">Galeria Exclusiva</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[250px] md:auto-rows-[300px]">
              {profile.gallery_urls.slice(3, 8).map((img, i) => (
                <div key={i} className={`relative overflow-hidden group cursor-pointer ${i === 0 || i === 3 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'}`}>
                  <OptimizedImage src={img} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out" alt={`Gallery ${i+3}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                     <Maximize2 className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" size={40} />
                     <span className="text-white text-xs font-bold uppercase tracking-[0.2em] drop-shadow-md">Ampliar</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
           {relatedMuses.length > 0 && (
            <div className="mt-32 pt-24 border-t border-white/10">
               <div className="flex items-center justify-between mb-16">
                 <h3 className="font-serif text-3xl md:text-4xl text-white">Mais da Lumière</h3>
                 <button onClick={onBack} className="group/btn text-gray-400 hover:text-white flex items-center gap-3 uppercase tracking-widest text-xs font-bold transition-colors relative">
                    <span className="relative">VER TUDO <span className="absolute left-0 bottom-[-2px] w-0 h-[1px] bg-yellow-600 transition-all duration-300 group-hover/btn:w-full"></span></span>
                    <span className="bg-white/10 p-2 rounded-full group-hover/btn:bg-yellow-600 group-hover/btn:text-black transition-all transform group-hover/btn:translate-x-1"><ArrowRight size={14} /></span>
                 </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                 {relatedMuses.map((related) => (
                   <div key={related.id} onClick={() => onSelectProfile(related)} className="group cursor-pointer flex flex-col transition-transform duration-500 hover:scale-[1.02]">
                     <div className="aspect-[3/4] mb-6 overflow-hidden relative border border-white/10 rounded-sm transition-all duration-500 group-hover:border-yellow-600/50 group-hover:shadow-[0_0_30px_rgba(202,138,4,0.3)]">
                        <OptimizedImage src={related.cover_url} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" alt={related.name} />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                        <div className="absolute top-4 left-4 bg-yellow-600 text-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest z-10 shadow-lg">{related.niche}</div>
                     </div>
                     <h4 className="font-serif text-2xl text-white mb-2 group-hover:text-yellow-600 transition-colors duration-300">{related.name}</h4>
                     <p className="text-sm text-gray-500 line-clamp-2 group-hover:text-gray-400 transition-colors duration-300">{related.tagline}</p>
                   </div>
                 ))}
               </div>
            </div>
           )}
        </div>
      </div>
    </div>
  );
};

// --- DASHBOARD ---
const Dashboard: React.FC<{ onGenerate: (data: MuseProfile) => Promise<void>; onDelete: (id: string) => Promise<void>; muses: MuseProfile[]; onSaveToN8N: (muse: MuseProfile) => Promise<void>; }> = ({ onGenerate, onDelete, muses, onSaveToN8N }) => {
  const [inputs, setInputs] = useState<DashboardInputs>({ niche: '', name: '', details: '' });
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [webhookUrl, setWebhookUrl] = useState(N8N_WEBHOOK_URL);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addLog(`Lendo arquivo: ${file.name}...`);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        // Basic mapping for legacy JSONs if uploaded
        const json = JSON.parse(text);
        if (!json.name) throw new Error("JSON inválido: Faltando nome.");
        
        // Map legacy to new structure if needed
        const mappedProfile: MuseProfile = {
            id: json.id || Date.now().toString(),
            slug: json.slug || json.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: json.name,
            niche: json.niche,
            tagline: json.tagline,
            physical_description: json.physicalDescription || json.physical_description || "",
            is_remote: false,
            title: json.content?.title || json.title || "",
            intro: json.content?.intro || json.intro || "",
            body: typeof json.body === 'string' ? json.body : (json.content?.bodyParagraphs || []).join('\n\n'),
            expert_verdict: json.content?.expertVerdict || json.expert_verdict || "",
            insider_secret: json.content?.insiderSecret || json.insider_secret || "",
            cover_url: json.coverImage || json.cover_url || "",
            gallery_urls: json.images || json.gallery_urls || [],
            keywords: json.content?.keywords || json.keywords,
            faqs: json.content?.faqs || json.faqs
        };

        await onGenerate(mappedProfile);
        addLog("SUCESSO: JSON carregado e adaptado!");
      } catch (err: any) {
        addLog(`ERRO: ${err.message}`);
        alert("Erro ao ler JSON. Verifique o formato.");
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveClick = async (muse: MuseProfile) => {
      if (!webhookUrl || webhookUrl === "SEU_WEBHOOK_N8N_AQUI") {
          addLog("ERRO: Configure a URL do Webhook acima.");
          alert("Por favor, insira a URL do Webhook do n8n no campo de configuração.");
          return;
      }

      setPublishing(muse.id);
      addLog(`Otimizando imagens para envio (isso evita erros 500)...`);
      
      try {
          // COMPRESS IMAGES BEFORE SENDING
          const optimizedCover = await compressImage(muse.cover_url);
          const optimizedImages = await Promise.all(muse.gallery_urls.map(img => compressImage(img)));
          
          // Construct payload matching the DB structure exactly
          const payload = { 
             ...muse, 
             cover_url: optimizedCover, 
             gallery_urls: optimizedImages 
          };

          addLog(`Enviando dados para n8n (${muse.name})...`);
          console.log("Enviando payload para n8n:", payload);
          
          const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload)
          });

          if (!response.ok) {
              throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
          }

          const result = await response.json().catch(() => ({})); 
          addLog(`RESPOSTA N8N: ${JSON.stringify(result)}`);
          
          // Se chegou aqui, o n8n recebeu. Atualiza estado local.
          await onSaveToN8N(muse);
          addLog(`SUCESSO TOTAL: ${muse.name} enviado para processamento.`);

      } catch (e: any) {
          console.error("Erro n8n:", e);
          addLog(`FALHA NO ENVIO: ${e.message}. Se for erro 500/413, o n8n recusou o tamanho do pacote.`);
      } finally {
          setPublishing(null);
      }
  };

  const generateRandomPersona = async () => {
    setLoading(true);
    addLog("Ativando Gerador Genético de 'Musas'...");
    const ethnicities = ["Brazilian Mixed", "Japanese", "Afro-Brazilian", "Scandinavian", "Italian", "Korean", "Colombian", "Russian"];
    const bodyTypes = ["Slim & Toned", "Curvy Hourglass", "Athletic", "Tall & Slender", "Voluminous"];
    const vibes = ["Tattooed Alternative", "Elegant Old Money", "Beach Bunny", "High-Fashion Edgy", "Gym Rat", "Boho Chic", "Minimalist", "Streetwear"];
    
    const randomEthnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)];
    const randomBody = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
    const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];
    const randomAge = Math.floor(Math.random() * (26 - 19 + 1)) + 19;

    const physicalPrompt = `Stunning woman, ${randomAge} years old. Ethnicity: ${randomEthnicity}. Body Type: ${randomBody}. Style: ${randomVibe}.`;

    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const prompt = `Generate a JSON profile for a Social Media Model (${randomVibe}). Output JSON ONLY: {"name": "Name", "niche": "High CPM Niche", "details": "${physicalPrompt}"}`;
      
      const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json" } });
      const data = cleanAndParseJSON(result.text || "{}");
      setInputs({ name: data.name, niche: data.niche, details: physicalPrompt });
      addLog(`DNA Gerado: ${data.name} | ${randomVibe}`);
    } catch (error) { 
      console.error(error); 
      setInputs({ name: "Bella", niche: "Luxury Travel", details: physicalPrompt }); 
      addLog("IA ocupada, usando dados padrão.");
    } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!inputs.niche || !inputs.name || !inputs.details) { addLog("Erro: Preencha todos os campos."); return; }
    setLoading(true); setLogs([]); addLog("Iniciando sessão de fotos...");

    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      addLog("Criando conteúdo...");
      const textPrompt = `Create a JSON profile for "${inputs.name}", expert in "${inputs.niche}". Language: PT-BR. Tone: Seductive, intelligent. JSON Schema: { "tagline": "", "title": "", "intro": "", "bodyParagraphs": ["p1","p2","p3","p4","p5","p6"], "keywords": [], "expertVerdict": "", "faqs": [{"question":"","answer":""}], "insiderSecret": "" }`;

      const textResult = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: textPrompt, config: { responseMimeType: "application/json" } });
      const content = cleanAndParseJSON(textResult.text || "{}");

      addLog("Fotografando capa...");
      const basePrompt = `Portrait of a woman (${inputs.details}). Style: High-end Instagram Model, 8k, realistic skin, soft lighting. Clothing: Stylish, revealing but classy.`;
      
      const coverResult = await ai.models.generateContent({ model: "gemini-2.5-flash-image", contents: basePrompt });
      const coverBase64 = coverResult.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
      if (!coverBase64) throw new Error("Falha na capa");
      const coverImage = `data:image/png;base64,${coverBase64}`;

      await delay(5000); 
      addLog("Produzindo editorial...");
      
      const galleryImages = [coverImage];
      const scenarios = ["Lounging on bed", "By luxury pool", "Gym selfie", "Close up face", "Evening wear"];
      
      for (const scene of scenarios) {
          try {
             addLog(`Capturando: ${scene}...`);
             const res = await ai.models.generateContent({ model: "gemini-2.5-flash-image", contents: `Photo of SAME woman (${inputs.details}). Scene: ${scene}. Style: Photorealistic 4k.` });
             const img = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
             if(img) galleryImages.push(`data:image/png;base64,${img}`);
             await delay(4000);
          } catch(e) { console.warn("Skip image", e); }
      }
      
      while(galleryImages.length < 5) galleryImages.push(coverImage); 

      // Transform raw AI JSON to flat Database Structure
      const newMuse: MuseProfile = {
        id: Date.now().toString(),
        slug: inputs.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        name: inputs.name,
        niche: inputs.niche,
        tagline: content.tagline,
        physical_description: inputs.details,
        is_remote: false,
        
        // Editorial mapped fields
        title: content.title,
        intro: content.intro,
        body: content.bodyParagraphs ? content.bodyParagraphs.join('\n\n') : "",
        expert_verdict: content.expertVerdict,
        insider_secret: content.insiderSecret,
        
        // Images mapped fields
        cover_url: coverImage,
        gallery_urls: galleryImages,
        
        // Extras
        keywords: content.keywords,
        faqs: content.faqs
      };

      await onGenerate(newMuse);
      addLog("SUCESSO! Perfil criado. Agora clique em 'Enviar para Workflow' para processar.");
      setInputs({ niche: '', name: '', details: '' });
    } catch (err) { console.error(err); addLog(`ERRO: ${(err as Error).message}`); } finally { setLoading(false); }
  };
  
  const handleDownloadSingle = (muse: MuseProfile) => {
    const blob = new Blob([JSON.stringify(muse, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${muse.slug || muse.id}.json`; a.click();
  };

  return (
    <div className="bg-[#111] min-h-screen pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-4xl text-white font-serif mb-8 flex items-center gap-4"><LayoutDashboard className="text-yellow-600" /> Painel de Criação</h2>
        
        <div className="bg-gray-900 p-6 rounded-lg border border-white/10 mb-12 flex flex-col md:flex-row gap-6 items-center justify-between">
           <div><h3 className="text-white font-bold uppercase tracking-widest text-sm mb-1">Gerenciamento</h3><p className="text-gray-500 text-xs">Total: {muses.length} modelos</p></div>
           
           <div className="flex-1 w-full md:w-auto">
               <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Webhook URL (n8n)</label>
               <input 
                  type="text" 
                  value={webhookUrl} 
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://seu-n8n.com/webhook/..."
                  className="w-full bg-black border border-white/20 px-3 py-2 text-xs text-white rounded focus:border-yellow-600 outline-none"
               />
           </div>

           <div className="flex gap-4">
              <input type="file" ref={fileInputRef} onChange={handleJsonUpload} className="hidden" accept=".json" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-blue-900/30 text-blue-400 border border-blue-600/50 hover:bg-blue-900/50 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap">
                  <FileUp size={14} /> Carregar JSON
              </button>
           </div>
        </div>

        <div className="bg-gray-900/50 p-8 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden">
           <button onClick={generateRandomPersona} disabled={loading} className="absolute top-8 right-8 text-yellow-600 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors z-10"><Wand2 size={16} /> Surpreenda-me</button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nome</label><input value={inputs.name} onChange={e => setInputs({...inputs, name: e.target.value})} className="w-full bg-black border border-white/20 p-4 text-white focus:border-yellow-600 outline-none transition-colors" placeholder="Ex: Clara Monteiro" /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nicho</label><input value={inputs.niche} onChange={e => setInputs({...inputs, niche: e.target.value})} className="w-full bg-black border border-white/20 p-4 text-white focus:border-yellow-600 outline-none transition-colors" placeholder="Ex: Cloud Computing" /></div>
          </div>
          <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Detalhes Visuais</label><textarea value={inputs.details} onChange={e => setInputs({...inputs, details: e.target.value})} className="w-full bg-black border border-white/20 p-4 text-white focus:border-yellow-600 outline-none transition-colors h-32" placeholder="Descreva a aparência física..." /></div>
          <button onClick={handleGenerate} disabled={loading} className="w-full mt-8 bg-white text-black font-bold uppercase tracking-[0.2em] py-5 hover:bg-yellow-600 transition-colors disabled:opacity-50">{loading ? <span className="flex items-center justify-center gap-3"><Loader2 className="animate-spin" /> Produzindo Conteúdo...</span> : 'Gerar Perfil Completo'}</button>
          {logs.length > 0 && <div className="mt-8 bg-black p-4 rounded border border-white/10 font-mono text-xs text-green-500 max-h-40 overflow-y-auto">{logs.map((log, i) => <div key={i}>{log}</div>)}</div>}
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4">
          {muses.map(muse => (
             <div key={muse.id} className="flex items-center justify-between bg-gray-900 p-4 rounded border border-white/5 hover:border-yellow-600/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="relative">
                     <img src={muse.cover_url} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                     {muse.is_remote ? (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-[2px] border-2 border-black"><CheckCircle size={10} className="text-black" fill="currentColor" /></div>
                     ) : (
                        <div className="absolute -bottom-1 -right-1 bg-gray-500 rounded-full p-[2px] border-2 border-black"><HardDrive size={10} className="text-white" /></div>
                     )}
                  </div>
                  <div>
                    <h4 className="text-white font-bold flex items-center gap-2">
                       {muse.name}
                       {muse.is_remote ? (
                          <span className="text-[10px] bg-green-900/50 text-green-400 px-2 py-[2px] rounded border border-green-800 uppercase tracking-widest flex items-center gap-1"><Globe2 size={10} /> Processado</span>
                       ) : (
                          <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-[2px] rounded border border-gray-700 uppercase tracking-widest flex items-center gap-1"><HardDrive size={10} /> Pendente</span>
                       )}
                    </h4>
                    <p className="text-xs text-gray-500">{muse.niche}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => handleSaveClick(muse)} 
                     disabled={publishing === muse.id}
                     className={`flex items-center gap-2 px-3 py-2 border transition-colors text-xs font-bold uppercase tracking-wide rounded ${publishing === muse.id ? 'bg-yellow-600 border-yellow-600 text-black' : (muse.is_remote ? 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700' : 'bg-green-900/30 border-green-600 text-green-500 hover:bg-green-600 hover:text-white')}`}
                   >
                     {publishing === muse.id ? <Loader2 className="animate-spin" size={14}/> : <Send size={14} />} 
                     {publishing === muse.id ? 'Enviando...' : (muse.is_remote ? 'Reenviar' : 'Enviar para Workflow')}
                   </button>
                   <button onClick={() => handleDownloadSingle(muse)} className="flex items-center gap-2 px-3 py-2 bg-black border border-white/20 text-white hover:text-yellow-500 hover:border-yellow-500 transition-colors text-xs font-bold uppercase tracking-wide rounded"><FileJson size={14} /> JSON</button>
                   <button onClick={() => onDelete(muse.id)} className="text-gray-600 hover:text-red-500 p-2 transition-colors"><Trash2 size={18} /></button>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [muses, setMuses] = useState<MuseProfile[]>(INITIAL_MUSES);
  const [selectedProfile, setSelectedProfile] = useState<MuseProfile | null>(null);

  const loadLocalMuses = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  };

  const fetchMuses = async () => {
      // 1. Load Local (Instant)
      const local = loadLocalMuses();
      setMuses(local);

      // 2. Load Remote (Async, Read-Only)
      try {
        const { data, error } = await supabase.from('muses').select('*').order('created_at', { ascending: false });
        if (data) {
            // Data matches new interface directly
            const remote: MuseProfile[] = data.map((row: any) => ({
                id: row.id,
                slug: row.slug,
                name: row.name,
                niche: row.niche,
                tagline: row.tagline,
                physical_description: row.physical_description,
                is_remote: true, // Always true for supabase
                title: row.title,
                intro: row.intro,
                body: row.body,
                expert_verdict: row.expert_verdict,
                insider_secret: row.insider_secret,
                cover_url: row.cover_url,
                gallery_urls: row.gallery_urls || [],
                // Keywords/Faqs might be null if not in DB schema, handled optionally
            }));
            
            const remoteIds = new Set(remote.map((r) => r.id));
            const uniqueLocal = local.filter((l: MuseProfile) => !remoteIds.has(l.id));
            setMuses([...remote, ...uniqueLocal]);
        }
      } catch (e) {
         console.warn("Supabase read error", e);
      }
  };

  useEffect(() => {
    fetchMuses();
  }, []);

  const handleGenerate = async (newMuse: MuseProfile) => {
    // Save to local instantly
    const updated = [newMuse, ...muses];
    setMuses(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated.filter(m => !m.is_remote)));
  };

  const saveToN8N = async (muse: MuseProfile) => {
      // Esta função é chamada pelo Dashboard APÓS o sucesso do fetch.
      // Ela apenas atualiza o estado local para "is_remote = true"
      const updatedMuse = { ...muse, is_remote: true };
      
      const local = loadLocalMuses().filter((m: MuseProfile) => m.id !== muse.id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
      setMuses(prev => prev.map(m => m.id === muse.id ? updatedMuse : m));
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir este perfil (Local e Banco)?")) {
      try { await supabase.from('muses').delete().eq('id', id); } catch(e) {}
      
      const local = loadLocalMuses().filter((m: MuseProfile) => m.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
      setMuses(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleSelectProfile = (profile: MuseProfile) => { setSelectedProfile(profile); setView('PROFILE'); };
  const handleBack = () => { setSelectedProfile(null); setView('HOME'); };

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-yellow-600 selection:text-black">
       <Navigation onNavigate={setView} currentView={view} />
       {view === 'HOME' && (
         <>
           <Hero />
           <div id="profiles" className="bg-[#050505] py-24 px-6 md:px-12 border-t border-white/5">
              <div className="container mx-auto">
                 <div className="flex justify-between items-end mb-16">
                   <div><span className="text-yellow-600 font-bold tracking-widest text-xs uppercase mb-2 block">Nosso Casting</span><h2 className="font-serif text-4xl md:text-6xl text-white">Talentos em Destaque</h2></div>
                   <div className="hidden md:block w-1/3 h-[1px] bg-white/10"></div>
                 </div>
                 {muses.length === 0 ? <div className="grid grid-cols-1 md:grid-cols-3 gap-8"><MuseSkeleton /><MuseSkeleton /><MuseSkeleton /></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
                       {muses.map(muse => (
                         <div key={muse.id} onClick={() => handleSelectProfile(muse)} className="group cursor-pointer">
                            <div className="aspect-[3/4] overflow-hidden relative mb-6 border border-white/10 shadow-lg">
                               <OptimizedImage src={muse.cover_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={muse.name} />
                               <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-500"></div>
                               <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">{muse.niche}</div>
                            </div>
                            <h3 className="font-serif text-3xl text-white mb-2 group-hover:text-yellow-600 transition-colors">{muse.name}</h3>
                            <p className="text-gray-400 text-sm font-light tracking-wide line-clamp-2">{muse.tagline}</p>
                         </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
           <div id="niches" className="py-24 bg-black border-t border-white/5">
               <div className="container mx-auto px-6 text-center">
                   <h2 className="font-serif text-4xl text-white mb-12">Áreas de Atuação</h2>
                   <div className="flex flex-wrap justify-center gap-4">
                       {Array.from(new Set(muses.map(m => m.niche))).map(niche => (
                           <span key={niche} className="px-6 py-3 border border-white/20 rounded-full text-gray-300 hover:border-yellow-600 hover:text-yellow-600 transition-all cursor-default uppercase text-xs tracking-widest">{niche}</span>
                       ))}
                   </div>
               </div>
           </div>
         </>
       )}
       {view === 'PROFILE' && selectedProfile && <ProfilePage profile={selectedProfile} allMuses={muses} onSelectProfile={handleSelectProfile} onBack={handleBack} />}
       {view === 'DASHBOARD' && (
           <Dashboard 
              onGenerate={handleGenerate} 
              onDelete={handleDelete} 
              muses={muses} 
              onSaveToN8N={saveToN8N} 
           />
       )}
    </div>
  );
};

export default App;