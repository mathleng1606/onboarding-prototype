import { MessagesSquare } from './icons';

/** Green chat bubble, bottom right of every app screen, above side panels and their scrim (z 52). */
export function HelpBubble() {
  return (
    <span
      aria-hidden="true"
      className="fixed right-6 bottom-9 z-[52] w-11 h-11 rounded-full bg-brand-lime text-brand-900 hidden sm:flex items-center justify-center"
    >
      <MessagesSquare size={22} fill="currentColor" strokeWidth={1.5} />
    </span>
  );
}

