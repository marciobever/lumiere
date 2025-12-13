export const updateMetaTags = (title: string, description: string, image: string) => {
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

export const cleanAndParseJSON = (text: string) => {
  try {
    let clean = text.replace(/```json/g, '').replace(/```/g, '');
    clean = clean.replace(/\*\*/g, ''); 
    return JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse JSON", e);
    return {};
  }
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const compressImage = (base64Str: string, quality = 0.8): Promise<string> => {
  if (!base64Str || base64Str.startsWith('http') || base64Str.startsWith('https')) return Promise.resolve(base64Str || ''); 
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = base64Str;
    img.onload = () => {
      try {
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
      } catch (e) {
        // Fallback for tainted canvas (SecurityError) or other canvas errors
        console.warn("Canvas compression failed, returning original.", e);
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};