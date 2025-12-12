import React, { useState, useRef } from 'react';
import { LayoutDashboard, Wand2, Loader2, Send, FileJson, Trash2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { MuseProfile, DashboardInputs } from '../types';
import { N8N_WEBHOOK_URL, getApiKey } from '../config';
import { cleanAndParseJSON, compressImage } from '../utils';

interface DashboardProps {
  onGenerate: (data: MuseProfile) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  muses: MuseProfile[];
  onSaveToN8N: (muse: MuseProfile) => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ onGenerate, onDelete, muses, onSaveToN8N }) => {
  const [inputs, setInputs] = useState<DashboardInputs>({ niche: '', name: '', details: '' });
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [webhookUrl] = useState(N8N_WEBHOOK_URL);
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
        const json = JSON.parse(text);
        if (!json.name) throw new Error("JSON inválido: Faltando nome.");
        
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
          const optimizedCover = await compressImage(muse.cover_url);
          const optimizedImages = await Promise.all(muse.gallery_urls.map(img => compressImage(img)));
          
          const payload = { 
             ...muse, 
             cover_url: optimizedCover, 
             gallery_urls: optimizedImages 
          };

          addLog(`Enviando dados para n8n (${muse.name})...`);
          
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
    
    const ethnicities = ["Brazilian Mixed", "Japanese", "Afro-Brazilian", "Scandinavian", "Italian", "Korean", "Colombian", "Russian", "Latina", "Middle Eastern"];
    const bodyTypes = ["Slim & Toned", "Curvy Hourglass", "Athletic", "Tall & Slender", "Voluminous", "Petite", "Fit"];
    const vibes = ["Tattooed Alternative", "Elegant Old Money", "Beach Bunny", "High-Fashion Edgy", "Gym Rat", "Boho Chic", "Minimalist", "Streetwear", "Cyberpunk", "Vintage Pinup"];
    const facialFeatures = ["Freckles", "Mole on cheek", "Sharp jawline", "Full lips", "Dimples", "Glasses", "Heterochromia", "Gap teeth", "Heavy makeup", "Natural look", "Piercing on nose", "Blue eyes", "Green eyes"];
    const hairStyles = ["Long wavy", "Short bob", "Pixie cut", "Messy bun", "Straight sleek", "Braids", "Ponytail", "Bangs"];

    const randomEthnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)];
    const randomBody = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
    const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];
    const randomFace = facialFeatures[Math.floor(Math.random() * facialFeatures.length)];
    const randomHair = hairStyles[Math.floor(Math.random() * hairStyles.length)];
    const randomAge = Math.floor(Math.random() * (28 - 19 + 1)) + 19;

    const physicalPrompt = `Stunning WOMAN, ${randomAge} years old. 
    Ethnicity: ${randomEthnicity}. 
    Body Type: ${randomBody}.
    Hair: ${randomHair}.
    Distinctive Feature: ${randomFace}.
    Style/Vibe: ${randomVibe}.
    Overall: Highly attractive, confident, photogenic female model.`;

    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const prompt = `Generate a JSON profile for a Social Media Model (FEMALE WOMAN ${randomVibe}). Output JSON ONLY: {"name": "Female Name", "niche": "High CPM Niche", "details": "${physicalPrompt}"}`;
      
      const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json" } });
      const data = cleanAndParseJSON(result.text || "{}");
      setInputs({ name: data.name, niche: data.niche, details: physicalPrompt });
      addLog(`DNA Gerado: ${data.name} | ${randomEthnicity} | ${randomFace}`);
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
      addLog("Criando conteúdo OTIMIZADO (SEO)...");
      
      const textPrompt = `Crie um perfil JSON PREMIUM e OTIMIZADO PARA SEO para "${inputs.name}", especialista em "${inputs.niche}".
      GÊNERO: FEMININO (Sempre trate como mulher/ela/dela).
      Idioma: PT-BR (Português Brasileiro).
      Tom: Sedutor, extremamente inteligente, autoridade de mercado, sofisticado.
      
      REQUISITOS OBRIGATÓRIOS PARA MONETIZAÇÃO ALTA:
      1. "intro": Gancho viral, instigante, 150-200 caracteres (Use pronomes femininos).
      2. "bodyParagraphs": 6 a 8 parágrafos LONGOS e DENSO (100-150 palavras cada). Deve entregar valor real sobre o nicho, contar histórias envolventes e usar termos técnicos de alto valor.
      3. "expertVerdict": Uma análise profissional de por que ELA é uma autoridade.
      4. "insiderSecret": Uma dica técnica específica e valiosa (Ouro) sobre ${inputs.niche}.
      5. "faqs": Gere 6 perguntas complexas com respostas detalhadas (focadas em Long-tail keywords).
      6. "keywords": 15 palavras-chave de alto CPM (Custo por Mil) relacionadas a ${inputs.niche}.
      
      JSON Schema: { "tagline": "", "title": "", "intro": "", "bodyParagraphs": [], "keywords": [], "expertVerdict": "", "faqs": [{"question":"","answer":""}], "insiderSecret": "" }`;

      const textResult = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: textPrompt, config: { responseMimeType: "application/json" } });
      const content = cleanAndParseJSON(textResult.text || "{}");

      addLog("Fotografando capa...");
      
      const physicalDesc = inputs.details;
      const styleKeywords = "Masterpiece, 8k, ultra-realistic, raw photo, fujifilm, grain, sweat texture, detailed skin pores, hyper-detailed eyes, soft lighting, volumetric fog, vogue editorial.";
      const genderEnforcedDetails = `STUNNING FEMALE WOMAN, LADY, MODEL, ${physicalDesc}`;
      
      const coverPrompt = `Portrait of a stunning WOMAN (${genderEnforcedDetails}). 
      Context: Close up, looking at camera, biting lip, intense gaze, messy hair. 
      Clothing: Low cut top, cleavage, revealing but classy. 
      Style: ${styleKeywords}`;
      
      const coverResult = await ai.models.generateContent({ model: "gemini-2.5-flash-image", contents: coverPrompt });
      const coverBase64 = coverResult.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
      if (!coverBase64) throw new Error("Falha na capa - Imagem não gerada (Safety ou Erro)");
      const coverImage = `data:image/png;base64,${coverBase64}`;

      addLog("Produzindo editorial completo (buscando 8 fotos)...");
      
      const galleryImages = [coverImage];
      
      const allScenarios = [
        "Lying on bed, silk sheets, wearing lace lingerie, POV shot, messy hair, morning light, seductive look",
        "Stepping out of shower, wearing only a white towel, wet hair, skin droplets, steamy bathroom mirror reflection",
        "In a luxury car at night, leather seats, wearing a very short dress, legs crossed, ambient city lights",
        "At a private pool, wearing a tiny micro-bikini, sunbathing, glistening skin, oil texture, wet body",
        "In a high-end gym, wearing tight yoga pants and sports bra, sweating, mirror selfie, fit body",
        "Bedroom vanity, applying lipstick, wearing a silk robe falling off shoulder, lace detail, intimate atmosphere",
        "Nightclub VIP section, holding champagne, wearing a sheer dress with deep neckline, party lighting, glamour",
        "Kitchen counter, wearing an oversized shirt and nothing else, drinking coffee, morning vibes, legs visible",
        "Golden hour at the beach, white wet t-shirt, see-through, standing in waves, sunset backlight",
        "Office desk, glasses, biting a pen, unbuttoned blouse, looking up provocatively, secretary vibe",
        "Hotel balcony, wearing a silk slip dress, wind blowing dress against body, city skyline background",
        "Sofa lounging, wearing knee-high socks and oversized sweater, cozy but sexy, teasing pose",
        "Tennis court, wearing short tennis skirt, bending over to pick up ball, athletic aesthetic",
        "Sauna, wearing a towel, sweaty skin, red cheeks, mist, relaxing",
        "Jacuzzi, bubbles, holding wine glass, wet hair, bikini straps visible, night time",
        "Fitting room selfie, trying on a tight dress, back reflection in mirror"
      ];

      addLog(`Gerando galeria (${allScenarios.length} cenários possíveis)...`);

      for (const scenario of allScenarios) {
        if (galleryImages.length >= 8) break;
        try {
           const prompt = `Photo of ${inputs.name}, ${inputs.details}. Context: ${scenario}. Style: Masterpiece, 8k, ultra-realistic, raw photo, fujifilm.`;
           const res = await ai.models.generateContent({ model: "gemini-2.5-flash-image", contents: prompt });
           const b64 = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
           if (b64) {
             galleryImages.push(`data:image/png;base64,${b64}`);
             addLog(`Foto ${galleryImages.length}/8 gerada.`);
           }
        } catch (e) {
          console.error("Erro na foto extra", e);
        }
      }

      const newMuse: MuseProfile = {
        id: Date.now().toString(),
        slug: inputs.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: inputs.name,
        niche: inputs.niche,
        tagline: content.tagline || `A musa de ${inputs.niche}`,
        title: content.title || inputs.name,
        intro: content.intro || "",
        body: content.bodyParagraphs ? content.bodyParagraphs.join('\n\n') : (typeof content.body === 'string' ? content.body : ""),
        expert_verdict: content.expertVerdict || "",
        insider_secret: content.insiderSecret || "",
        physical_description: inputs.details,
        cover_url: coverImage,
        gallery_urls: galleryImages,
        is_remote: false,
        keywords: content.keywords || [],
        faqs: content.faqs || []
      };

      await onGenerate(newMuse);
      addLog("Concluído! Perfil criado.");
      setLoading(false);

    } catch (err: any) {
      console.error(err);
      addLog(`ERRO FATAL: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pt-24">
       <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
             <div className="bg-gray-900 p-6 rounded-xl border border-white/10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Wand2 className="text-yellow-600"/> Gerador</h2>
                <div className="space-y-4">
                  <input value={inputs.niche} onChange={e => setInputs({...inputs, niche: e.target.value})} placeholder="Nicho (ex: Luxo, Cripto)" className="w-full bg-black/50 border border-white/10 p-3 rounded text-white" />
                  <input value={inputs.name} onChange={e => setInputs({...inputs, name: e.target.value})} placeholder="Nome" className="w-full bg-black/50 border border-white/10 p-3 rounded text-white" />
                  <textarea value={inputs.details} onChange={e => setInputs({...inputs, details: e.target.value})} placeholder="Detalhes Físicos" className="w-full bg-black/50 border border-white/10 p-3 rounded text-white h-24" />
                </div>
                <div className="flex gap-4 mt-6">
                   <button onClick={handleGenerate} disabled={loading} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 rounded flex justify-center items-center gap-2">
                     {loading ? <Loader2 className="animate-spin"/> : <Wand2 size={18} />} Gerar
                   </button>
                   <button onClick={generateRandomPersona} disabled={loading} className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded"><Wand2 size={18}/></button>
                   <div className="relative overflow-hidden bg-gray-800 hover:bg-gray-700 text-white p-3 rounded cursor-pointer">
                      <FileJson size={18} />
                      <input type="file" ref={fileInputRef} onChange={handleJsonUpload} accept=".json" className="absolute inset-0 opacity-0 cursor-pointer" />
                   </div>
                </div>
             </div>
             <div className="bg-black/50 p-4 rounded-xl border border-white/10 h-48 overflow-y-auto font-mono text-xs text-green-500">
                {logs.map((l, i) => <div key={i}>{l}</div>)}
             </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl border border-white/10">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><LayoutDashboard className="text-yellow-600"/> Perfis Ativos</h2>
             <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {muses.map(muse => (
                   <div key={muse.id} className="flex items-center gap-4 bg-black/30 p-3 rounded border border-white/5">
                      <img src={muse.cover_url} className="w-12 h-12 rounded object-cover" alt={muse.name}/>
                      <div className="flex-1">
                         <div className="font-bold">{muse.name}</div>
                         <div className="text-xs text-gray-400">{muse.niche}</div>
                      </div>
                      <button onClick={() => handleSaveClick(muse)} disabled={!!publishing} className="text-blue-400 hover:text-blue-300 p-2">
                         {publishing === muse.id ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
                      </button>
                      <button onClick={() => onDelete(muse.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={18}/></button>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
};
export default Dashboard;