/* eslint-disable react-refresh/only-export-components */
/**
 * Icons with the exact paths of reference/prototype-onboarding-simplycure.html
 * (an older Lucide version: Lucide v1 redrew several of them). Same props as lucide-react.
 * Generated from the reference; Menu and Eye are not in the reference and come from lucide-react.
 * Each icon is the SVG drawing copied from the reference (the `d` attributes), injected as is: to change an icon,
 * replace its drawing, or import the icon of the same name from lucide-react instead.
 */
import type { CSSProperties } from 'react';
export { ArrowUpDown, Eye, Menu } from 'lucide-react';

type Props = { size?: number; strokeWidth?: number; className?: string; fill?: string; style?: CSSProperties };

const icon = (paths: string, defaults: { fill?: string } = {}) =>
  function Icon({ size = 24, strokeWidth = 2, className, fill, style }: Props) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={fill ?? defaults.fill ?? 'none'}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
        style={{ flex: 'none', ...style }}
        dangerouslySetInnerHTML={{ __html: paths }}
      />
    );
  };

export const ArrowLeftToLine = icon(`<path d="M3 19V5m10 1-6 6 6 6M7 12h14"/>`);
export const House = icon(`<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`);
export const UsersRound = icon(`<path d="M18 21a8 8 0 0 0-16 0M10 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/>`);
export const Server = icon(`<path d="M4 2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM4 14h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2zM6 6h.01M6 18h.01"/>`);
export const FileText = icon(`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>`);
export const BookOpen = icon(`<path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>`);
export const Copy = icon(`<path d="M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2zM4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`);
export const Store = icon(`<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4M2 7h20M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>`);
export const Package = icon(`<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.3 7 12 12l8.7-5M12 22V12"/>`);
export const HandCoins = icon(`<path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16M7 20l1.6 1.4c.3.4.8.6 1.4.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9M2 15l6 6M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0 0 16 4a2.78 2.78 0 0 0-5 1.8c0 1.2.8 2 1.5 2.8L16 12z"/>`);
export const Crown = icon(`<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294zM5 21h14"/>`);
export const Megaphone = icon(`<path d="M3 11l18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6"/>`);
export const ChevronUp = icon(`<path d="m18 15-6-6-6 6"/>`);
export const Check = icon(`<path d="M20 6 9 17l-5-5"/>`);
export const UserRoundPlus = icon(`<path d="M2 21a8 8 0 0 1 13.292-6M10 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM19 16v6M22 19h-6"/>`);
export const EllipsisVertical = icon(`<path d="M12 5h.01M12 12h.01M12 19h.01"/>`);
export const Search = icon(`<path d="m21 21-4.34-4.34M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/>`);
export const Sparkles = icon(`<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>`);
export const ChevronDown = icon(`<path d="m6 9 6 6 6-6"/>`);
export const TrendingUp = icon(`<path d="m22 7-8.5 8.5-5-5L2 17M16 7h6v6"/>`);
export const ArrowRight = icon(`<path d="M5 12h14m-7-7 7 7-7 7"/>`);
export const Upload = icon(`<path d="M12 3v12M17 8l-5-5-5 5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>`);
export const Star = icon(`<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>`);
export const Plus = icon(`<path d="M5 12h14M12 5v14"/>`);
export const MessagesSquare = icon(`<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" fill="none"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>`, { fill: 'currentColor' });
export const X = icon(`<path d="M18 6 6 18M6 6l12 12"/>`);
export const Pencil = icon(`<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>`);
export const Info = icon(`<path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01"/>`);
export const CalendarDays = icon(`<path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>`);
export const ChevronLeft = icon(`<path d="m15 18-6-6 6-6"/>`);
export const Trash2 = icon(`<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>`);
export const Save = icon(`<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7M7 3v4a1 1 0 0 0 1 1h7"/>`);
export const Bold = icon(`<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>`);
export const Italic = icon(`<path d="M19 4h-9M14 20H5M15 4 9 20"/>`);
export const Underline = icon(`<path d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16"/>`);
export const List = icon(`<path d="M3 5h.01M3 12h.01M3 19h.01M8 5h13M8 12h13M8 19h13"/>`);
export const ListOrdered = icon(`<path d="M10 12h11M10 18h11M10 6h11M4 10h2M4 6h1v4M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>`);
export const Paperclip = icon(`<path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/>`);
export const ClipboardList = icon(`<path d="M8 2h8v4H8zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01"/>`);
export const Minus = icon(`<path d="M5 12h14"/>`);
export const Send = icon(`<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zM21.854 2.147l-10.94 10.939"/>`);
export const ChevronRight = icon(`<path d="m9 18 6-6-6-6"/>`);
export const Video = icon(`<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>`);
export const ArrowUpRight = icon(`<path d="M7 7h10v10M7 17 17 7"/>`);
export const ArrowLeft = icon(`<path d="m12 19-7-7 7-7M19 12H5"/>`);
export const CircleCheckBig = icon(`<path d="M21.801 10A10 10 0 1 1 17 3.335M9 11l3 3L22 4"/>`);
export const Link = icon(`<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`);
export const Download = icon(`<path d="M12 15V3M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5"/>`);
export const Activity = icon(`<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>`);
