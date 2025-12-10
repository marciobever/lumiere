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
  Lightbulb
} from 'lucide-react';
import { MuseProfile, ViewState, DashboardInputs } from './types';

// --- INITIAL DATA & STORAGE ---
const INITIAL_MUSES: MuseProfile[] = [];
const STORAGE_KEY = 'LUMIERE_MUSES_DB_V3'; // Versioned key

// --- HELPER: Safe Storage ---
const saveToStorage = (muses: MuseProfile[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(muses));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError') {
      alert("⚠️ Limite de armazenamento do navegador atingido! Por favor, exporte seus dados (Baixar JSON) e limpe alguns perfis antigos para continuar gerando.");
    } else {
      console.error("Erro ao salvar no LocalStorage:", e);
    }
  }
};

// --- OPTIMIZED IMAGE COMPONENT (Mobile Performance) ---
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
      // "eager" loads immediately (for Hero), "lazy" waits for scroll (for content)
      loading={priority ? "eager" : "lazy"}
      // "async" decoding prevents UI freeze on mobile during heavy image processing
      decoding="async"
      // Prioritize the Hero image for LCP (Largest Contentful Paint)
      // @ts-ignore - React HTML attributes type definition might miss fetchPriority in some versions
      fetchPriority={priority ? "high" : "auto"}
      // Helps browser allocate layout space
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
const SmartAdUnit: React.FC<{ format: 'billboard' | 'rectangle' | 'vertical' | 'fluid' }> = ({ format }) => {
  const [isVisible, setIsVisible] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (adRef.current) observer.observe(adRef.current);
    return () => observer.disconnect();
  }, []);

  const dimensions = {
    billboard: "w-full max-w-4xl h-[250px]",
    rectangle: "w-full max-w-[336px] h-[280px]",
    vertical: "w-full h-[600px]",
    fluid: "w-full h-[150px]"
  };

  return (
    <div ref={adRef} className={`bg-gray-900/30 flex items-center justify-center border border-white/5 my-12 mx-auto ${dimensions[format]} relative overflow-hidden group`}>
      {isVisible ? (
        <div className="text-center animate-pulse p-4 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
          <span className="text-[10px] text-gray-600 uppercase tracking-widest block mb-1">Publicidade Premium</span>
          <div className="w-12 h-1 bg-yellow-600/20 mb-2"></div>
          <span className="text-yellow-600/30 text-[9px] uppercase font-bold">Espaço Disponível</span>
        </div>
      ) : (
        <div className="w-full h-full bg-transparent" />
      )}
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
      {/* GLASS CEILING FIX: max-h-[55vh] bottom-0 */}
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
  
  // SEO Optimization: Update Title and Meta Description
  useEffect(() => { 
    window.scrollTo(0, 0); 
    
    // Update Title
    document.title = `${profile.content.title} | Lumière Collective`;
    
    // Update Meta Description
    let metaDescription = document.querySelector("meta[name='description']");
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    // Truncate intro for meta description standard (approx 160 chars)
    const truncatedIntro = profile.content.intro.length > 160 ? profile.content.intro.substring(0, 157) + '...' : profile.content.intro;
    metaDescription.setAttribute('content', truncatedIntro);

    return () => {
      // Cleanup/Reset on unmount if needed, or set to default
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
        {/* Optimized Hero Image (Priority Load) */}
        <OptimizedImage src={profile.coverImage} className="w-full h-full object-cover object-center" alt={profile.name} priority={true} />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-black/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent opacity-100"></div>
        {/* GLASS CEILING FIX: max-h-[55vh] bottom-0 */}
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
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-32">
            <div className="lg:col-span-3 hidden lg:block">
              <div className="sticky top-32 space-y-12">
                <div className="border-t border-b border-white/10 py-8">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Perfil da Musa</p>
                  <h3 className="font-serif text-3xl text-white mb-3">{profile.name}</h3>
                  <p className="text-sm text-gray-400 italic mb-6 leading-relaxed">{profile.tagline}</p>
                  <div className="flex gap-6"><Instagram size={20} className="text-gray-500 hover:text-yellow-600 cursor-pointer transition-colors" /><Share2 size={20} className="text-gray-500 hover:text-yellow-600 cursor-pointer transition-colors" /></div>
                </div>
                <SmartAdUnit format="vertical" />
              </div>
            </div>
            <div className="lg:col-span-8 lg:col-start-5">
              <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 first-letter:text-7xl first-letter:font-serif first-letter:text-yellow-600 first-letter:float-left first-letter:mr-4 first-letter:mt-[-8px] mb-12 font-light tracking-wide">{profile.content.bodyParagraphs[0]}</p>
              
              {/* Body Image 1 (Lazy) */}
              <div className="my-16 relative group overflow-hidden shadow-2xl border border-white/5">
                <OptimizedImage src={profile.images[0]} className="w-full h-[400px] md:h-[800px] object-cover transition-transform duration-1000 group-hover:scale-105" alt="Editorial 1" />
              </div>

              <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-12 tracking-wide font-light">{profile.content.bodyParagraphs[1]}</p>
              <div className="my-16"><SmartAdUnit format="billboard" /></div>
              <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-16 tracking-wide font-light">{profile.content.bodyParagraphs[2]}</p>
              <div className="my-20 p-6 md:p-10 bg-gradient-to-r from-yellow-900/20 to-black border border-yellow-600/30 rounded-lg relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><Lightbulb size={120} className="text-yellow-600" /></div>
                 <h4 className="text-yellow-500 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2"><Lock size={14} /> Segredo de Mercado</h4>
                 <h3 className="font-serif text-2xl text-white mb-6">A Estratégia Oculta</h3>
                 <p className="text-lg text-gray-100 leading-relaxed relative z-10 font-medium">{profile.content.insiderSecret}</p>
                 <div className="mt-8 flex gap-3 flex-wrap">{profile.content.keywords.slice(0,3).map(kw => (<span key={kw} className="text-xs bg-yellow-600/10 text-yellow-500 px-3 py-1 rounded border border-yellow-600/20">{kw}</span>))}</div>
              </div>

              {/* Grid Images (Lazy) */}
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
              <div className="my-16"><SmartAdUnit format="fluid" /></div>
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
const Dashboard: React.FC<{ onGenerate: (data: MuseProfile) => void; onDelete: (id: string) => void; onExport: () => void; onImport: (e: React.ChangeEvent<HTMLInputElement>) => void; muses: MuseProfile[]; }> = ({ onGenerate, onDelete, onExport, onImport, muses }) => {
  const [inputs, setInputs] = useState<DashboardInputs>({ niche: '', name: '', details: '' });
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

  const generateRandomPersona = async () => {
    setLoading(true);
    addLog("Ativando Gerador Genético de Diversidade...");
    const ethnicities = ["Scandinavian (pale skin, high cheekbones)", "Afro-Caribbean (dark skin, full lips)", "Japanese (porcelain skin, sleek hair)", "Brazilian Mixed (olive skin, curly hair)", "Indian (golden skin, sharp features)", "Mediterranean (tan skin, dark eyes)", "Eastern European (fair skin, light eyes)", "Middle Eastern (olive skin, expressive eyes)"];
    const hairStyles = ["Platinum Blonde Bob cut", "Long Jet Black waves waist length", "Redhead copper hair loose curls", "Honey Brown highlights straight hair", "Silver/Grey fashion hair sleek", "Natural Afro hair", "Braided hair elaborate style", "Pink-tinted balayage hair"];
    const distinctFeatures = ["freckles on nose", "distinct mole on cheek", "heterochromia eyes", "gap between front teeth", "very sharp jawline", "dimples when smiling", "bushy natural eyebrows", "piercing blue eyes"];
    const randomEthnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)];
    const randomHair = hairStyles[Math.floor(Math.random() * hairStyles.length)];
    const randomFeature = distinctFeatures[Math.floor(Math.random() * distinctFeatures.length)];
    const physicalPrompt = `Woman of ${randomEthnicity} descent, featuring ${randomHair} and ${randomFeature}. Luxury fashion model look.`;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `Gere um perfil JSON para uma modelo 'Femme Fatale' de luxo para um site de alto CPM. O nicho deve ser EXTREMAMENTE valioso e específico (Ex: Mesotelioma, Empréstimos Estudantis, Cloud Computing, Forex Trading). NÃO GERE A DESCRIÇÃO FÍSICA. USE ESTA: "${physicalPrompt}". Retorne APENAS um JSON: {"name": "Nome Elegante", "niche": "Nicho High Ticket", "details": "${physicalPrompt}"}`;
      const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json" } });
      const data = JSON.parse(result.text || "{}");
      setInputs({ name: data.name, niche: data.niche, details: physicalPrompt });
      addLog(`DNA: ${randomEthnicity} + ${randomHair}`);
      addLog(`Persona: ${data.name} - ${data.niche}`);
    } catch (error) { console.error(error); addLog("Erro ao gerar persona."); setInputs({ name: "Sofia", niche: "Finance", details: physicalPrompt }); } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!inputs.niche || !inputs.name || !inputs.details) { addLog("Erro: Preencha todos os campos."); return; }
    setLoading(true); setLogs([]); addLog("Iniciando processo de criação High-Ticket...");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      addLog("Escrevendo artigo de 6 parágrafos + FAQ...");
      // UPDATED PROMPT: Explicitly forbid Markdown and Asterisks
      const textPrompt = `Crie um perfil editorial para "${inputs.name}" especialista em "${inputs.niche}". Idioma: PT-BR. Conteúdo denso, High CTR. Texto PURO (Plain Text), SEM Markdown, SEM asteriscos (**), SEM formatação. JSON: {"tagline": "Frase", "title": "Título Clickbait", "intro": "Intro", "bodyParagraphs": ["Técnico", "Lifestyle", "Estratégia", "Análise", "Nuance", "Conclusão"], "keywords": ["5 keywords"], "expertVerdict": "Resumo autoridade", "faqs": [{"question": "Q?", "answer": "A"}], "insiderSecret": "Dica oculta"}`;
      const textResult = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: textPrompt, config: { responseMimeType: "application/json" } });
      const content = JSON.parse(textResult.text || "{}");

      addLog("Fotografando capa (Raw Candid)...");
      const basePrompt = `Portrait of a woman (${inputs.details}). Photorealistic, 8k, shot on Fujifilm Pro 400H, 85mm lens, f/1.8. Raw candid photograph, micro-expressions, real skin texture with faint freckles/pores, natural lighting, cinematic lens flare. NOT illustration, NOT drawing.`;
      const coverResult = await ai.models.generateContent({ model: "gemini-2.5-flash-image", contents: basePrompt });
      const extractImage = (res: any) => res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
      const coverBase64 = extractImage(coverResult);
      if (!coverBase64) throw new Error("Falha na capa");
      const coverImage = `data:image/png;base64,${coverBase64}`;

      addLog("Produzindo editorial variado (7 fotos)...");
      const galleryImages = [coverImage];
      const allScenarios = [
          // Intimate / Home / Morning
          "Wearing a white silk robe, sitting on a messy bed in a luxury hotel room, morning light, coffee cup",
          "Lying on white sheets in a sunlit bedroom, wearing a satin camisole, relaxed pose, soft focus",
          "Sitting on a velvet sofa in a penthouse, wearing a cozy oversized cashmere sweater, reading a book",
          "Standing in a marble bathroom, wearing a towel turban and bathrobe, applying skincare, spa vibe",
          "Lounging on a window seat wrapped in a blanket, looking out at rain, wearing comfortable loungewear",
          "Waking up, stretching in bed, wearing lace pajamas, golden morning hour light",

          // Social / Nightlife / Dining
          "Wearing a velvet cocktail dress, sitting at a dimly lit jazz bar, holding a martini, moody lighting",
          "Wearing a red backless evening gown, standing on a rooftop balcony at night, city lights background, holding champagne",
          "Sitting at a fine dining restaurant table, candlelight, wearing a black slip dress, smiling at camera",
          "Dancing in a VIP club booth, wearing a sequin mini dress, neon lights, dynamic motion",
          "Laughing in the back of a luxury limousine, wearing a faux fur coat over a party dress, holding a flute",
          "Attending a gallery opening, wearing an avant-garde outfit, holding a program, art background",

          // Outdoor / Travel / Luxury
          "Wearing a white bikini and sheer sarong, walking on a private beach at sunset, wind in hair, golden hour",
          "Lounging on the deck of a superyacht, wearing a linen shirt and shorts, sunglasses, blue ocean background",
          "Driving a vintage convertible car along a coastal road, wearing a headscarf and sunglasses, motion blur",
          "Playing tennis on a clay court, wearing a white tennis skirt and polo, sunny afternoon",
          "Walking out of a high-end boutique with shopping bags, wearing a trench coat and boots, street style",
          "Relaxing by an infinity pool, wearing a wide-brimmed hat and swimsuit, turquoise water",
          "Walking in a snowy street, wearing a stylish winter coat and beanie, cold breath visible, winter wonderland",
          "Riding a horse on a ranch, wearing equestrian gear, nature background"
      ];
      const selectedScenarios = allScenarios.sort(() => 0.5 - Math.random()).slice(0, 7);

      for (const scenario of selectedScenarios) {
        addLog(`Capturando: ${scenario.substring(0, 30)}...`);
        const galleryPrompt = `Photo of the SAME woman (${inputs.details}). Scene: ${scenario}. Style: Raw candid, grainy film look, real skin texture, hyper realistic. NOT illustration.`;
        const res = await ai.models.generateContent({ model: "gemini-2.5-flash-image", contents: galleryPrompt });
        const imgBase64 = extractImage(res);
        if (imgBase64) galleryImages.push(`data:image/png;base64,${imgBase64}`);
      }

      const newMuse: MuseProfile = {
        id: Date.now().toString(),
        name: inputs.name,
        niche: inputs.niche,
        tagline: content.tagline,
        coverImage: coverImage,
        images: galleryImages,
        physicalDescription: inputs.details,
        content: { title: content.title, intro: content.intro, bodyParagraphs: content.bodyParagraphs, keywords: content.keywords, expertVerdict: content.expertVerdict, faqs: content.faqs, insiderSecret: content.insiderSecret }
      };

      onGenerate(newMuse);
      addLog("SUCESSO! Perfil High-Ticket criado.");
      setInputs({ niche: '', name: '', details: '' });
    } catch (err) { console.error(err); addLog(`ERRO FATAL: ${(err as Error).message}`); } finally { setLoading(false); }
  };

  return (
    <div className="bg-[#111] min-h-screen pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-4xl text-white font-serif mb-8 flex items-center gap-4"><LayoutDashboard className="text-yellow-600" /> Painel de Criação</h2>
        <div className="bg-gray-900 p-6 rounded-lg border border-white/10 mb-12 flex flex-wrap gap-4 items-center justify-between">
           <div><h3 className="text-white font-bold uppercase tracking-widest text-sm mb-1">Banco de Dados</h3><p className="text-gray-500 text-xs">Salve ou restaure seus perfis.</p></div>
           <div className="flex gap-4">
              <button onClick={onExport} className="flex items-center gap-2 px-4 py-2 bg-black border border-white/20 text-white rounded hover:border-yellow-600 transition-colors text-sm font-bold uppercase tracking-wide"><Download size={16} /> Baixar JSON</button>
              <label className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-black rounded hover:bg-yellow-500 transition-colors text-sm font-bold uppercase tracking-wide cursor-pointer"><Upload size={16} /> Importar JSON<input type="file" accept=".json" onChange={onImport} className="hidden" /></label>
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
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {muses.map(muse => (
             <div key={muse.id} className="flex items-center justify-between bg-gray-900 p-4 rounded border border-white/5">
                <div className="flex items-center gap-4"><img src={muse.coverImage} className="w-12 h-12 rounded-full object-cover" /><div><h4 className="text-white font-bold">{muse.name}</h4><p className="text-xs text-gray-500">{muse.niche}</p></div></div>
                <button onClick={() => onDelete(muse.id)} className="text-red-500 hover:text-red-400 p-2"><Trash2 size={18} /></button>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [muses, setMuses] = useState<MuseProfile[]>(INITIAL_MUSES);
  const [view, setView] = useState<ViewState>('HOME');
  const [activeProfile, setActiveProfile] = useState<MuseProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMuses, setFilteredMuses] = useState<MuseProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize Data (LocalStorage OR Static JSON)
  useEffect(() => {
    const initData = async () => {
      try {
        // Priority 1: Check LocalStorage (Recent edits)
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.length > 0) {
            setMuses(parsed);
            setFilteredMuses(parsed);
            setLoading(false);
            return;
          }
        }
        
        // Priority 2: Fetch static JSON file (GitHub/Deployment)
        // Ensure you rename your exported file to 'lumiere_db.json' and place it in the public folder
        const response = await fetch('./lumiere_db.json');
        if (response.ok) {
          const externalData = await response.json();
          if (Array.isArray(externalData) && externalData.length > 0) {
             setMuses(externalData);
             setFilteredMuses(externalData);
             // Save to storage so edits are persistent from this point
             saveToStorage(externalData);
          }
        }
      } catch (e) { 
        console.warn("Nenhum banco de dados encontrado. Iniciando vazio.", e); 
      } finally {
        setLoading(false);
      }
    };
    
    initData();
  }, []);

  // Filter Logic with simulated delay
  useEffect(() => {
    if (loading) return; // Skip if initial load not done
    
    setIsSearching(true);
    const delayDebounceFn = setTimeout(() => {
      if (!searchTerm.trim()) {
        setFilteredMuses(muses);
      } else {
        const lower = searchTerm.toLowerCase();
        const results = muses.filter(m => 
          m.name.toLowerCase().includes(lower) || 
          m.niche.toLowerCase().includes(lower) ||
          m.tagline.toLowerCase().includes(lower)
        );
        setFilteredMuses(results);
      }
      setIsSearching(false);
    }, 500); // 500ms delay to simulate search processing/network

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, muses, loading]);

  // Save on Change (with safe wrapper)
  useEffect(() => {
    if (!loading && muses.length > 0) saveToStorage(muses);
  }, [muses, loading]);

  const handleCreateMuse = (newMuse: MuseProfile) => setMuses(prev => [newMuse, ...prev]);
  const handleDeleteMuse = (id: string) => setMuses(prev => prev.filter(m => m.id !== id));
  
  const handleExportDB = () => {
     const blob = new Blob([JSON.stringify(muses)], { type: "application/json" });
     const url = URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url; a.download = "lumiere_db.json";
     a.click();
  };

  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
           setMuses(imported);
           saveToStorage(imported);
           alert("Importação realizada com sucesso!");
        }
      } catch (err) { alert("Erro ao importar arquivo."); }
    };
    reader.readAsText(file);
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="text-yellow-600 animate-spin" size={48} /></div>;

  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-yellow-600 selection:text-black">
      <Navigation onNavigate={(v) => { setView(v); if(v==='HOME') setActiveProfile(null); }} currentView={view} />
      
      {view === 'HOME' && (
        <>
          <Hero />
          <section id="profiles" className="py-32 px-6 bg-[#050505] relative">
             <div className="container mx-auto max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between items-end mb-24 border-b border-white/10 pb-8 gap-6">
                   <div>
                     <h2 className="text-4xl md:text-6xl font-serif text-white mb-2">Nossos Talentos</h2>
                     <div className="relative mt-4 group">
                       <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-600 transition-colors" size={20} />
                       <input 
                         type="text" 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         placeholder="Buscar por nome ou nicho..." 
                         className="bg-transparent border-none text-white pl-8 focus:ring-0 placeholder:text-gray-600 text-lg w-full md:w-[300px] outline-none"
                       />
                       <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/20 group-focus-within:bg-yellow-600 transition-colors"></div>
                     </div>
                   </div>
                   <div className="text-right hidden md:block"><p className="text-yellow-600 text-lg font-bold">{muses.length}</p><p className="text-gray-500 text-xs uppercase tracking-widest">Modelos Exclusivas</p></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
                   <div onClick={() => setView('DASHBOARD')} className="group cursor-pointer min-h-[500px] flex flex-col items-center justify-center border border-dashed border-white/20 hover:border-yellow-600 transition-colors rounded-sm bg-gray-900/20">
                      <PlusCircle size={48} className="text-gray-600 group-hover:text-yellow-600 mb-4 transition-colors" />
                      <span className="text-gray-500 font-bold uppercase tracking-widest text-sm group-hover:text-white">Adicionar Novo Talento</span>
                   </div>
                   
                   {isSearching ? (
                     // Skeleton Loading State
                     Array.from({ length: 3 }).map((_, i) => (
                       <MuseSkeleton key={i} />
                     ))
                   ) : (
                     // Filtered Results
                     filteredMuses.map((muse) => (
                        <div key={muse.id} onClick={() => { setActiveProfile(muse); setView('PROFILE'); }} className="group cursor-pointer">
                           <div className="relative aspect-[3/4] mb-8 overflow-hidden">
                              <OptimizedImage src={muse.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale group-hover:grayscale-0" alt={muse.name} />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                              <div className="absolute bottom-6 left-6"><span className="bg-white text-black text-[10px] font-bold px-2 py-1 uppercase tracking-widest mb-2 inline-block">{muse.niche}</span></div>
                           </div>
                           <h3 className="text-3xl font-serif text-white mb-2 group-hover:text-yellow-600 transition-colors">{muse.name}</h3>
                           <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{muse.tagline}</p>
                        </div>
                     ))
                   )}
                   
                   {!isSearching && filteredMuses.length === 0 && (
                     <div className="col-span-1 md:col-span-2 text-center py-20">
                       <p className="text-gray-500 font-serif italic text-xl">Nenhum talento encontrado.</p>
                     </div>
                   )}
                </div>
             </div>
          </section>
        </>
      )}

      {view === 'PROFILE' && activeProfile && (
        <ProfilePage 
          profile={activeProfile} 
          allMuses={muses}
          onSelectProfile={(p) => { setActiveProfile(p); window.scrollTo(0,0); }}
          onBack={() => setView('HOME')} 
        />
      )}

      {view === 'DASHBOARD' && (
        <Dashboard 
          onGenerate={handleCreateMuse} 
          onDelete={handleDeleteMuse}
          onExport={handleExportDB}
          onImport={handleImportDB}
          muses={muses}
        />
      )}

      <footer id="contact" className="bg-black py-24 border-t border-white/10 text-center md:text-left">
        <div className="container mx-auto px-6 max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-12">
           <div className="col-span-1 md:col-span-2">
              <h2 className="text-3xl font-serif font-black text-white tracking-widest mb-6">LUMIÈRE<span className="text-yellow-600">.</span></h2>
              <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">Redefinindo a intersecção entre influência digital de elite e inteligência de mercado. Uma curadoria de excelência para marcas que exigem o extraordinário.</p>
              <div className="flex gap-6 justify-center md:justify-start"><Instagram className="text-gray-400 hover:text-white cursor-pointer" /><Mail className="text-gray-400 hover:text-white cursor-pointer" /></div>
           </div>
           <div>
              <h4 className="text-white font-bold uppercase tracking-widest mb-6 text-sm">Agência</h4>
              <ul className="space-y-4 text-gray-500 text-sm">
                 <li className="hover:text-yellow-600 cursor-pointer">Sobre Nós</li>
                 <li className="hover:text-yellow-600 cursor-pointer">Carreiras</li>
                 <li className="hover:text-yellow-600 cursor-pointer">Imprensa</li>
              </ul>
           </div>
           <div>
              <h4 className="text-white font-bold uppercase tracking-widest mb-6 text-sm">Legal</h4>
              <ul className="space-y-4 text-gray-500 text-sm">
                 <li className="hover:text-yellow-600 cursor-pointer">Privacidade</li>
                 <li className="hover:text-yellow-600 cursor-pointer">Termos de Uso</li>
                 <li className="hover:text-yellow-600 cursor-pointer">Compliance</li>
              </ul>
           </div>
        </div>
        <div className="container mx-auto px-6 max-w-7xl mt-20 pt-8 border-t border-white/5 text-center text-gray-600 text-xs">
           &copy; 2024 Lumière Collective. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default App;