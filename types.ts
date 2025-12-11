import React from 'react';

export type ViewState = 'HOME' | 'PROFILE' | 'DASHBOARD';

export interface MuseProfile {
  id: string;
  name: string;
  niche: string; // High CPM Niche title
  tagline: string;
  coverImage: string;
  physicalDescription?: string; // Used for AI consistency
  images: string[]; // Array of 8 images
  isRemote?: boolean; // True se já estiver publicado no GitHub/Site
  content: {
    title: string;
    intro: string;
    bodyParagraphs: string[]; // Increased to 6 paragraphs for depth
    keywords: string[]; // High CPM keywords to highlight
    expertVerdict: string; // Summary/Conclusion for SEO
    faqs: Array<{ question: string; answer: string }>; // For Google Featured Snippets
    insiderSecret: string; // High CTR Box content
  };
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