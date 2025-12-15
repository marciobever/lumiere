import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, Lightbulb, Lock, Maximize2, ArrowRight, HelpCircle } from 'lucide-react';
import { MuseProfile } from '../types';
import { OptimizedImage, InteractionBanner, FAQItem } from './Shared';
import { SmartAdUnit } from './AdSense';
import { updateMetaTags } from '../utils';

interface ProfilePageProps {
  profile: MuseProfile;
  allMuses: MuseProfile[];
  onSelectProfile: (p: MuseProfile) => void;
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, allMuses, onSelectProfile, onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // Estado para forçar a troca dos banners sempre que a tela é montada
  const [adSessionKey, setAdSessionKey] = useState<number>(Date.now());

  // Scroll to top on profile change
  useEffect(() => { 
    window.scrollTo(0, 0); 
    const seoDescription = profile.intro || `Conheça ${profile.name}, especialista em ${profile.niche}.`;
    const seoKeywords = profile.keywords ? ` | ${profile.keywords.slice(0, 5).join(', ')}` : '';
    
    updateMetaTags(
        `${profile.name} | Lumière Collective`,
        seoDescription + seoKeywords,
        profile.cover_url
    );
    // Atualiza a chave de sessão de anúncios
    setAdSessionKey(Date.now());
  }, [profile]);

  const relatedMuses = allMuses.filter(m => m.id !== profile.id).sort(() => 0.5 - Math.random()).slice(0, 3);
  
  const paragraphs = profile.body && profile.body.length > 50 
    ? profile.body.split('\n').filter(p => p.trim().length > 0) 
    : [
        profile.intro || "Perfil exclusivo da Lumière.",
        `Especialista em ${profile.niche}, ${profile.name} traz uma visão única para o mercado.`,
        "Sua trajetória é marcada por inovação e uma estética impecável, redefinindo os padrões de influência digital.",
        "Em breve, traremos uma análise editorial completa sobre suas estratégias e impacto no cenário global."
      ];

  const handleRandomNext = () => {
     const others = allMuses.filter(m => m.id !== profile.id);
     if (others.length > 0) {
        const random = others[Math.floor(Math.random() * others.length)];
        onSelectProfile(random);
     } else {
        alert("Mais musas chegando em breve.");
     }
  };

  const GLOBAL_AD_SLOT = "1624191321";

  return (
    <div className="bg-[#050505] min-h-screen animate-fade-in pb-32">
      <div className="fixed top-28 left-8 z-40 hidden md:block">
        <button onClick={onBack} className="bg-black/50 hover:bg-yellow-600 p-3 rounded-full text-white backdrop-blur-md transition-all border border-white/10 group flex items-center gap-2 pr-4 shadow-xl">
          <ArrowLeft size={18} /> <span className="text-xs font-bold uppercase tracking-widest hidden group-hover:inline">Voltar</span>
        </button>
      </div>

       {selectedImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-50 p-2 bg-black/50 rounded-full border border-white/10"
          >
            <X size={32} />
          </button>
          <img 
            src={selectedImage} 
            alt="Zoom" 
            className="max-w-full max-h-[90vh] object-contain shadow-2xl border border-white/10 rounded-sm cursor-default"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      <div className="relative h-[95vh] w-full overflow-hidden">
        <OptimizedImage src={profile.cover_url} className="w-full h-full object-cover object-center" alt={profile.name} priority={true} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-black/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent opacity-100"></div>
        <div className="absolute left-0 right-0 bottom-0 z-20 flex flex-col justify-end px-6 md:px-12 pb-20 md:pb-32 pointer-events-none max-h-[55vh]">
          <div className="container mx-auto max-w-7xl pointer-events-auto flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-6 md:mb-8 animate-fade-in">
               <span className="bg-yellow-600 text-black px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(202,138,4,0.3)]">{profile.niche}</span>
               <span className="text-gray-300 text-xs uppercase tracking-widest border-l border-gray-500 pl-4 drop-shadow-md">12 min de leitura</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-white mb-6 md:mb-8 leading-[1.1] max-w-5xl shadow-black drop-shadow-2xl tracking-tight animate-fade-in line-clamp-4">{profile.title}</h1>
            <p className="text-lg md:text-2xl text-gray-100 italic max-w-3xl font-serif md:border-l-4 border-yellow-600 md:pl-8 leading-snug drop-shadow-lg animate-fade-in line-clamp-3">"{profile.intro}"</p>
          </div>
        </div>
      </div>

      <div className="bg-[#050505] text-gray-200 py-12 md:py-24 px-6 md:px-12 relative z-30">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col gap-12">
            <div className="prose prose-invert prose-lg max-w-none">
              
              {paragraphs[0] && (
                 <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 first-letter:text-7xl first-letter:font-serif first-letter:text-yellow-600 first-letter:float-left first-letter:mr-4 first-letter:mt-[-8px] mb-12 font-light tracking-wide">{paragraphs[0]}</p>
              )}
              
              {/* Ad Unit 1: Top Content */}
              <div className="not-prose w-full my-8">
                <SmartAdUnit key={`ad-top-${profile.id}-${adSessionKey}`} slotId={GLOBAL_AD_SLOT} format="auto" className="w-full" />
              </div>
              
              {profile.gallery_urls[0] && (
                <div 
                  className="my-16 relative group overflow-hidden shadow-2xl border border-white/5 cursor-zoom-in"
                  onClick={() => setSelectedImage(profile.gallery_urls[0])}
                >
                  <OptimizedImage src={profile.gallery_urls[0]} className="w-full h-[400px] md:h-[800px] object-cover transition-transform duration-1000 group-hover:scale-105" alt="Editorial 1" />
                </div>
              )}

              {paragraphs[1] && (
                  <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-12 tracking-wide font-light">{paragraphs[1]}</p>
              )}
              
              <InteractionBanner name={profile.name} type="whatsapp" onNext={handleRandomNext} />
              
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
              
              {/* Ad Unit 2: Middle Content */}
              <div className="not-prose w-full my-8">
                 <SmartAdUnit key={`ad-mid-${profile.id}-${adSessionKey}`} slotId={GLOBAL_AD_SLOT} format="auto" className="w-full" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-20">
                 {profile.gallery_urls[1] && (
                   <div 
                      className="h-[400px] md:h-[500px] md:mt-12 shadow-lg border border-white/5 cursor-zoom-in"
                      onClick={() => setSelectedImage(profile.gallery_urls[1])}
                   >
                      <OptimizedImage src={profile.gallery_urls[1]} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt="Detail 1" />
                   </div>
                 )}
                 {profile.gallery_urls[2] && (
                   <div 
                      className="h-[400px] md:h-[500px] shadow-lg border border-white/5 cursor-zoom-in"
                      onClick={() => setSelectedImage(profile.gallery_urls[2])}
                   >
                      <OptimizedImage src={profile.gallery_urls[2]} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt="Detail 2" />
                   </div>
                 )}
              </div>
              
              {paragraphs[3] && <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-12 tracking-wide font-light">{paragraphs[3]}</p>}
              {paragraphs[4] && <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-200 mb-12 tracking-wide font-light">{paragraphs[4]}</p>}
              
              <InteractionBanner name={profile.name} type="vip" onNext={handleRandomNext} />
              
              {/* Ad Unit 3: Bottom Content */}
              <div className="not-prose w-full my-8">
                 <SmartAdUnit key={`ad-bot-${profile.id}-${adSessionKey}`} slotId={GLOBAL_AD_SLOT} format="auto" className="w-full" />
              </div>
              
              <div className="my-24 border-l-4 border-white pl-8 md:pl-12 py-4">
                 <h3 className="font-serif text-3xl text-white mb-6">O Veredito da Lumière</h3>
                 <p className="text-xl text-gray-200 italic font-serif leading-relaxed">"{profile.expert_verdict}"</p>
                 <div className="mt-6 flex items-center gap-4">
                    <OptimizedImage src={profile.cover_url} className="w-12 h-12 rounded-full object-cover border border-white/20" alt="Author" />
                    <div><p className="text-sm text-white font-bold uppercase">{profile.name}</p><p className="text-xs text-gray-500">{profile.niche} Especialista</p></div>
                 </div>
              </div>
              
              {paragraphs.length > 5 && paragraphs.slice(5).map((p, i) => (
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
                <div 
                  key={i} 
                  className={`relative overflow-hidden group cursor-zoom-in ${i === 0 || i === 3 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'}`}
                  onClick={() => setSelectedImage(img)}
                >
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
                   <a 
                     key={related.id} 
                     href={`/?id=${related.id}`}
                     onClick={(e) => { e.preventDefault(); onSelectProfile(related); }}
                     className="group cursor-pointer flex flex-col transition-transform duration-500 hover:scale-[1.02] block"
                   >
                     <div className="aspect-[3/4] mb-6 overflow-hidden relative border border-white/10 rounded-sm transition-all duration-500 group-hover:border-yellow-600/50 group-hover:shadow-[0_0_30px_rgba(202,138,4,0.3)]">
                        <OptimizedImage src={related.cover_url} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" alt={related.name} />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                        <div className="absolute top-4 left-4 bg-yellow-600 text-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest z-10 shadow-lg">{related.niche}</div>
                     </div>
                     <h4 className="font-serif text-2xl text-white mb-2 group-hover:text-yellow-600 transition-colors duration-300">{related.name}</h4>
                     <p className="text-sm text-gray-500 line-clamp-2 group-hover:text-gray-400 transition-colors duration-300">{related.tagline}</p>
                   </a>
                 ))}
               </div>
            </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;