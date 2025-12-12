import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { MuseProfile, ViewState } from './types';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import ProfilePage from './components/ProfilePage';
import Dashboard from './components/Dashboard';
import { OptimizedImage } from './components/Shared';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [selectedProfile, setSelectedProfile] = useState<MuseProfile | null>(null);
  const [muses, setMuses] = useState<MuseProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMuses();
  }, []);

  const fetchMuses = async () => {
    try {
      const { data, error } = await supabase.from('muses').select('*');
      if (error) throw error;
      if (data) setMuses(data as unknown as MuseProfile[]);
    } catch (e) {
      console.error("Error fetching muses:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (v: ViewState) => {
    setView(v);
    if (v === 'HOME') setSelectedProfile(null);
  };

  const handleSelectProfile = (profile: MuseProfile) => {
    setSelectedProfile(profile);
    setView('PROFILE');
  };

  const handleGenerate = async (newMuse: MuseProfile) => {
    setMuses(prev => [newMuse, ...prev]);
    // Optionally persist to Supabase if not handled by n8n
    // await supabase.from('muses').insert([newMuse]);
  };

  const handleDelete = async (id: string) => {
    setMuses(prev => prev.filter(m => m.id !== id));
    await supabase.from('muses').delete().eq('id', id);
  };

  const handleSaveToN8N = async (muse: MuseProfile) => {
     // Placeholder for any post-save actions needed in the parent
     console.log("Saved to N8N:", muse.name);
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" size={40}/></div>;

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
                <div className="text-center py-20 text-gray-500 font-serif italic">Nenhuma musa encontrada. Acesse o Dashboard para criar.</div>
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
           </main>
           
           <section id="niches" className="bg-white/5 py-20 mt-20">
              <div className="container mx-auto px-6 text-center">
                 <h2 className="font-serif text-3xl text-white mb-8">Nichos de Atuação</h2>
                 <div className="flex flex-wrap justify-center gap-4">
                    {Array.from(new Set(muses.map(m => m.niche))).map(niche => (
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
            onBack={() => setView('HOME')} 
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