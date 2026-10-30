type P = { size?: number; color?: string };

const base = (size: number) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true,
});

export const ArrowUpRight = ({ size = 16 }: P) => (
  <svg {...base(size)} strokeWidth={2.2}><path d="M7 17L17 7" /><path d="M8 7h9v9" /></svg>
);
export const ArrowRight = ({ size = 18 }: P) => (
  <svg {...base(size)} strokeWidth={2.2}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
);
export const Phone = ({ size = 18 }: P) => (
  <svg {...base(size)}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
);
export const Telegram = ({ size = 18, color = '#229ED9' }: P) => (
  <svg {...base(size)} stroke={color}><path d="M22 3L2 11l7 2 2 7 4-5 5 4z" /><path d="M9 13l13-10" /></svg>
);
export const Shield = ({ size = 28, color = '#1A36D6' }: P) => (
  <svg {...base(size)} stroke={color}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
);
export const Menu = ({ size = 20 }: P) => (
  <svg {...base(size)}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h10" /></svg>
);
export const Close = ({ size = 20 }: P) => (
  <svg {...base(size)}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></svg>
);
export const Globe = ({ size = 18 }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18" /><path d="M12 3a14 14 0 0 0 0 18" /></svg>
);
export const Chevron = ({ size = 14 }: P) => (
  <svg {...base(size)}><path d="M6 9l6 6 6-6" /></svg>
);
export const Check = ({ size = 16 }: P) => (
  <svg {...base(size)} strokeWidth={2.6}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const Clock = ({ size = 15 }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const Mail = ({ size = 15 }: P) => (
  <svg {...base(size)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
);
export const MapPin = ({ size = 16 }: P) => (
  <svg {...base(size)}><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>
);
export const Navigation = ({ size = 16 }: P) => (
  <svg {...base(size)}><path d="M3 11l18-8-8 18-2-8-8-2z" /></svg>
);
export const Download = ({ size = 16 }: P) => (
  <svg {...base(size)}><path d="M12 4v11" /><path d="M7 10l5 5 5-5" /><path d="M5 20h14" /></svg>
);
export const FileText = ({ size = 22 }: P) => (
  <svg {...base(size)}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6" /><path d="M9 17h4" /></svg>
);
