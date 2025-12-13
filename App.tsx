import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { MuseProfile, ViewState } from './types';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import ProfilePage from './components/ProfilePage';
import Dashboard from './components/Dashboard';
import { OptimizedImage } from './components/Shared';
import { SmartAdUnit } from './components/AdSense';
import { Loader2, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [selectedProfile, setSelectedProfile] = useState<MuseProfile | null>(null);
  const [muses, setMuses] = useState<MuseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Data
  useEffect(() => {
    fetchMuses();
  }, []);

  // 2. Handle Initial Routing & Browser Back/Forward Button
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const profileId = params.get('id');
      const viewParam = params.get('view');

      if (profileId && muses.length > 0) {
        const foundProfile = muses.find(m => m.id === profileId);
        if (foundProfile) {
          setSelectedProfile(foundProfile);
          setView('PROFILE');
        } else {
          setView('HOME');
        }
      } else if (viewParam === 'dashboard') {
        setView('DASHBOARD');
      } else {
        setView('HOME');
        setSelectedProfile(null);
      }
    };

    if (!loading) {
       handlePopState();
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loading, muses]);

  const fetchMuses = async () => {
    setLoading(true);
    setError(null);
    try {
      // Direct fetch without Promise.race to avoid premature timeouts
      const { data, error } = await supabase.from('muses').select('*');
      
      if (error) throw error;
      
      if (data) {
        const sanitizedData: MuseProfile[] = data.map((m: any) => ({
          ...m,
          gallery_urls: Array.isArray(m.gallery_urls) ? m.gallery_urls : [],
          keywords: Array.isArray(m.keywords) ? m.keywords : [],
          faqs: Array.isArray(m.faqs) ? m.faqs : [],
          cover_url: m.cover_url || '',
          name: m.name || 'Unnamed',
          niche: m.niche || 'General',
          intro: m.intro || '',
          body: m.body || '',
          expert_verdict: m.expert_verdict || '',
          insider_secret: m.insider_secret || ''
        }));
        setMuses(sanitizedData);
      }
    } catch (e: any) {
      console.error("Could not fetch muses:", e);
      setError("Não foi possível conectar ao banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  // SPA Navigation Helper
  const navigateTo = (url: string, newView: ViewState) => {
     try {
       window.history.pushState({}, '', url);
     } catch (e) {
       console.warn("Navigation history update failed (sandbox):", e);
     }
     setView(newView);
     window.scrollTo(0, 0);
  };

  const handleNavigate = (v: ViewState) => {
    if (v === 'HOME') {
       navigateTo('/', 'HOME');
       setSelectedProfile(null);
    } else if (v === 'DASHBOARD') {
       navigateTo('/?view=dashboard', 'DASHBOARD');
    }
  };

  const handleSelectProfile = (profile: MuseProfile) => {
    setSelectedProfile(profile);
    navigateTo(`/?id=${profile.id}`, 'PROFILE');
  };

  const handleGenerate = async (newMuse: MuseProfile) => {
    setMuses(prev => [newMuse, ...prev]);
    try {
       await supabase.from('muses').insert([newMuse]);
    } catch (e) {
       console.error("Auto-save failed:", e);
    }
  };

  const handleDelete = async (id: string) => {
    setMuses(prev => prev.filter(m => m.id !== id));
    try {
      await supabase.from('muses').delete().eq('id', id);
    } catch (e) { console.error("Delete failed:", e); }
  };

  const handleSaveToN8N = async (muse: MuseProfile) => {
     console.log("Saved to N8N:", muse.name);
  };

  if (loading) {
     return (
       <div className="h-screen bg-black flex flex-col items-center justify-center text-white space-y-4">
         <Loader2 className="animate-spin text-yellow-600" size={40}/>
         <p className="text-gray-500 text-sm tracking-widest uppercase">Carregando Lumière...</p>
       </div>
     );
  }

  if (error && muses.length === 0) {
      return (
        <div className="h-screen bg-black flex flex-col items-center justify-center text-white space-y-6 px-4 text-center">
            <p className="text-red-500 font-serif text-xl">{error}</p>
            <button onClick={fetchMuses} className="bg-yellow-600 text-black px-6 py-2 rounded font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-yellow-500 transition-colors">
                <RefreshCw size={18} /> Tentar Novamente
            </button>
        </div>
      );
  }

  return (
    <div className="bg-[#050505] min-h-screen text-gray-200 font-sans selection:bg-yellow-600 selection:text-black">
       <Navigation onNavigate={handleNavigate} currentView={view} />
       
       {view === 'HOME' && (
         <>
           <Hero />
           <main id="profiles" className="container mx-auto px-6 py-20">
             <div className="flex items-end justify-between mb-12 border-b border-white/10 pb-6">
                <div>
                   <h2 className="font-serif text-4xl md:text-5xl text-white mb-2">Talentos Exclusivos</h2>
                   <p className="text-gray-400 font-light tracking-wide">Uma seleção curada de perfis de alto impacto.</p>
                </div>
                <div className="hidden md:block text-xs font-bold uppercase tracking-widest text-yellow-600">
                   {muses.length} Perfis Disponíveis
                </div>
             </div>
             
             {muses.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
                   <p className="text-gray-500 font-serif italic mb-4">A coleção está vazia no momento.</p>
                   <button onClick={() => navigateTo('/?view=dashboard', 'DASHBOARD')} className="text-yellow-600 hover:text-white transition-colors text-sm uppercase font-bold tracking-widest">
                      Acessar Dashboard
                   </button>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                   {muses.map((muse) => (
                      <div key={muse.id} onClick={() => handleSelectProfile(muse)} className="group cursor-pointer flex flex-col">
                         <div className="relative aspect-[3/4] mb-6 overflow-hidden bg-gray-900 border border-white/5 rounded-sm">
                            <OptimizedImage src={muse.cover_url} alt={muse.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale-[30%] group-hover:grayscale-0" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                            <div className="absolute top-4 left-4">
                               <span className="bg-white/10 backdrop-blur-md text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-white/10">{muse.niche}</span>
                            </div>
                         </div>
                         <h3 className="font-serif text-3xl text-white mb-2 group-hover:text-yellow-600 transition-colors">{muse.name}</h3>
                         <p className="text-gray-400 text-sm line-clamp-2 font-light leading-relaxed group-hover:text-gray-300">{muse.tagline || muse.intro}</p>
                      </div>
                   ))}
                </div>
             )}
             
             {/* Ad Unit Home */}
             <div className="mt-20">
               <SmartAdUnit key="home-ad-bottom" slotId="1624191321" format="auto" className="w-full max-w-5xl mx-auto" />
             </div>
           </main>
           
           <section id="niches" className="bg-white/5 py-20 mt-20">
              <div className="container mx-auto px-6 text-center">
                 <h2 className="font-serif text-3xl text-white mb-8">Nichos de Atuação</h2>
                 <div className="flex flex-wrap justify-center gap-4">
                    {Array.from(new Set(muses.map(m => m.niche).filter(Boolean))).map(niche => (
                       <span key={niche} className="px-6 py-3 border border-white/10 hover:border-yellow-600 hover:text-yellow-600 transition-colors cursor-default text-sm uppercase tracking-widest">{niche}</span>
                    ))}
                 </div>
              </div>
           </section>
         </>
       )}

       {view === 'PROFILE' && selectedProfile && (
         <ProfilePage 
            profile={selectedProfile} 
            allMuses={muses} 
            onSelectProfile={handleSelectProfile} 
            onBack={() => navigateTo('/', 'HOME')} 
         />
       )}

       {view === 'DASHBOARD' && (
         <Dashboard 
            muses={muses} 
            onGenerate={handleGenerate} 
            onDelete={handleDelete} 
            onSaveToN8N={handleSaveToN8N} 
         />
       )}
    </div>
  );
};

export default App;