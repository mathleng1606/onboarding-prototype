import { ChevronDown } from '../ui/icons';

/** Belgian flag + chevron, as in the reference phone field. */
export function PhonePrefix() {
  return (
    <span className="flex-none w-9 flex items-center justify-center gap-[3px] border-r border-border">
      <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
        <rect width="5.4" height="12" fill="#000" />
        <rect x="5.3" width="5.4" height="12" fill="#f5d000" />
        <rect x="10.6" width="5.4" height="12" fill="#e03a3e" />
      </svg>
      <span className="text-ink-muted flex">
        <ChevronDown size={8} strokeWidth={3} />
      </span>
    </span>
  );
}
