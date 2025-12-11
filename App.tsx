import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Menu, 
  X, 
  ArrowRight, 
  Share2, 
  Instagram, 
  Maximize2,
  Lock,
  Globe,
  TrendingUp,
  DollarSign,
  Shield,
  Activity,
  ChevronDown,
  PlusCircle,
  Loader2,
  LayoutDashboard,
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
  Wand2,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  HelpCircle,
  Lightbulb,
  Github,
  FileJson,
  FolderOpen,
  Database,
  CloudUpload,
  Settings,
  AlertCircle,
  Globe2,
  HardDrive
} from 'lucide-react';
import { MuseProfile, ViewState, DashboardInputs } from './types';

// --- CONFIGURATION ---
// IMPORTANTE: Substitua pelo seu ID de Publicador do AdSense
const ADSENSE_PUB_ID = "ca-pub-0000000000000000"; 

// --- INITIAL DATA & STORAGE ---
const INITIAL_MUSES: MuseProfile[] = [];
const GITHUB_CONFIG_KEY = 'LUMIERE_GITHUB_CONFIG'; // GitHub Credentials
const DB_INDEX_FILENAME = 'db_index.json'; // The "Map" of the database
const DB_FOLDER = 'database'; // The folder where individual JSONs live

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

// --- HELPER: Safe Storage (For lightweight config only) ---
const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e: any) {
    console.error(`Erro ao salvar ${key} no LocalStorage:`, e);
  }
};

// --- INDEXED DB STORAGE (Fix for QuotaExceededError) ---
// IndexedDB allows storing large amounts of data (Blobs/Base64) without the 5MB limit of LocalStorage.
const IDB_CONFIG = { name: 'LUMIERE_DB', version: 1, store: 'muses' };

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_CONFIG.name, IDB_CONFIG.version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_CONFIG.store)) {
        db.createObjectStore(IDB_CONFIG.store, { keyPath: 'id' });
      }
    };
  });
};

const dbAPI = {
  save: async (muse: MuseProfile) => {
    try {
      const db = await openDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IDB_CONFIG.store, 'readwrite');
        const store = tx.objectStore(IDB_CONFIG.store);
        const request = store.put(muse);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) { console.error("IDB Save Error", e); throw e; }
  },
  getAll: async (): Promise<MuseProfile[]> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_CONFIG.store, 'readonly');
        const store = tx.objectStore(IDB_CONFIG.store);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) { 
      console.warn("IDB Load Error or Empty", e); 
      return []; 
    }
  },
  delete: async (id: string) => {
    try {
      const db = await openDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IDB_CONFIG.store, 'readwrite');
        const store = tx.objectStore(IDB_CONFIG.store);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) { console.error("IDB Delete Error", e); }
  }
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

// --- OPTIMIZED IMAGE COMPONENT ---
const OptimizedImage: React.FC<{ 
  src: string; 
  alt: string; 
  className?: string; 
  priority?: boolean;
}> = ({ src, alt, className, priority = false }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      // @ts-ignore
      fetchPriority={priority ? "high" : "auto"}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

// --- HERO SECTION (Home) ---
const Hero: React.FC = () => {
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
    document.title = `${profile.content.title} | Lumière Collective`;
    let metaDescription = document.querySelector("meta[name='description']");
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    const truncatedIntro = profile.content.intro.length > 160 ? profile.content.intro.substring(0, 157) + '...' : profile.content.intro;
    metaDescription.setAttribute('content', truncatedIntro);

    return () => {
      document.title = "LUMIÈRE - Exclusive Muse Collective";
    }
  }, [profile]);

  const relatedMuses = allMuses.filter(m => m.id !== profile.id).sort(() => 0.5 - Math.random()).slice(0, 3);

  return (
    <div className="bg-[#050505] min-h-screen animate-fade-in pb-32">
      <div className="fixed top-28 left-8 z-40 hidden md:block">
        <button onClick={onBack} className="bg-black/50 hover:bg-yellow-600 p-3 rounded-full text-white backdrop-blur-md transition-all border border-white/10 group flex items-center gap-2 pr-4 shadow-xl">
          <ArrowLeft size={18} /> <span className="text-xs font-bold uppercase tracking-widest hidden group-hover:inline">Voltar</span>
        </button>
      </div>

      <div className="relative h-[95vh] w-full overflow-hidden">
        <OptimizedImage src={profile.coverImage} className="w-full h-full object-cover object-center" alt={profile.name} priority={true} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-black/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent opacity-100"></div>
        <div className="absolute left-0 right-0 bottom-0 z-20 flex flex-col justify-end px-6 md:px-12 pb-20 md:pb-32 pointer-events-none max-h-[55vh]">
          <div className="container mx-auto max-w-7xl pointer-events-auto flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-6 md:mb-8 animate-fade-in-up">
               <span className="bg-yellow-600 text-black px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(202,138,4,0.3)]">{profile.niche}</span>
               <span className="text-gray-300 text-xs uppercase tracking-widest border-l border-gray-500 pl-4 drop-shadow-md">12 min de leitura</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-white mb-6 md:mb-8 leading-[1.1] max-w-5xl shadow-black drop-shadow-2xl tracking-tight animate-fade-in-up delay-100 line-clamp-4">{profile.content.title}</h1>
            <p className="text-lg md:text-2xl text-gray-100 italic max-w-3xl font-serif md:border-l-4 border-yellow-600 md:pl-8 leading-snug drop-shadow-lg animate-fade-in-up delay-200 line-clamp-3">"{profile.content.intro}"</p>
          </div>
        </div>
      </div>

      <div className="bg-[#050505] text-gray-200 py-12 md:py-24 px-6 md:px-12 relative z-30">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col gap-12">
            
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 first-letter:text-7xl first-letter:font-serif first-letter:text-yellow-600 first-letter:float-left first-letter:mr-4 first-letter:mt-[-8px] mb-12 font-light tracking-wide">{profile.content.bodyParagraphs[0]}</p>
              <SmartAdUnit slotId="1624191321" format="auto" className="w-full max-w-4xl mx-auto" />
              <div className="my-16 relative group overflow-hidden shadow-2xl border border-white/5">
                <OptimizedImage src={profile.images[0]} className="w-full h-[400px] md:h-[800px] object-cover transition-transform duration-1000 group-hover:scale-105" alt="Editorial 1" />
              </div>
              <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-12 tracking-wide font-light">{profile.content.bodyParagraphs[1]}</p>
              <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-16 tracking-wide font-light">{profile.content.bodyParagraphs[2]}</p>
              
              <div className="my-20 p-6 md:p-10 bg-gradient-to-r from-yellow-900/20 to-black border border-yellow-600/30 rounded-lg relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><Lightbulb size={120} className="text-yellow-600" /></div>
                 <h4 className="text-yellow-500 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2"><Lock size={14} /> Segredo de Mercado</h4>
                 <h3 className="font-serif text-2xl text-white mb-6">A Estratégia Oculta</h3>
                 <p className="text-lg text-gray-100 leading-relaxed relative z-10 font-medium">{profile.content.insiderSecret}</p>
                 <div className="mt-8 flex gap-3 flex-wrap">{profile.content.keywords.slice(0,3).map(kw => (<span key={kw} className="text-xs bg-yellow-600/10 text-yellow-500 px-3 py-1 rounded border border-yellow-600/20">{kw}</span>))}</div>
              </div>

              <SmartAdUnit slotId="6844728415" format="fluid" className="w-full" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-20">
                 <div className="h-[400px] md:h-[500px] md:mt-12 shadow-lg border border-white/5">
                    <OptimizedImage src={profile.images[1]} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt="Detail 1" />
                 </div>
                 <div className="h-[400px] md:h-[500px] shadow-lg border border-white/5">
                    <OptimizedImage src={profile.images[2]} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt="Detail 2" />
                 </div>
              </div>

              <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-12 tracking-wide font-light">{profile.content.bodyParagraphs[3]}</p>
              <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-12 tracking-wide font-light">{profile.content.bodyParagraphs[4]}</p>
              
              <SmartAdUnit slotId="1006896613" format="auto" className="w-full max-w-[336px] mx-auto" />

              <div className="my-24 border-l-4 border-white pl-8 md:pl-12 py-4">
                 <h3 className="font-serif text-3xl text-white mb-6">O Veredito da Lumière</h3>
                 <p className="text-xl text-gray-200 italic font-serif leading-relaxed">"{profile.content.expertVerdict}"</p>
                 <div className="mt-6 flex items-center gap-4">
                    <OptimizedImage src={profile.coverImage} className="w-12 h-12 rounded-full object-cover border border-white/20" alt="Author" />
                    <div><p className="text-sm text-white font-bold uppercase">{profile.name}</p><p className="text-xs text-gray-500">{profile.niche} Specialist</p></div>
                 </div>
              </div>
              <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-20 tracking-wide font-light">{profile.content.bodyParagraphs[5]}</p>
              {profile.content.faqs && profile.content.faqs.length > 0 && (
                <div className="my-24 bg-gray-900/30 p-8 md:p-12 rounded-xl border border-white/5">
                   <h3 className="font-serif text-3xl text-white mb-8 flex items-center gap-3"><HelpCircle className="text-yellow-600" /> Perguntas Frequentes</h3>
                   <div className="space-y-2">{profile.content.faqs.map((faq, idx) => (<FAQItem key={idx} question={faq.question} answer={faq.answer} />))}</div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-24 mt-12">
            <h3 className="font-serif text-4xl md:text-5xl text-white text-center mb-16">Galeria Exclusiva</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[250px] md:auto-rows-[300px]">
              {profile.images.slice(3, 8).map((img, i) => (
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
                    <span className="relative">
                      VER TUDO
                      <span className="absolute left-0 bottom-[-2px] w-0 h-[1px] bg-yellow-600 transition-all duration-300 group-hover/btn:w-full"></span>
                    </span>
                    <span className="bg-white/10 p-2 rounded-full group-hover/btn:bg-yellow-600 group-hover/btn:text-black transition-all transform group-hover/btn:translate-x-1">
                      <ArrowRight size={14} />
                    </span>
                 </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                 {relatedMuses.map((related) => (
                   <div key={related.id} onClick={() => onSelectProfile(related)} className="group cursor-pointer flex flex-col transition-transform duration-500 hover:scale-[1.02]">
                     <div className="aspect-[3/4] mb-6 overflow-hidden relative border border-white/10 rounded-sm transition-all duration-500 group-hover:border-yellow-600/50 group-hover:shadow-[0_0_30px_rgba(202,138,4,0.3)]">
                        <OptimizedImage src={related.coverImage} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" alt={related.name} />
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
const Dashboard: React.FC<{ onGenerate: (data: MuseProfile) => Promise<void>; onDelete: (id: string) => Promise<void>; onExport: () => void; onImport: (e: React.ChangeEvent<HTMLInputElement>) => void; muses: MuseProfile[]; }> = ({ onGenerate, onDelete, onExport, onImport, muses }) => {
  const [inputs, setInputs] = useState<DashboardInputs>({ niche: '', name: '', details: '' });
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [ghConfig, setGhConfig] = useState<{owner: string, repo: string, token: string, branch: string}>({
    owner: '', repo: '', token: '', branch: 'main'
  });
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(GITHUB_CONFIG_KEY);
    if (saved) setGhConfig(JSON.parse(saved));
  }, []);

  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

  const saveGhConfig = () => {
    saveToLocalStorage(GITHUB_CONFIG_KEY, ghConfig);
    setShowConfig(false);
    alert("Configuração do GitHub salva!");
  };

  // --- GITHUB API HELPER ---
  const publishToGitHub = async (muse: MuseProfile) => {
    if (!ghConfig.token || !ghConfig.owner || !ghConfig.repo) {
       alert("Configure o GitHub primeiro!");
       setShowConfig(true);
       return;
    }

    setPublishing(muse.id);
    addLog(`Iniciando publicação automática no GitHub: ${ghConfig.repo}...`);

    try {
       const headers = {
         'Authorization': `token ${ghConfig.token}`,
         'Content-Type': 'application/json',
       };
       const baseUrl = `https://api.github.com/repos/${ghConfig.owner}/${ghConfig.repo}/contents`;

       const modelContent = btoa(unescape(encodeURIComponent(JSON.stringify(muse, null, 2))));
       const modelPath = `${DB_FOLDER}/${muse.id}.json`;
       
       addLog(`Enviando arquivo: ${modelPath}...`);
       
       let sha = undefined;
       try {
          const checkRes = await fetch(`${baseUrl}/${modelPath}`, { headers });
          if (checkRes.ok) {
             const data = await checkRes.json();
             sha = data.sha;
          }
       } catch (e) {}

       const modelRes = await fetch(`${baseUrl}/${modelPath}`, {
         method: 'PUT',
         headers,
         body: JSON.stringify({
           message: `Add Model: ${muse.name}`,
           content: modelContent,
           branch: ghConfig.branch,
           sha: sha
         })
       });

       if (!modelRes.ok) throw new Error(`Erro ao subir modelo: ${modelRes.status}`);

       addLog("Atualizando índice (db_index.json)...");
       const indexRes = await fetch(`${baseUrl}/${DB_INDEX_FILENAME}`, { headers });
       let indexSha = undefined;
       let currentIndex: string[] = [];

       if (indexRes.ok) {
          const indexData = await indexRes.json();
          indexSha = indexData.sha;
          try {
             const decodedContent = decodeURIComponent(escape(atob(indexData.content)));
             currentIndex = JSON.parse(decodedContent);
          } catch (e) { console.error("Index parse error", e); }
       }

       if (!currentIndex.includes(muse.id)) {
          currentIndex.push(muse.id);
       }

       const newIndexContent = btoa(unescape(encodeURIComponent(JSON.stringify(currentIndex, null, 2))));

       const updateIndexRes = await fetch(`${baseUrl}/${DB_INDEX_FILENAME}`, {
         method: 'PUT',
         headers,
         body: JSON.stringify({
           message: `Update Index for ${muse.name}`,
           content: newIndexContent,
           branch: ghConfig.branch,
           sha: indexSha
         })
       });

       if (!updateIndexRes.ok) throw new Error("Erro ao atualizar índice.");

       // Atualiza estado local para refletir que foi publicado
       await dbAPI.save({...muse, isRemote: true});
       
       // Força reload da página ou do estado para atualizar badge
       window.location.reload(); 

       addLog("SUCESSO! Publicado no GitHub.");
       alert(`Sucesso! ${muse.name} foi publicada no GitHub.`);

    } catch (err: any) {
       console.error(err);
       addLog(`ERRO DE PUBLICAÇÃO: ${err.message}`);
       alert("Erro ao publicar. Verifique o Token e o console.");
    } finally {
       setPublishing(null);
    }
  };

  const generateRandomPersona = async () => {
    setLoading(true);
    addLog("Ativando Gerador Genético de Diversidade...");
    const ethnicities = ["Scandinavian", "Afro-Caribbean", "Japanese", "Brazilian Mixed", "Indian", "Mediterranean", "Eastern European", "Middle Eastern"];
    const hairStyles = ["Platinum Blonde Bob", "Long Jet Black waves", "Redhead copper curls", "Honey Brown straight", "Silver/Grey sleek", "Natural Afro", "Braided elaborate", "Pink-tinted balayage"];
    const distinctFeatures = ["freckles", "distinct mole", "heterochromia eyes", "sharp jawline", "dimples", "bushy eyebrows", "piercing blue eyes"];
    const randomEthnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)];
    const randomHair = hairStyles[Math.floor(Math.random() * hairStyles.length)];
    const randomFeature = distinctFeatures[Math.floor(Math.random() * distinctFeatures.length)];
    const physicalPrompt = `Beautiful Woman of ${randomEthnicity} descent, featuring ${randomHair} and ${randomFeature}. Luxury high-fashion model look, fit physique, elegant posture.`;

    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const prompt = `Generate a JSON profile for a High-End Luxury Consultant or Model. 
      The Name must be culturally appropriate for: ${randomEthnicity}.
      The Niche must be a High CPM topic.
      Output JSON ONLY: {"name": "Elegant Name", "niche": "High Ticket Niche", "details": "${physicalPrompt}"}`;
      
      const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json" } });
      const data = cleanAndParseJSON(result.text || "{}");
      setInputs({ name: data.name, niche: data.niche, details: physicalPrompt });
      addLog(`Persona: ${data.name} - ${data.niche}`);
    } catch (error) { 
      console.error(error); 
      setInputs({ name: "Sofia", niche: "Luxury", details: physicalPrompt }); 
      addLog("IA ocupada, usando dados padrão.");
    } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!inputs.niche || !inputs.name || !inputs.details) { addLog("Erro: Preencha todos os campos."); return; }
    setLoading(true); setLogs([]); addLog("Iniciando processo de criação High-Ticket...");

    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      addLog("Escrevendo artigo de 6 parágrafos + FAQ...");
      
      const textPrompt = `You are the Editor-in-Chief of a high-end luxury lifestyle & business magazine.
      Create a JSON profile for "${inputs.name}", an elite consultant in "${inputs.niche}".
      Language: PT-BR (Portuguese).
      FORMAT: PLAIN JSON ONLY. NO Markdown.
      Schema:
      {
        "tagline": "Elegant & catchy one-liner",
        "title": "A sophisticated, high-CTR headline about ${inputs.niche}",
        "intro": "A captivating introduction blending her beauty with her intellect",
        "bodyParagraphs": [
           "Para 1: Deep dive into the market trends of ${inputs.niche} (Technical)",
           "Para 2: Her personal approach/strategy (Business)",
           "Para 3: A luxury lifestyle anecdote related to her work (Travel/Dining)",
           "Para 4: Specific advice for high-net-worth individuals",
           "Para 5: Future outlook of the industry",
           "Para 6: A memorable, elegant conclusion"
        ],
        "keywords": ["5 very high CPM keywords for AdSense"],
        "expertVerdict": "A quote from Lumière validating her expertise",
        "faqs": [{"question": "Technical Question 1?", "answer": "Detailed Answer"}, {"question": "Technical Question 2?", "answer": "Detailed Answer"}],
        "insiderSecret": "A very specific, valuable insider tip about ${inputs.niche}"
      }`;

      const textResult = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: textPrompt, config: { responseMimeType: "application/json" } });
      const content = cleanAndParseJSON(textResult.text || "{}");

      addLog("Fotografando capa (Lumière Aesthetic)...");
      const basePrompt = `Portrait of a woman (${inputs.details}). 
      Style: High-fashion editorial, shot on Kodak Portra 400, 35mm film grain, flash photography, direct flash, high contrast, glamorous, chic, cinematic lighting. 
      Vibe: 'Old Money' meets 'Femme Fatale', elegant but provocative (Safe for Work).
      Feature: Sharp focus on eyes, skin texture, pores visible. NOT illustration.`;
      
      const coverResult = await ai.models.generateContent({ model: "gemini-2.5-flash-image", contents: basePrompt });
      const extractImage = (res: any) => res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
      const coverBase64 = extractImage(coverResult);
      if (!coverBase64) throw new Error("Falha na capa");
      const coverImage = `data:image/png;base64,${coverBase64}`;

      // --- THROTTLE (DELAY) 1 ---
      addLog("Aguardando 12 segundos (Rate Limit Protection)...");
      await delay(12000);

      addLog("Produzindo editorial variado (5 fotos)...");
      const galleryImages = [coverImage];
      const allScenarios = [
          "Sitting in a dark mahogany office, wearing a silk blouse",
          "Backseat of a Rolls Royce at night, wearing a fur coat (faux)",
          "Walking down a marble staircase in an evening gown, motion blur",
          "Lounging on a velvet sofa in a penthouse, slip dress",
          "Close up portrait applying red lipstick, backstage vibe",
          "Standing on a windy balcony overlooking the ocean, linen suit",
          "Dining at a Michelin star restaurant, candlelight",
          "Getting out of a private jet, sunglasses"
      ];
      const selectedScenarios = allScenarios.sort(() => 0.5 - Math.random()).slice(0, 5);

      for (const scenario of selectedScenarios) {
        addLog(`Capturando: ${scenario}...`);
        
        let retries = 0;
        let success = false;
        
        while (!success && retries < 2) {
            try {
              const galleryPrompt = `Photo of the SAME woman (${inputs.details}). 
              Scene: ${scenario}. 
              Style: High-fashion editorial, shot on Kodak Portra 400, 35mm film grain, flash photography. 
              Quality: Photorealistic, 8k, raw file.`;
              
              const res = await ai.models.generateContent({ model: "gemini-2.5-flash-image", contents: galleryPrompt });
              const imgBase64 = extractImage(res);
              if (imgBase64) galleryImages.push(`data:image/png;base64,${imgBase64}`);
              
              success = true;
              
              // --- THROTTLE (DELAY) 2 ---
              await delay(12000);

            } catch (imgError: any) {
               if (imgError.message?.includes("429") || imgError.message?.includes("RESOURCE_EXHAUSTED") || imgError.message?.includes("Quota")) {
                 addLog(`Cota excedida. Pausando 25s antes de tentar novamente (Tentativa ${retries+1}/2)...`);
                 await delay(25000);
                 retries++;
               } else {
                 console.warn("Skipping image due to non-quota error:", imgError);
                 break; // Sai do loop de retry se não for erro de cota
               }
            }
        }
      }
      
      // Pad with cover if needed
      while(galleryImages.length < 8) galleryImages.push(coverImage);

      const newMuse: MuseProfile = {
        id: Date.now().toString(),
        name: inputs.name,
        niche: inputs.niche,
        tagline: content.tagline,
        coverImage: coverImage,
        images: galleryImages,
        physicalDescription: inputs.details,
        content: { title: content.title, intro: content.intro, bodyParagraphs: content.bodyParagraphs, keywords: content.keywords, expertVerdict: content.expertVerdict, faqs: content.faqs, insiderSecret: content.insiderSecret },
        isRemote: false
      };

      await onGenerate(newMuse);
      addLog("SUCESSO! Perfil High-Ticket criado e salvo no Banco de Dados.");
      setInputs({ niche: '', name: '', details: '' });
    } catch (err) { console.error(err); addLog(`ERRO FATAL: ${(err as Error).message}`); } finally { setLoading(false); }
  };
  
  const handleDownloadSingle = (muse: MuseProfile) => {
    const blob = new Blob([JSON.stringify(muse, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; 
    a.download = `${muse.id}.json`; 
    a.click();
  };

  const handleDownloadIndex = () => {
    const ids = muses.map(m => m.id);
    const blob = new Blob([JSON.stringify(ids, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = DB_INDEX_FILENAME;
    a.click();
  };

  return (
    <div className="bg-[#111] min-h-screen pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-4xl text-white font-serif mb-8 flex items-center gap-4"><LayoutDashboard className="text-yellow-600" /> Painel de Criação</h2>
        
        {/* SETTINGS BOX */}
        <div className="bg-gray-900 border border-white/10 p-6 rounded-lg mb-8">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2"><Settings size={16} /> Configuração de Publicação Automática (CMS)</h3>
              <button onClick={() => setShowConfig(!showConfig)} className="text-yellow-600 text-xs hover:underline">{showConfig ? 'Fechar Configurações' : 'Editar Configurações'}</button>
           </div>
           
           {showConfig && (
             <div className="bg-black/50 p-6 rounded border border-white/10 animate-fade-in">
                <p className="text-gray-400 text-xs mb-4">Para publicar diretamente no seu site hospedado, preencha os dados do GitHub abaixo. O token precisa de permissão 'repo' completa.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                   <input placeholder="Usuário GitHub (ex: seu-nome)" value={ghConfig.owner} onChange={e => setGhConfig({...ghConfig, owner: e.target.value})} className="bg-black border border-white/20 p-3 text-white text-sm" />
                   <input placeholder="Nome do Repositório (ex: lumiere-app)" value={ghConfig.repo} onChange={e => setGhConfig({...ghConfig, repo: e.target.value})} className="bg-black border border-white/20 p-3 text-white text-sm" />
                   <input placeholder="Personal Access Token (ghp_...)" value={ghConfig.token} onChange={e => setGhConfig({...ghConfig, token: e.target.value})} className="bg-black border border-white/20 p-3 text-white text-sm md:col-span-2" type="password" />
                </div>
                <button onClick={saveGhConfig} className="bg-yellow-600 text-black px-4 py-2 font-bold text-sm rounded hover:bg-yellow-500">Salvar Conexão</button>
             </div>
           )}

           {!ghConfig.token && !showConfig && (
              <div className="flex items-center gap-2 text-yellow-600 text-xs bg-yellow-900/10 p-2 rounded">
                <AlertCircle size={14} />
                <span>Configure o GitHub acima para publicar automaticamente sem baixar arquivos.</span>
              </div>
           )}
        </div>

        <div className="bg-gray-900 p-6 rounded-lg border border-white/10 mb-12 flex flex-wrap gap-4 items-center justify-between">
           <div><h3 className="text-white font-bold uppercase tracking-widest text-sm mb-1">Gerenciamento de Dados</h3><p className="text-gray-500 text-xs">Total: {muses.length} modelos</p></div>
           <div className="flex gap-4">
              <button onClick={handleDownloadIndex} className="flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-yellow-500 transition-colors text-sm font-bold uppercase tracking-wide rounded-sm shadow-lg"><Database size={18} /> Baixar Índice Manual</button>
           </div>
        </div>

        <div className="bg-gray-900/50 p-8 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden">
           <button onClick={generateRandomPersona} disabled={loading} className="absolute top-8 right-8 text-yellow-600 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors z-10"><Wand2 size={16} /> Surpreenda-me</button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nome da Musa</label><input value={inputs.name} onChange={e => setInputs({...inputs, name: e.target.value})} className="w-full bg-black border border-white/20 p-4 text-white focus:border-yellow-600 outline-none transition-colors" placeholder="Ex: Clara Monteiro" /></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nicho (High CPM)</label><input value={inputs.niche} onChange={e => setInputs({...inputs, niche: e.target.value})} className="w-full bg-black border border-white/20 p-4 text-white focus:border-yellow-600 outline-none transition-colors" placeholder="Ex: Cloud Computing" /></div>
          </div>
          <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Detalhes Visuais (DNA)</label><textarea value={inputs.details} onChange={e => setInputs({...inputs, details: e.target.value})} className="w-full bg-black border border-white/20 p-4 text-white focus:border-yellow-600 outline-none transition-colors h-32" placeholder="Descreva a aparência física..." /></div>
          <button onClick={handleGenerate} disabled={loading} className="w-full mt-8 bg-white text-black font-bold uppercase tracking-[0.2em] py-5 hover:bg-yellow-600 transition-colors disabled:opacity-50">{loading ? <span className="flex items-center justify-center gap-3"><Loader2 className="animate-spin" /> Produzindo Conteúdo...</span> : 'Gerar Perfil Completo'}</button>
          {logs.length > 0 && <div className="mt-8 bg-black p-4 rounded border border-white/10 font-mono text-xs text-green-500 max-h-40 overflow-y-auto">{logs.map((log, i) => <div key={i}>{log}</div>)}</div>}
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4">
          {muses.map(muse => (
             <div key={muse.id} className="flex items-center justify-between bg-gray-900 p-4 rounded border border-white/5 hover:border-yellow-600/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="relative">
                     <img src={muse.coverImage} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                     {muse.isRemote && <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-[2px] border-2 border-black"><CheckCircle size={10} className="text-black" fill="currentColor" /></div>}
                  </div>
                  <div>
                    <h4 className="text-white font-bold flex items-center gap-2">
                       {muse.name}
                       {muse.isRemote ? (
                          <span className="text-[10px] bg-green-900/50 text-green-400 px-2 py-[2px] rounded border border-green-800 uppercase tracking-widest flex items-center gap-1"><Globe2 size={10} /> Publicado</span>
                       ) : (
                          <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-[2px] rounded border border-gray-700 uppercase tracking-widest flex items-center gap-1"><HardDrive size={10} /> Rascunho</span>
                       )}
                    </h4>
                    <p className="text-xs text-gray-500">{muse.niche} <span className="text-gray-700 mx-2">|</span> ID: {muse.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   {/* ACTION BUTTONS */}
                   {ghConfig.token ? (
                      <button 
                        onClick={() => publishToGitHub(muse)} 
                        disabled={publishing === muse.id}
                        className={`flex items-center gap-2 px-3 py-2 border transition-colors text-xs font-bold uppercase tracking-wide rounded ${publishing === muse.id ? 'bg-yellow-600 border-yellow-600 text-black' : (muse.isRemote ? 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700' : 'bg-green-900/30 border-green-600 text-green-500 hover:bg-green-600 hover:text-white')}`}
                      >
                        {publishing === muse.id ? <Loader2 className="animate-spin" size={14}/> : <CloudUpload size={14} />} 
                        {publishing === muse.id ? 'Enviando...' : (muse.isRemote ? 'Re-publicar' : 'Publicar')}
                      </button>
                   ) : (
                      <button onClick={() => handleDownloadSingle(muse)} className="flex items-center gap-2 px-3 py-2 bg-black border border-white/20 text-white hover:text-yellow-500 hover:border-yellow-500 transition-colors text-xs font-bold uppercase tracking-wide rounded"><FileJson size={14} /> JSON</button>
                   )}
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

  useEffect(() => {
    const loadMuses = async () => {
      const stored = await dbAPI.getAll();
      setMuses(stored.sort((a, b) => Number(b.id) - Number(a.id)));
    };
    loadMuses();
  }, []);

  const handleGenerate = async (newMuse: MuseProfile) => {
    await dbAPI.save(newMuse);
    setMuses(prev => [newMuse, ...prev]);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este perfil?")) {
      await dbAPI.delete(id);
      setMuses(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleSelectProfile = (profile: MuseProfile) => {
    setSelectedProfile(profile);
    setView('PROFILE');
  };

  const handleBack = () => {
    setSelectedProfile(null);
    setView('HOME');
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-yellow-600 selection:text-black">
       <Navigation onNavigate={setView} currentView={view} />
       
       {view === 'HOME' && (
         <>
           <Hero />
           <div id="profiles" className="bg-[#050505] py-24 px-6 md:px-12 border-t border-white/5">
              <div className="container mx-auto">
                 <div className="flex justify-between items-end mb-16">
                   <div>
                     <span className="text-yellow-600 font-bold tracking-widest text-xs uppercase mb-2 block">Nosso Casting</span>
                     <h2 className="font-serif text-4xl md:text-6xl text-white">Talentos em Destaque</h2>
                   </div>
                   <div className="hidden md:block w-1/3 h-[1px] bg-white/10"></div>
                 </div>
                 
                 {muses.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <MuseSkeleton /><MuseSkeleton /><MuseSkeleton />
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
                       {muses.map(muse => (
                         <div key={muse.id} onClick={() => handleSelectProfile(muse)} className="group cursor-pointer">
                            <div className="aspect-[3/4] overflow-hidden relative mb-6 border border-white/10 shadow-lg">
                               <OptimizedImage src={muse.coverImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={muse.name} />
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

       {view === 'PROFILE' && selectedProfile && (
         <ProfilePage profile={selectedProfile} allMuses={muses} onSelectProfile={handleSelectProfile} onBack={handleBack} />
       )}

       {view === 'DASHBOARD' && (
         <Dashboard 
            onGenerate={handleGenerate} 
            onDelete={handleDelete} 
            muses={muses} 
            onExport={() => {}} 
            onImport={(e) => {}} 
         />
       )}
    </div>
  );
};

export default App;