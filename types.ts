import React from 'react';

export type ViewState = 'HOME' | 'PROFILE' | 'DASHBOARD';

export interface MuseProfile {
  id: string;
  slug: string; // URL slug
  name: string;
  niche: string; // High CPM Niche title
  tagline: string;
  
  // Editorial Content
  title: string;
  intro: string;
  body: string; // Long text string (paragraphs joined)
  expert_verdict: string; // Summary/Conclusion
  insider_secret: string; // High CTR Box content
  
  // Physical/AI details
  physical_description: string;
  
  // Images
  cover_url: string; // Public URL or Base64 (local)
  gallery_urls: string[]; // Array of Public URLs or Base64 (local)
  
  // Metadata
  is_remote: boolean; // True if from Supabase
  
  // Optional extras (kept for local generation/legacy support if needed)
  keywords?: string[]; 
  faqs?: Array<{ question: string; answer: string }>;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface DashboardInputs {
  niche: string;
  name: string;
  details: string;
}