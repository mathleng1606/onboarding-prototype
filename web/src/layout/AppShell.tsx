import {
  ArrowLeftToLine,
  BookOpen,
  ChevronUp,
  Copy,
  Crown,
  FileText,
  HandCoins,
  House,
  Megaphone,
  Menu,
  Package,
  Server,
  Store,
  UsersRound,
} from '../ui/icons';
import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { usePractitioner } from '../hooks/queries';
import { useWording } from '../lib/wording';
import { HelpBubble } from '../ui';
import { useToast } from '../ui/toast';
import { cx, NOT_IN_PROTOTYPE } from '../ui/utils';

const ICON = { size: 16, strokeWidth: 1.75 } as const;

/** Left menu of the reference: font-weight 400 everywhere, including the active entry. */
function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const w = useWording();
  const toast = useToast();
  const { data: p } = usePractitioner();
  const { pathname } = useLocation();

  const item = (label: string, icon: ReactNode, to?: string, extra?: ReactNode, activePrefix?: string) => {
    const base = 'flex items-center gap-2 h-[34px] box-border pl-3 rounded-sm text-brand-900 text-sm font-normal';
    if (!to) {
      const active = !!activePrefix && pathname.startsWith(activePrefix);
      return (
        <button type="button" onClick={() => toast(NOT_IN_PROTOTYPE)} className={cx(base, active ? 'bg-surface-tint' : 'bg-transparent', 'border-0 text-left w-full')}>
          {icon}
          <span className="flex-1">{label}</span>
          {extra}
        </button>
      );
    }
    const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
    return (
      <NavLink to={to} onClick={onNavigate} className={cx(base, active ? 'bg-surface-tint' : 'bg-transparent')}>
        {icon}
        <span className="flex-1">{label}</span>
        {extra}
      </NavLink>
    );
  };
  const divider = <div className="h-px bg-border my-3" />;

  return (
    <nav aria-label="Navigation" className="relative flex-none w-[212px] h-full box-border bg-surface-card border-r border-border pr-2 flex flex-col">
      <div className="h-[102px] box-border pt-7 pl-[19px]">
        <img src="/img/logo.png" alt="Simplycure" className="block w-40 h-auto" />
      </div>
      <button
        type="button"
        aria-label="Réduire le menu"
        onClick={() => toast(NOT_IN_PROTOTYPE)}
        className="hidden lg:flex absolute top-[23px] left-[194px] z-10 w-[35px] h-[35px] box-border border border-border bg-surface-card rounded-md text-brand-900 items-center justify-center shadow-[0_1px_3px_#0000001a]"
      >
        <ArrowLeftToLine {...ICON} />
      </button>
      {item('Accueil', <House {...ICON} />, '/')}
      {item(w.Ns, <UsersRound {...ICON} />, '/patients')}
      {item('Questionnaires', <Server {...ICON} />)}
      {item(w.Mots, <FileText {...ICON} />, undefined, undefined, '/recommandations')}
      {item('Catalogue', <BookOpen {...ICON} />, '/catalogue')}
      {divider}
      {item('Protocoles', <Copy {...ICON} />)}
      {item('Ma sélection', <Store {...ICON} />, undefined, <span className="w-2 h-2 rounded-full bg-brand-900 mr-2" />)}
      {item('Commandes', <Package {...ICON} />)}
      {divider}
      <button type="button" onClick={() => toast(NOT_IN_PROTOTYPE)} className="flex items-center gap-2 pl-3 text-brand-900 bg-transparent border-0 text-left">
        <span className="flex"><HandCoins {...ICON} /></span>
        <span>
          <span className="block text-sm">Parrainer un collègue</span>
          <span className="block text-13 font-semibold text-brand-900">jusqu'à 200€</span>
        </span>
      </button>
      <button type="button" onClick={() => toast(NOT_IN_PROTOTYPE)} className="mt-3.5 h-[31px] box-border flex items-center justify-center gap-2 bg-surface-subtle rounded-sm text-brand-900 text-13 font-semibold border-0">
        <Crown {...ICON} />- Cagnotte
      </button>
      <div className="flex-1" />
      <button type="button" onClick={() => toast(NOT_IN_PROTOTYPE)} className="flex items-center gap-2 h-[34px] pl-3 text-brand-900 text-sm font-normal bg-transparent border-0">
        <Megaphone {...ICON} />
        Nouveautés
      </button>
      <button type="button" onClick={() => toast(NOT_IN_PROTOTYPE)} className="mt-2 mb-4 h-[54px] box-border flex items-center pr-4 pl-[15px] bg-surface-card border border-border rounded-md text-brand-900 text-sm font-semibold text-left">
        <span className="flex-1">{p?.firstName ? `${p.firstName} ${p.lastName}` : ''}</span>
        <ChevronUp {...ICON} />
      </button>
    </nav>
  );
}

/** Left menu + scrollable main area. On small screens the menu becomes a drawer. */
export function AppShell() {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  return (
    <div className="h-full flex flex-col lg:flex-row bg-surface-page overflow-hidden">
      <div className="hidden lg:block h-full">
        <SideNav />
      </div>
      {/* Mobile header, measured on the app captures (reference/mobile): 71 px high, logo on the left,
          « - Cagnotte » pill and menu button on the right. */}
      <header className="lg:hidden flex-none flex items-center h-[71px] box-border px-4 bg-surface-card border-b border-border">
        <img src="/img/logo.png" alt="Simplycure" className="block w-[204px] h-auto -ml-[3px]" />
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => toast(NOT_IN_PROTOTYPE)}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 bg-surface-tint rounded-sm text-brand-900 text-13 font-semibold border-0"
        >
          <Crown size={14} strokeWidth={1.75} />- Cagnotte
        </button>
        <button type="button" aria-label="Menu" onClick={() => setOpen(true)} className="flex ml-4 p-0 bg-transparent border-0 text-ink">
          <Menu size={24} strokeWidth={2} />
        </button>
      </header>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="h-full shadow-xl">
            <SideNav onNavigate={() => setOpen(false)} />
          </div>
          <div className="flex-1 bg-scrim" onClick={() => setOpen(false)} />
        </div>
      )}
      <main id="main" className="relative flex-1 min-w-0 min-h-0 box-border overflow-y-auto">
        <Outlet />
      </main>
      <HelpBubble />
    </div>
  );
}

/** Standard page padding of the reference (16 16 24 24). */
export const pagePadding = 'pt-4 pr-4 pb-6 pl-4 sm:pl-6';
