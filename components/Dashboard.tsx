import React, { useState, useRef } from 'react';
import { LayoutDashboard, Wand2, Loader2, Send, FileJson, Trash2, Facebook, Copy, Share2, Megaphone, Check, Image as ImageIcon, Instagram, Camera, Download } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { MuseProfile, DashboardInputs, SocialPost } from '../types';
import { N8N_WEBHOOK_URL, getApiKey } from '../config';
import { cleanAndParseJSON, compressImage } from '../utils';

interface DashboardProps {
  onGenerate: (data: MuseProfile) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  muses: MuseProfile[];
  onSaveToN8N: (muse: MuseProfile) => Promise<void>;
}

type TabView = 'GENERATOR' | 'SOCIAL';
type SocialMode = 'COPYWRITER' | 'ART_DIRECTOR';
type VisualAssetType = 'PROFILE' | 'STORY' | 'FEED' | 'FB_COVER';

const Dashboard: React.FC<DashboardProps> = ({ onGenerate, onDelete, muses, onSaveToN8N }) => {
  // Tabs & Layout State
  const [activeTab, setActiveTab] = useState<TabView>('GENERATOR');
  
  // Generator State
  const [inputs, setInputs] = useState<DashboardInputs>({ niche: '', name: '', details: '' });
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [webhookUrl] = useState(N8N_WEBHOOK_URL);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Social Studio State
  const [selectedMuseId, setSelectedMuseId] = useState<string>('');
  const [socialMode, setSocialMode] = useState<SocialMode>('COPYWRITER');
  
  // Copywriter State
  const [postVibe, setPostVibe] = useState<SocialPost['vibe']>('seductive');
  const [generatedPost, setGeneratedPost] = useState<SocialPost | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Visual Studio State
  const [visualType, setVisualType] = useState<VisualAssetType>('STORY');
  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

  // --- UTILS: BRANDING OVERLAY ---
  const applyBranding = (base64Image: string, type: VisualAssetType): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const src = base64Image.startsWith('data:image') ? base64Image : `data:image/png;base64,${base64Image}`;
      img.src = src;
      img.crossOrigin = "Anonymous";

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(src); return; }

        ctx.drawImage(img, 0, 0);

        const fontSize = Math.floor(canvas.width * 0.035); 
        ctx.font = `900 ${fontSize}px "Playfair Display", serif`;
        
        const textMain = "LUMIÈRE";
        const textDot = ".";
        
        const mainMetrics = ctx.measureText(textMain);
        const dotMetrics = ctx.measureText(textDot);
        const totalWidth = mainMetrics.width + dotMetrics.width;

        let startX = 0;
        let startY = 0;
        const paddingY = canvas.height * 0.05;
        const paddingX = canvas.width * 0.05;

        if (type === 'FB_COVER') {
           startX = canvas.width - totalWidth - paddingX;
           startY = canvas.height - paddingY;
        } else {
           startX = (canvas.width - totalWidth) / 2;
           startY = canvas.height - paddingY;
        }

        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = fontSize / 3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = '#F5F5F0';
        ctx.fillText(textMain, startX, startY);

        ctx.fillStyle = '#D4AF37';
        ctx.fillText(textDot, startX + mainMetrics.width, startY);

        resolve(canvas.toDataURL('image/png', 0.9));
      };
      
      img.onerror = () => {
          console.error("Erro ao carregar imagem para branding");
          resolve(src);
      };
    });
  };

  // --- GENERATOR LOGIC ---
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
      addLog(`Otimizando imagens para envio (evita erros 413/500)...`);
      
      try {
          const optimizedCover = await compressImage(muse.cover_url);
          const optimizedImages = await Promise.all(muse.gallery_urls.map(img => compressImage(img)));
          
          const payload = { 
             ...muse, 
             cover_url: optimizedCover, 
             gallery_urls: optimizedImages,
             type: 'profile_backup' // Identificador para o n8n
          };

          addLog(`Enviando dados para n8n (${muse.name})...`);
          
          const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

          await onSaveToN8N(muse);
          addLog(`SUCESSO TOTAL: ${muse.name} enviado para processamento.`);

      } catch (e: any) {
          console.error("Erro n8n:", e);
          addLog(`FALHA NO ENVIO: ${e.message}.`);
      } finally {
          setPublishing(null);
      }
  };

  const generateRandomPersona = async () => {
    setLoading(true);
    addLog("Ativando Gerador High-Ticket (CPM)...");
    
    // Lista focada em Alto CPM (AdSense)
    const highCpmNiches = [
        "Insurance Claims", "Structured Settlements", "Cryptocurrency Trading", "Business Software (SaaS)",
        "Mesothelioma Law", "Luxury Real Estate", "Online Banking & Credit", "Web Hosting Services",
        "MBA & Higher Education", "Rehab & Wellness", "Corporate Law", "Forex Trading", "Cybersecurity"
    ];

    const ethnicities = ["Brazilian Mixed", "Japanese", "Afro-Brazilian", "Scandinavian", "Italian", "Korean", "Colombian", "Russian", "Latina", "Middle Eastern"];
    const bodyTypes = ["Slim & Toned", "Curvy Hourglass", "Athletic", "Tall & Slender", "Voluminous", "Petite", "Fit"];
    // Vibes atualizadas para "Sexy, Sassy, Sensual"
    const vibes = ["Sassy & Confident", "Sensual & Elegant", "Sexy & Intellectual", "Bold & Provocative", "Sultry & Mysterious", "High-Maintenance & Glam"];
    const facialFeatures = ["Freckles", "Mole on cheek", "Sharp jawline", "Full lips", "Dimples", "Cat eyes", "Heterochromia", "Gap teeth", "Glossy lips", "Piercing gaze"];
    
    const existingNames = muses.map(m => m.name).join(", ");

    const randomNiche = highCpmNiches[Math.floor(Math.random() * highCpmNiches.length)];
    const randomEthnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)];
    const randomBody = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
    const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];
    const randomFace = facialFeatures[Math.floor(Math.random() * facialFeatures.length)];
    const randomAge = Math.floor(Math.random() * (35 - 21 + 1)) + 21;

    const physicalPrompt = `Stunning WOMAN, ${randomAge} years old. 
    Ethnicity: ${randomEthnicity}. 
    Body Type: ${randomBody}.
    Distinctive Feature: ${randomFace}.
    Vibe: ${randomVibe} (Sexy, Sassy, Sensual).
    Overall: Highly attractive, confident, photogenic female model.`;

    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const prompt = `Generate a JSON profile for a Social Media Model.
      NICHE: ${randomNiche} (Must be high paying AdSense niche).
      VIBE: ${randomVibe}.
      CONSTRAINT: Do NOT use these names: [${existingNames}]. Create a UNIQUE, elegant female name.
      Output JSON ONLY: {"name": "Unique Name", "niche": "${randomNiche}", "details": "${physicalPrompt}"}`;
      
      const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json" } });
      const data = cleanAndParseJSON(result.text || "{}");
      setInputs({ name: data.name, niche: data.niche, details: physicalPrompt });
      addLog(`DNA Gerado: ${data.name} | ${randomNiche} | ${randomVibe}`);
    } catch (error) { 
      console.error(error); 
      setInputs({ name: "Eve", niche: "Crypto Wealth", details: physicalPrompt }); 
      addLog("IA ocupada, usando dados padrão.");
    } finally { setLoading(false); }
  };

  // --- HELPER PARA GERAR IMAGEM COM RETRY E FALLBACK ---
  const generateSafeImage = async (ai: GoogleGenAI, prompt: string, fallbackUrl: string): Promise<string> => {
      try {
          // Tentativa 1: Prompt Completo (Sexy/Sassy)
          const res = await ai.models.generateContent({
             model: "gemini-2.5-flash-image",
             contents: prompt,
             config: { imageConfig: { aspectRatio: "3:4" } }
          });
          
          const b64 = res.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
          if (b64) return `data:image/png;base64,${b64}`;
          
          throw new Error("Safety Block or Error");
      } catch (e) {
          console.warn("Tentativa 1 falhou (Segurança/Erro). Tentando prompt suave...");
          try {
              // Tentativa 2: Prompt Seguro (Removendo palavras arriscadas mas mantendo beleza)
              const safePrompt = prompt
                  .replace(/sexy|sassy|sensual|hot|sultry|lingerie|cleavage/gi, "elegant, confident, fashion model")
                  .replace(/bed|bedroom/gi, "luxury sofa");
                  
              const res2 = await ai.models.generateContent({
                  model: "gemini-2.5-flash-image",
                  contents: `High quality vogue editorial of ${safePrompt}`,
                  config: { imageConfig: { aspectRatio: "3:4" } }
              });
              
              const b64_2 = res2.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
              if (b64_2) return `data:image/png;base64,${b64_2}`;
              
              throw new Error("Safety Block 2");
          } catch (e2) {
              console.error("Falha total na geração. Usando imagem de backup.", e2);
              return fallbackUrl;
          }
      }
  };

  const handleGenerate = async () => {
    if (!inputs.niche || !inputs.name || !inputs.details) { addLog("Erro: Preencha todos os campos."); return; }
    setLoading(true); setLogs([]); addLog("Iniciando sessão de fotos...");

    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      addLog("Criando conteúdo OTIMIZADO (SEO High CPM)...");
      
      const textPrompt = `Crie um perfil JSON PREMIUM e OTIMIZADO PARA SEO para "${inputs.name}", especialista em "${inputs.niche}".
      GÊNERO: FEMININO (Mulher de negócios sexy e inteligente).
      Idioma: PT-BR (Português Brasileiro).
      Tom: Sexy, Sassy, Sensual, mas autoridade máxima no assunto financeiro/tech.
      
      REQUISITOS OBRIGATÓRIOS:
      1. "intro": Gancho viral, instigante e provocante.
      2. "bodyParagraphs": 6 a 8 parágrafos LONGOS explicando o nicho (${inputs.niche}) com metáforas sedutoras.
      3. "expertVerdict": Análise profissional de alto nível.
      4. "insiderSecret": Dica técnica valiosa que vale dinheiro.
      5. "faqs": 6 perguntas complexas sobre o nicho.
      6. "keywords": 15 palavras-chave de ALTO CPC (AdSense).
      
      JSON Schema: { "tagline": "", "title": "", "intro": "", "bodyParagraphs": [], "keywords": [], "expertVerdict": "", "faqs": [{"question":"","answer":""}], "insiderSecret": "" }`;

      const textResult = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: textPrompt, config: { responseMimeType: "application/json" } });
      const content = cleanAndParseJSON(textResult.text || "{}");

      addLog("Fotografando capa (Modo Sassy/Sexy)...");
      
      const physicalDesc = inputs.details;
      // Estilo atualizado: Sexy, Sassy, Sensual
      const styleKeywords = "Masterpiece, 8k, photorealistic, cinematic lighting, sexy, sassy, sensual, confident expression, fujifilm color science, detailed skin, vogue editorial, soft focus background.";
      const genderEnforcedDetails = `STUNNING FEMALE WOMAN, ${physicalDesc}`;
      
      // Prompt da Capa: Garante contexto de luxo
      const coverPrompt = `Medium shot fashion portrait of a ${genderEnforcedDetails}. 
      CONTEXT: Posing in a luxury environment related to ${inputs.niche} (e.g., high-end office, private jet, luxury server room, penthouse), blurred background.
      CLOTHING: Stylish, form-fitting, elegant but provocative business attire.
      STYLE: ${styleKeywords}`;
      
      // Fallbacks do Unsplash de alta qualidade (caso tudo falhe)
      const fallbacks = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000",
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000",
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=1000",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1000"
      ];
      
      const coverImage = await generateSafeImage(ai, coverPrompt, fallbacks[0]);

      addLog("Produzindo editorial completo (9 Fotos)...");
      
      const galleryImages = [coverImage];
      
      // Cenários variados para garantir 9 fotos distintas e sensuais
      const allScenarios = [
        "Sitting on a velvet sofa, holding a glass of champagne, legs crossed, seductive gaze",
        "Walking in a modern glass office building, looking back over shoulder, sassy smile",
        "Close up portrait, biting lip slightly, intense eye contact, messy hair",
        "Working on a laptop in lingerie and a silk robe, luxury apartment view, morning light",
        "Leaning against a luxury car, evening gown, confident stance, paparazzi flash style",
        "In a high-end restaurant, holding a menu, looking flirtatious, dim romantic lighting",
        "Bedroom vanity scene, applying lipstick, mirror reflection, intimate atmosphere",
        "Relaxing by a rooftop pool, swimsuit and sheer cover-up, golden hour glow",
        "Shopping in a designer boutique, holding bags, looking powerful and rich",
        "Walking away from camera, showing silhouette, mysterious and alluring"
      ];

      for (const scenario of allScenarios) {
        if (galleryImages.length >= 9) break; // Garante 9 imagens (Capa + 8)
        try {
           const prompt = `Photo of ${genderEnforcedDetails}. 
           CONTEXT: ${scenario}. 
           STYLE: ${styleKeywords} --consistent with cover model`;
           
           const imgUrl = await generateSafeImage(
               ai, 
               prompt, 
               fallbacks[galleryImages.length % fallbacks.length] // Revezar fallbacks se necessário
           );
           
           if (imgUrl && !galleryImages.includes(imgUrl)) {
             galleryImages.push(imgUrl);
             addLog(`Foto ${galleryImages.length}/9 revelada.`);
           }
        } catch (e) { console.error("Erro foto extra", e); }
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

  // --- SOCIAL STUDIO LOGIC (COPYWRITER) ---

  const handleGeneratePost = async () => {
    const muse = muses.find(m => m.id === selectedMuseId);
    if (!muse) {
      alert("Selecione uma Musa primeiro.");
      return;
    }

    setSocialLoading(true);
    setCopied(false);

    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      
      const vibePrompts = {
        seductive: "Foco total na TENSÃO SEXUAL implícita. Descreva a cena de forma sensorial: o cheiro, o toque na pele, o olhar devorador, a respiração ofegante. Use duplo sentido elegante. O leitor deve sentir que ela está convidando-o para algo proibido, mas sem usar palavras vulgares.",
        story: "Crie uma narrativa curta sobre um 'momento privado' ou uma fantasia secreta que ela realizou. Algo que aconteceu a portas fechadas em um hotel de luxo ou viagem. O tom deve ser confesional e picante.",
        insider: "Uma confissão íntima e sussurrada. Algo que ela 'só conta para quem é VIP'. Misture o sucesso financeiro dela com a liberdade sexual. 'O segredo do meu sucesso e do meu prazer'.",
        sales: "Tom de DOMINAÇÃO e exclusividade. Desafie a masculinidade ou o desejo do leitor. 'Você aguentaria?', 'Só para homens decididos'. Use a escassez do conteúdo adulto dela para gerar o clique imediato."
      };

      const systemPrompt = `Você é um Copywriter Especialista em Conteúdo Adulto/Sensual para redes sociais (Facebook/Instagram), focado em alta conversão.
      
      SUA MISSÃO: Criar um texto ALTAMENTE ENIGMÁTICO e SEXUAL para a modelo "${muse.name}".
      
      DADOS:
      Nicho: ${muse.niche}
      Intro: ${muse.intro}
      
      OBJETIVO DO POST: ${vibePrompts[postVibe]}
      
      REGRAS CRÍTICAS DE SEGURANÇA (Anti-Ban):
      1. NÃO use palavras explícitas proibidas (sexo, penetração, vagina, pênis, nudez). O Facebook bane isso.
      2. USE LINGUAGEM SENSORIAL: Calor, umidade, arrepio, toque, curvas, proibido, sem censura, nua (metaforicamente), profundo, intenso.
      3. GATILHOS: Curiosidade extrema ("O que você não vê aqui..."), Exclusividade ("Só no privado"), Urgência.
      4. ESTRUTURA:
         - Gancho curto e impactante (uma frase).
         - Corpo sensorial e provocante (2-3 frases curtas).
         - CTA (Chamada para ação) IMPERATIVA no final mandando clicar no link.
      
      IMPORTANTE: O texto deve fazer o usuário pensar em sexo sem você escrever a palavra sexo.
      
      Saída: Apenas o texto do post.`;

      const result = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: systemPrompt });
      const text = result.text || "";
      const profileLink = `${window.location.origin}/?id=${muse.id}`;

      setGeneratedPost({
        museId: muse.id,
        text: text,
        imageUrl: muse.cover_url,
        link: profileLink,
        vibe: postVibe
      });

    } catch (e) {
      console.error(e);
      alert("Erro ao gerar post. Tente novamente.");
    } finally {
      setSocialLoading(false);
    }
  };

  const handlePostToN8N = async () => {
    if (!generatedPost) return;
    
    setSocialLoading(true);
    try {
       const optimizedImage = await compressImage(generatedPost.imageUrl, 0.7);

       const payload = {
         type: 'facebook_publish', 
         content: {
           message: generatedPost.text,
           link: generatedPost.link,
           url: generatedPost.link, 
           image_url: optimizedImage 
         },
         muse_name: muses.find(m => m.id === generatedPost.museId)?.name
       };

       const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
       });

       if (!response.ok) throw new Error("Falha na comunicação com n8n");
       
       alert("Enviado para n8n com sucesso! Verifique seu fluxo.");
    } catch (e: any) {
       alert(`Erro ao enviar: ${e.message}`);
    } finally {
       setSocialLoading(false);
    }
  };

  // --- VISUAL STUDIO LOGIC (ART DIRECTOR) ---
  
  const handleGenerateVisual = async () => {
    const muse = muses.find(m => m.id === selectedMuseId);
    if (!muse) {
      alert("Selecione uma Musa primeiro.");
      return;
    }
    
    setSocialLoading(true);
    setGeneratedVisual(null);

    try {
       const ai = new GoogleGenAI({ apiKey: getApiKey() });
       
       let aspectRatio = "1:1";
       let contextPrompt = "";
       
       switch(visualType) {
         case 'FB_COVER':
           aspectRatio = "16:9";
           contextPrompt = "Wide cinematic shot, luxury bedroom or penthouse background with lots of negative space on one side for text. The model is relaxing on a sofa or bed in the distance, looking mysterious. Warm, dim lighting, elegant atmosphere.";
           break;
         case 'STORY':
           aspectRatio = "9:16";
           contextPrompt = "Vertical POV shot (Point of View), very intimate and immersive. Maybe a mirror selfie perspective or looking down at her own legs/outfit. Suggestive, 'behind the scenes' vibe, getting ready for a night out. High fashion, blurred background.";
           break;
         case 'FEED':
           aspectRatio = "3:4";
           contextPrompt = "High-end editorial fashion shot, medium shot. Focusing on curves and silhouette. Dramatic lighting (chiaroscuro), moody, highly detailed texture of skin and fabric. Looks like a Vogue photoshoot.";
           break;
         case 'PROFILE':
           aspectRatio = "1:1";
           contextPrompt = "Extreme close-up Portrait. Intense eye contact, slightly parted lips, alluring expression. Studio lighting highlighting facial features. The face of a goddess.";
           break;
       }

       const fullPrompt = `Photo of ${muse.name}, ${muse.physical_description}. 
       CONTEXT: ${contextPrompt}. 
       STYLE: 8k resolution, raw photo, photorealistic, cinematic lighting, soft focus, film grain, Fujifilm XT-4 style, masterpiece. 
       IMPORTANT: Highly attractive, sultry, enigmatic.`;

       const result = await ai.models.generateContent({
         model: "gemini-2.5-flash-image",
         contents: fullPrompt,
         config: {
           imageConfig: { aspectRatio: aspectRatio as any }
         }
       });

       const b64 = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
       if (!b64) throw new Error("Imagem não gerada");
       
       const brandedImage = await applyBranding(b64, visualType);
       setGeneratedVisual(brandedImage);

    } catch(e) {
      console.error(e);
      alert("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setSocialLoading(false);
    }
  };
  
  const downloadImage = () => {
     if(!generatedVisual) return;
     const link = document.createElement('a');
     link.href = generatedVisual;
     link.download = `lumiere_${selectedMuseId}_${visualType}.png`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    if (!generatedPost) return;
    const fullText = `${generatedPost.text}\n\n🔗 ${generatedPost.link}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pt-24">
       
       <div className="max-w-6xl mx-auto mb-8 flex border-b border-white/10">
         <button 
           onClick={() => setActiveTab('GENERATOR')}
           className={`px-6 py-4 font-bold text-sm uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'GENERATOR' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-gray-500 hover:text-white'}`}
         >
           <Wand2 size={18} /> Perfis & IA
         </button>
         <button 
           onClick={() => setActiveTab('SOCIAL')}
           className={`px-6 py-4 font-bold text-sm uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'SOCIAL' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-gray-500 hover:text-white'}`}
         >
           <Megaphone size={18} /> Social & Visual
         </button>
       </div>

       <div className="max-w-6xl mx-auto">
          
          {activeTab === 'GENERATOR' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              <div className="space-y-6">
                <div className="bg-gray-900 p-6 rounded-xl border border-white/10">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Wand2 className="text-yellow-600"/> Criar Nova Musa</h2>
                    <div className="space-y-4">
                      <input value={inputs.niche} onChange={e => setInputs({...inputs, niche: e.target.value})} placeholder="Nicho (ex: Luxo, Cripto)" className="w-full bg-black/50 border border-white/10 p-3 rounded text-white" />
                      <input value={inputs.name} onChange={e => setInputs({...inputs, name: e.target.value})} placeholder="Nome" className="w-full bg-black/50 border border-white/10 p-3 rounded text-white" />
                      <textarea value={inputs.details} onChange={e => setInputs({...inputs, details: e.target.value})} placeholder="Detalhes Físicos" className="w-full bg-black/50 border border-white/10 p-3 rounded text-white h-24" />
                    </div>
                    <div className="flex gap-4 mt-6">
                      <button onClick={handleGenerate} disabled={loading} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 rounded flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin"/> : <Wand2 size={18} />} Gerar Perfil
                      </button>
                      <button onClick={generateRandomPersona} disabled={loading} className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded" title="Gerar Random (High CPM)"><Wand2 size={18}/></button>
                      <div className="relative overflow-hidden bg-gray-800 hover:bg-gray-700 text-white p-3 rounded cursor-pointer" title="Upload JSON">
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
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><LayoutDashboard className="text-yellow-600"/> Banco de Talentos</h2>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {muses.length === 0 && <p className="text-gray-500 text-center py-10">Nenhum perfil criado.</p>}
                    {muses.map(muse => (
                      <div key={muse.id} className="flex items-center gap-4 bg-black/30 p-3 rounded border border-white/5 hover:border-white/20 transition-colors">
                          <img src={muse.cover_url} className="w-12 h-12 rounded object-cover" alt={muse.name}/>
                          <div className="flex-1">
                            <a 
                               href={`/?id=${muse.id}`} 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="font-bold hover:text-yellow-600 transition-colors block"
                            >
                                {muse.name}
                            </a>
                            <div className="text-xs text-gray-400">{muse.niche}</div>
                          </div>
                          <button onClick={() => handleSaveClick(muse)} disabled={!!publishing} className="text-blue-400 hover:text-blue-300 p-2" title="Backup n8n">
                            {publishing === muse.id ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
                          </button>
                          <button onClick={() => onDelete(muse.id)} className="text-red-400 hover:text-red-300 p-2" title="Excluir">
                            <Trash2 size={18}/>
                          </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SOCIAL' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-center gap-4">
                  <button onClick={() => setSocialMode('COPYWRITER')} className={`px-6 py-2 rounded-full font-bold uppercase tracking-wider text-xs border ${socialMode === 'COPYWRITER' ? 'bg-white text-black border-white' : 'text-gray-500 border-gray-700 hover:border-white'}`}>
                      Redator (Copy)
                  </button>
                  <button onClick={() => setSocialMode('ART_DIRECTOR')} className={`px-6 py-2 rounded-full font-bold uppercase tracking-wider text-xs border ${socialMode === 'ART_DIRECTOR' ? 'bg-white text-black border-white' : 'text-gray-500 border-gray-700 hover:border-white'}`}>
                      Diretor de Arte (Visual)
                  </button>
              </div>

              {socialMode === 'COPYWRITER' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <div className="bg-gray-900 p-6 rounded-xl border border-white/10">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Megaphone className="text-yellow-600"/> Configuração do Post</h2>
                        <div className="space-y-6">
                           <div>
                              <label className="block text-xs font-bold uppercase text-gray-500 tracking-widest mb-2">Selecione o Talento</label>
                              <select 
                                 value={selectedMuseId} 
                                 onChange={(e) => setSelectedMuseId(e.target.value)}
                                 className="w-full bg-black/50 border border-white/10 p-3 rounded text-white focus:border-yellow-600 focus:outline-none"
                              >
                                 <option value="">-- Escolha uma Musa --</option>
                                 {muses.map(m => <option key={m.id} value={m.id}>{m.name} ({m.niche})</option>)}
                              </select>
                           </div>

                           <div>
                              <label className="block text-xs font-bold uppercase text-gray-500 tracking-widest mb-2">Objetivo (Vibe)</label>
                              <div className="grid grid-cols-2 gap-2">
                                 {[
                                   { id: 'seductive', label: '🔥 Sedutor', desc: 'Tensão sexual implícita' },
                                   { id: 'story', label: '📖 Fantasia', desc: 'Narrativa privada/proibida' },
                                   { id: 'insider', label: '🤫 Confissão', desc: 'Segredo sussurrado' },
                                   { id: 'sales', label: '⛓️ Dominação', desc: 'Desafio e comando' },
                                 ].map((opt) => (
                                    <button
                                       key={opt.id}
                                       onClick={() => setPostVibe(opt.id as any)}
                                       className={`p-3 rounded text-left border transition-all ${postVibe === opt.id ? 'bg-yellow-600/20 border-yellow-600 text-white' : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5'}`}
                                    >
                                       <div className="font-bold text-sm">{opt.label}</div>
                                       <div className="text-[10px] opacity-70">{opt.desc}</div>
                                    </button>
                                 ))}
                              </div>
                           </div>

                           <button 
                              onClick={handleGeneratePost} 
                              disabled={socialLoading || !selectedMuseId}
                              className={`w-full py-4 rounded font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${!selectedMuseId ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                           >
                              {socialLoading ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />} Gerar Post Enigmático
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="bg-[#18191a] p-4 rounded-xl border border-[#3e4042] min-h-[400px]">
                        <div className="flex items-center gap-2 mb-4 text-[#b0b3b8]">
                           <Facebook size={20} className="text-[#1877f2]" /> 
                           <span className="text-xs font-bold">Prévia do Facebook</span>
                        </div>

                        {!generatedPost ? (
                           <div className="h-64 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-[#3e4042] rounded">
                              <p>Selecione um perfil e gere o post.</p>
                           </div>
                        ) : (
                           <div className="bg-[#242526] rounded-lg overflow-hidden shadow-lg animate-fade-in">
                              <div className="p-3 flex items-center gap-2">
                                 <img src={generatedPost.imageUrl} className="w-10 h-10 rounded-full object-cover border border-[#3e4042]" />
                                 <div>
                                    <h4 className="text-[#e4e6eb] font-bold text-sm">{muses.find(m => m.id === generatedPost.museId)?.name}</h4>
                                    <p className="text-[#b0b3b8] text-xs flex items-center gap-1">Patrocinado • <span className="text-[10px]">🌐</span></p>
                                 </div>
                              </div>
                              <div className="px-3 pb-3 text-[#e4e6eb] text-sm whitespace-pre-wrap font-medium">
                                 {generatedPost.text}
                              </div>
                              <div className="bg-black relative group cursor-pointer">
                                 <img src={generatedPost.imageUrl} className="w-full h-64 object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity" />
                                 <div className="bg-[#3a3b3c] p-3 border-t border-[#3e4042]">
                                    <p className="text-[#b0b3b8] text-xs uppercase">LUMIERE.APP</p>
                                    <h3 className="text-[#e4e6eb] font-bold truncate">Conteúdo Privado: {muses.find(m => m.id === generatedPost.museId)?.niche}</h3>
                                    <p className="text-[#b0b3b8] text-xs truncate">Acesso liberado apenas para maiores...</p>
                                 </div>
                              </div>
                              <div className="px-3 py-2 border-t border-[#3e4042] flex justify-between text-[#b0b3b8] text-sm font-medium">
                                 <button className="flex-1 flex justify-center items-center gap-2 py-2 hover:bg-[#3a3b3c] rounded">Curtir</button>
                                 <button className="flex-1 flex justify-center items-center gap-2 py-2 hover:bg-[#3a3b3c] rounded">Comentar</button>
                                 <button className="flex-1 flex justify-center items-center gap-2 py-2 hover:bg-[#3a3b3c] rounded">Compartilhar</button>
                              </div>
                           </div>
                        )}
                     </div>

                     {generatedPost && (
                        <div className="flex gap-4">
                           <button 
                              onClick={copyToClipboard}
                              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors"
                           >
                              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />} 
                              {copied ? 'Copiado!' : 'Copiar Texto'}
                           </button>
                           <button 
                              onClick={handlePostToN8N}
                              disabled={socialLoading}
                              className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors"
                           >
                              {socialLoading ? <Loader2 className="animate-spin" size={16} /> : <Share2 size={16} />} Disparar (n8n)
                           </button>
                        </div>
                     )}
                  </div>
                </div>
              )}

              {socialMode === 'ART_DIRECTOR' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <div className="bg-gray-900 p-6 rounded-xl border border-white/10">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><ImageIcon className="text-yellow-600"/> Estúdio Visual</h2>
                        <div className="space-y-6">
                           <div>
                              <label className="block text-xs font-bold uppercase text-gray-500 tracking-widest mb-2">Selecione o Talento</label>
                              <select 
                                 value={selectedMuseId} 
                                 onChange={(e) => setSelectedMuseId(e.target.value)}
                                 className="w-full bg-black/50 border border-white/10 p-3 rounded text-white focus:border-yellow-600 focus:outline-none"
                              >
                                 <option value="">-- Escolha uma Musa --</option>
                                 {muses.map(m => <option key={m.id} value={m.id}>{m.name} ({m.niche})</option>)}
                              </select>
                           </div>

                           <div>
                              <label className="block text-xs font-bold uppercase text-gray-500 tracking-widest mb-2">Formato do Ativo</label>
                              <div className="grid grid-cols-2 gap-2">
                                 {[
                                   { id: 'FB_COVER', label: 'Capa Facebook', icon: <Facebook size={16}/>, desc: '16:9 • Cinematic' },
                                   { id: 'STORY', label: 'Instagram Story', icon: <Instagram size={16}/>, desc: '9:16 • Imersivo/POV' },
                                   { id: 'FEED', label: 'Instagram Feed', icon: <Camera size={16}/>, desc: '3:4 • Editorial' },
                                   { id: 'PROFILE', label: 'Foto Perfil', icon: <Wand2 size={16}/>, desc: '1:1 • Close-up' },
                                 ].map((opt) => (
                                    <button
                                       key={opt.id}
                                       onClick={() => setVisualType(opt.id as VisualAssetType)}
                                       className={`p-3 rounded text-left border transition-all flex flex-col gap-1 ${visualType === opt.id ? 'bg-yellow-600/20 border-yellow-600 text-white' : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5'}`}
                                    >
                                       <div className="flex items-center gap-2 font-bold text-sm">{opt.icon} {opt.label}</div>
                                       <div className="text-[10px] opacity-70 ml-6">{opt.desc}</div>
                                    </button>
                                 ))}
                              </div>
                           </div>

                           <button 
                              onClick={handleGenerateVisual} 
                              disabled={socialLoading || !selectedMuseId}
                              className={`w-full py-4 rounded font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${!selectedMuseId ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}
                           >
                              {socialLoading ? <Loader2 className="animate-spin" /> : <ImageIcon size={18} />} Gerar Ativo Visual
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="bg-[#18191a] p-4 rounded-xl border border-[#3e4042] flex flex-col items-center justify-center min-h-[500px]">
                      {!generatedVisual ? (
                         <div className="text-gray-500 flex flex-col items-center">
                            <ImageIcon size={48} className="mb-4 opacity-50"/>
                            <p>O Estúdio está vazio. Gere uma imagem.</p>
                         </div>
                      ) : (
                         <div className="w-full flex flex-col items-center animate-fade-in">
                            <div className="relative mb-6 shadow-2xl border border-white/10 rounded overflow-hidden">
                               <img 
                                 src={generatedVisual} 
                                 className="max-h-[500px] object-contain" 
                                 style={{ aspectRatio: visualType === 'FB_COVER' ? '16/9' : visualType === 'STORY' ? '9/16' : visualType === 'FEED' ? '3/4' : '1/1' }}
                                 alt="Generated Asset" 
                               />
                            </div>
                            <button 
                               onClick={downloadImage}
                               className="bg-green-600 hover:bg-green-500 text-white py-3 px-8 rounded font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg"
                            >
                               <Download size={18} /> Salvar Imagem
                            </button>
                         </div>
                      )}
                  </div>
                </div>
              )}

            </div>
          )}

       </div>
    </div>
  );
};
export default Dashboard;