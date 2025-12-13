
export const ADSENSE_PUB_ID = "ca-pub-6058225169212979"; 
export const LOCAL_STORAGE_KEY = 'lumiere_muses_backup_v2';
export const N8N_WEBHOOK_URL = "https://n8n.seureview.com.br/webhook/lumiere"; 
export const SUPABASE_URL = 'https://wdjddlkbudtncskgawgh.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkamRkbGtidWR0bmNza2dhd2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjEzMDgsImV4cCI6MjA2MjI5NzMwOH0.speHlbECXo_IMbMz3AO10C7ubU72kS1kRJNF5LH_Z0w';

export const getApiKey = () => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}
  return process.env.API_KEY || '';
};
