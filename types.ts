import React from 'react';

export type ViewState = 'HOME' | 'PROFILE' | 'DASHBOARD';

export interface MuseProfile {
  id: string;
  slug: string; // URL slug for routing
  name: string;
  niche: string; // High CPM Niche
  tagline: string;
  
  // Editorial Content (Flattened structure)
  title: string;
  intro: string;
  body: string; // Long text string (paragraphs joined with \n)
  expert_verdict: string;
  insider_secret: string;
  
  // Physical details
  physical_description: string;
  
  // Images (Supabase Storage or Base64)
  cover_url: string; 
  gallery_urls: string[]; // Array of strings
  
  // Metadata
  is_remote: boolean; // True if fetched from Supabase
  
  // Extras (Optional, can be extracted from profile_data jsonb if needed)
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