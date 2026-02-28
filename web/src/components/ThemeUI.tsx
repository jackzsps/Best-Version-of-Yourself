import React from 'react';
import { Icon } from './Icons';
import { Theme, UsageCategory } from '@shared/types';

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
    className='w-full p-2 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-ink font-typewriter focus:outline-none appearance-none text-lg'
  >
    {props.children}
  </select>
);

export const VintageTextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className='w-full p-2 bg-transparent border-2 border-dashed border-vintage-line font-typewriter text-sm text-vintage-ink focus:outline-none focus:border-vintage-ink rounded-sm resize-none'
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
    className='w-full px-4 py-3 rounded-2xl bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-100 appearance-none transition-all border-none'
  >
    {props.children}
  </select>
);

export const BentoTextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className='w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-100 font-sans text-gray-900 resize-none font-semibold'
  />
);

// --- Bottom Sheet Select ---

export interface BottomSheetOption {
  value: string;
  label: string;
}

export interface BottomSheetSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: BottomSheetOption[];
  placeholder?: string;
  className?: string;
  title?: string;
}

const BottomSheetStyles = () => (
  <style>{`
    @keyframes slide-up-fast {
      0% { transform: translateY(100%); }
      100% { transform: translateY(0); }
    }
    @keyframes fade-in-fast {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    .animate-slide-up-fast { animation: slide-up-fast 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
  `}</style>
);

const BaseBottomSheet = ({ isOpen, onClose, children, title, isVintage }: { isOpen: boolean, onClose: () => void, children: React.ReactNode, title?: string, isVintage?: boolean }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <BottomSheetStyles />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in-fast" onClick={onClose} />
      <div className={`relative w-full max-h-[80vh] overflow-y-auto transform transition-transform animate-slide-up-fast ${isVintage ? 'bg-vintage-paper border-t-8 border-vintage-ink rounded-t-xl p-6 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]' : 'bg-white rounded-t-[2rem] p-6 shadow-2xl'}`}>
        <div className={`flex justify-between items-center mb-6 sticky top-0 z-10 pb-2 ${isVintage ? 'bg-vintage-paper' : 'bg-white'}`}>
          {title ? <h3 className={`text-xl font-bold ${isVintage ? 'font-typewriter text-vintage-ink' : 'text-gray-900'}`}>{title}</h3> : <div></div>}
          <button type="button" onClick={onClose} className={`p-2 rounded-full ${isVintage ? 'text-vintage-ink hover:bg-vintage-leather/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="pb-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export const BentoBottomSheetSelect = ({ value, onChange, options, placeholder, className, title }: BottomSheetSelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full px-4 py-3 rounded-2xl bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all border-none flex justify-between items-center text-left ${className || ''}`}
      >
        <span>{selectedOption ? selectedOption.label : (placeholder || 'Select...')}</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /></svg>
      </button>

      <BaseBottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title={title}>
        <div className="flex flex-col gap-2">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full p-4 rounded-[1rem] text-left font-bold transition-all flex items-center justify-between ${value === option.value ? 'bg-brand-50 text-brand-600 ring-2 ring-brand-100' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-brand-500"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
              )}
            </button>
          ))}
        </div>
      </BaseBottomSheet>
    </>
  );
};

export const VintageBottomSheetSelect = ({ value, onChange, options, placeholder, className, title }: BottomSheetSelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full p-2 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-ink font-typewriter focus:outline-none text-lg flex justify-between items-center text-left ${className || ''}`}
      >
        <span>{selectedOption ? selectedOption.label : (placeholder || 'Select...')}</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-vintage-leather/50"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
      </button>

      <BaseBottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title={title} isVintage>
        <div className="flex flex-col gap-3">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full p-4 rounded-none text-left font-bold transition-all flex items-center justify-between border-2 ${value === option.value ? 'border-vintage-ink bg-vintage-ink/5 text-vintage-ink shadow-[4px_4px_0px_rgba(44,36,27,1)]' : 'border-vintage-line text-vintage-leather hover:bg-vintage-line/10'}`}
            >
              <span className="font-typewriter text-xl">{option.label}</span>
              {value === option.value && (
                <span className="font-typewriter text-vintage-ink text-2xl font-black">X</span>
              )}
            </button>
          ))}
        </div>
      </BaseBottomSheet>
    </>
  );
};

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
      <div className='relative w-full'>
        <input
          type='date'
          value={value}
          onChange={onChange}
          className='w-full p-2 pr-10 rounded-none border-b-2 border-vintage-line bg-transparent text-vintage-ink font-handwriting text-2xl focus:outline-none focus:border-vintage-ink transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full cursor-pointer'
        />
        <Icon name='calendar' className='absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 text-vintage-leather pointer-events-none' />
      </div>
    );
  }

  return (
    <div className='relative w-full'>
      <input
        type='date'
        value={value}
        onChange={onChange}
        className='w-full px-4 py-3 pr-10 rounded-2xl bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all border-none appearance-none min-h-[3rem] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full cursor-pointer'
      />
      <Icon name='calendar' className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none' />
    </div>
  );
};

// --- Helper Styles ---

export const getUsagePillStyle = (u: UsageCategory, isSelected: boolean, theme: Theme) => {
  const isVintage = theme === 'vintage';

  if (isVintage) {
    if (!isSelected) return 'text-vintage-leather/50 border-vintage-line';
    switch (u) {
      case 'must': return 'text-vintage-stamp border-vintage-stamp bg-vintage-stamp/10 font-bold';
      case 'need': return 'text-vintage-ink border-vintage-ink bg-vintage-ink/10 font-bold';
      case 'want': return 'text-amber-800 border-amber-800 bg-amber-800/10 font-bold';
      default: return '';
    }
  }

  if (!isSelected) return 'bg-gray-100 text-gray-400 hover:bg-gray-200 border-transparent';
  switch (u) {
    case 'must': return 'bg-rose-100 text-rose-600 border-rose-200 ring-1 ring-rose-200';
    case 'need': return 'bg-emerald-100 text-emerald-600 border-emerald-200 ring-1 ring-emerald-200';
    case 'want': return 'bg-violet-100 text-violet-600 border-violet-200 ring-1 ring-violet-200';
    default: return '';
  }
};

export const getUsageBadgeStyle = (u: UsageCategory, theme: Theme) => {
  const isVintage = theme === 'vintage';
  if (isVintage) {
    switch (u) {
      case 'must': return 'text-vintage-stamp border-vintage-stamp';
      case 'need': return 'text-vintage-ink border-vintage-ink';
      case 'want': return 'text-amber-800 border-amber-800';
      default: return 'text-vintage-leather border-vintage-leather';
    }
  }
  switch (u) {
    case 'must': return 'bg-rose-100 text-rose-600';
    case 'need': return 'bg-emerald-100 text-emerald-600';
    case 'want': return 'bg-violet-100 text-violet-600';
    default: return 'bg-gray-100 text-gray-500';
  }
};
