import React from 'react';
import { CalendarIcon } from './Icons';
import { Theme, UsageCategory } from '../types';

// --- Styled Inputs ---

export const VintageInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props} 
    className={`w-full p-2 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-ink font-handwriting text-2xl placeholder-vintage-leather/40 focus:outline-none focus:border-vintage-ink transition-colors ${props.className || ''}`}
  />
);

export const VintageSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select 
    {...props} 
    className="w-full p-2 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-ink font-typewriter focus:outline-none appearance-none text-lg"
  >
    {props.children}
  </select>
);

export const VintageTextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
   <textarea 
      {...props}
      className="w-full p-2 bg-transparent border-2 border-dashed border-vintage-line font-typewriter text-sm text-vintage-ink focus:outline-none focus:border-vintage-ink rounded-sm resize-none"
   />
);

export const BentoInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props} 
    className={`w-full px-4 py-3 rounded-2xl bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all border-none ${props.className || ''}`}
  />
);

export const BentoSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
   <select 
    {...props} 
    className="w-full px-4 py-3 rounded-2xl bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-100 appearance-none transition-all border-none"
  >
    {props.children}
  </select>
);

export const BentoTextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea 
     {...props}
     className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-100 font-sans text-gray-900 resize-none font-semibold"
  />
);

// --- Theme Date Input ---

export const ThemeDateInput = ({ 
  value, 
  onChange, 
  theme 
}: { 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  theme: Theme 
}) => {
  const isVintage = theme === 'vintage';
  
  if (isVintage) {
    return (
      <div className="relative w-full">
        <input 
          type="date"
          value={value}
          onChange={onChange}
          className="w-full p-2 pr-10 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-ink font-handwriting text-2xl focus:outline-none focus:border-vintage-ink transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full cursor-pointer"
        />
        <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 text-vintage-leather pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <input 
        type="date"
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 pr-10 rounded-2xl bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all border-none appearance-none min-h-[3rem] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full cursor-pointer"
      />
      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
  );
};

// --- Helper Styles ---

export const getUsagePillStyle = (u: UsageCategory, isSelected: boolean, theme: Theme) => {
  const isVintage = theme === 'vintage';
  
  if (isVintage) {
     if (!isSelected) return 'text-vintage-leather/50 border-vintage-line';
     switch(u) {
       case 'must': return 'text-vintage-stamp border-vintage-stamp bg-vintage-stamp/10 font-bold';
       case 'need': return 'text-vintage-ink border-vintage-ink bg-vintage-ink/10 font-bold';
       case 'want': return 'text-amber-800 border-amber-800 bg-amber-800/10 font-bold';
       default: return '';
     }
  }
  
  if (!isSelected) return 'bg-gray-100 text-gray-400 hover:bg-gray-200 border-transparent';
  switch(u) {
     case 'must': return 'bg-rose-100 text-rose-600 border-rose-200 ring-1 ring-rose-200';
     case 'need': return 'bg-emerald-100 text-emerald-600 border-emerald-200 ring-1 ring-emerald-200';
     case 'want': return 'bg-violet-100 text-violet-600 border-violet-200 ring-1 ring-violet-200';
     default: return '';
  }
};

export const getUsageBadgeStyle = (u: UsageCategory, theme: Theme) => {
  const isVintage = theme === 'vintage';
  if (isVintage) {
     switch(u) {
        case 'must': return 'text-vintage-stamp border-vintage-stamp';
        case 'need': return 'text-vintage-ink border-vintage-ink';
        case 'want': return 'text-amber-800 border-amber-800';
        default: return 'text-vintage-leather border-vintage-leather';
     }
  }
  switch(u) {
    case 'must': return 'bg-rose-100 text-rose-600';
    case 'need': return 'bg-emerald-100 text-emerald-600';
    case 'want': return 'bg-violet-100 text-violet-600';
    default: return 'bg-gray-100 text-gray-500';
  }
};
