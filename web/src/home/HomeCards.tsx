import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { keys } from '../hooks/queries';
import { useWording } from '../lib/wording';
import { ArrowRight, ArrowUpRight, ChevronRight, Info, TrendingUp, Video } from '../ui/icons';
import { cx } from '../ui/utils';

/* Static cards of the home page, copied from the reference (only the drafts count is live). */

/** « Votre activité · 30 j »: orders and conversion are mocked at 0; unsent recommendations = drafts. */
export function ActivityCard() {
  const w = useWording();
  const { data: drafts } = useQuery({
    queryKey: keys.recommendations({ status: 'draft' }),
    queryFn: () => api.recommendations({ status: 'draft' }),
  });
  const stat = (value: string, label: string, danger = false) => (
    <div>
      <div className={cx('text-2xl font-semibold', danger ? 'text-danger' : 'text-ink')}>{value}</div>
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        {label}
        <span className="flex">
          <Info size={14} strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
  return (
    <section className="bg-surface-card border border-border rounded-lg pt-4 px-4 pb-6">
      <div className="flex items-center gap-2">
        <span className="w-[30px] h-[30px] rounded-full bg-surface-tint text-brand-900 flex items-center justify-center">
          <TrendingUp size={14} strokeWidth={1.75} />
        </span>
        <span className="flex-1 text-sm font-medium text-ink">Votre activité · 30 j</span>
        <span className="flex items-center gap-1 text-xs font-medium text-ink">
          Mes stats
          <ArrowRight size={12} strokeWidth={1.75} />
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3.5 pl-6">
        {stat('0', 'Commandes')}
        {stat(String(drafts?.length ?? 0), `${w.Mots} non envoyées`, true)}
        {stat('0 %', 'Taux de conversion')}
      </div>
    </section>
  );
}

/** « À la une »: Black Friday banner and next webinars (static). */
export function FeaturedCard() {
  const w = useWording();
  const webinars = [
    ['/img/webinaire-1.png', "Le microbiote, chef d'orchestre discret des troubles hormonaux"],
    ['/img/webinaire-2.png', "Micronutrition de l'enfant : enjeux et objectifs"],
    ['/img/webinaire-3.png', 'Sportif fatigué, bilan « normal » : les analyses qui changent la pris...'],
  ];
  return (
    <section className="bg-surface-card border border-border rounded-lg pt-4 px-4 pb-0 overflow-hidden">
      <div className="text-sm font-medium text-ink mb-4">À la une</div>
      {/* Mobile (app capture): image on top, text below. */}
      <div className="flex flex-col-reverse md:flex-row md:h-[250px] rounded-lg overflow-hidden bg-surface-subtle border border-border box-border">
        <div className="flex-1 min-w-0 py-6 px-8 max-md:p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="text-2xl max-md:text-xl font-medium text-ink">Black Friday : vous participez ?</div>
            <div className="mt-2 text-base text-ink-muted">Offrez jusqu'à 20 % à vos {w.ns}</div>
          </div>
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            Je participe
            <ArrowRight size={14} strokeWidth={1.75} />
          </span>
        </div>
        <img
          src="/img/black-friday.png"
          alt={`Black Friday, du 23 au 30 novembre : jusqu'à 20 % pour vos ${w.ns}`}
          className="md:flex-[0_0_50%] md:w-1/2 h-full max-md:h-[159px] object-cover block"
        />
      </div>
      <div className="h-px bg-border mt-[17px] mb-3.5" />
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-ink">
        <span className="flex text-ink-muted">
          <Video size={14} strokeWidth={1.75} />
        </span>
        <span className="flex-1">Prochains webinaires</span>
        <span className="flex items-center gap-1 text-xs font-medium text-ink">
          Voir l'Académie
          <ArrowUpRight size={12} strokeWidth={1.75} />
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-4 md:h-[60px] md:pb-0 overflow-hidden">
        {webinars.map(([img, title]) => (
          <span key={img} className="flex gap-3 items-start max-md:items-center py-3 px-2.5 bg-surface-subtle rounded-md h-[60px] max-md:h-auto box-border overflow-hidden text-ink">
            <img src={img} alt="" className="flex-none block w-[76px] h-[41px] -mt-1 max-md:mt-0 rounded-sm object-cover object-top" />
            <span className="flex-1 min-w-0 text-sm leading-[22px] font-medium block ml-2 line-clamp-2">{title}</span>
            <span className="flex-none text-ink-muted mt-2 flex">
              <ChevronRight size={14} strokeWidth={2} />
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
