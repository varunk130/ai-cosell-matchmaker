import type { SVGProps } from 'react';

const icon = (d: string) => (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d={d} />
  </svg>
);

export const IconPipeline = icon('M4 6h16M4 12h10M4 18h6');
export const IconPartners = icon('M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M22 19v-1a4 4 0 0 0-3-3.87M16 4.13a3 3 0 0 1 0 5.75');
export const IconImpact = icon('M3 3v18h18M7 15l4-4 3 3 6-7');
export const IconCheck = icon('M20 6 9 17l-5-5');
export const IconAlert = icon('M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z');
export const IconSparkle = icon('M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z');
export const IconMail = icon('M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM22 6l-10 7L2 6');
export const IconArrowLeft = icon('M19 12H5M12 19l-7-7 7-7');
export const IconSend = icon('M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z');
