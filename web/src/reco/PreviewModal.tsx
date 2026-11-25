import { Send, X } from '../ui/icons';
import { useState } from 'react';
import type { Practitioner, Recommendation } from '../api/types';
import { useWording } from '../lib/wording';
import { Button, Modal } from '../ui';
import { cx } from '../ui/utils';

/**
 * « Prévisualisez ce que votre patient va recevoir » (screen 3, preview before sending).
 * Placed to the right of the side menu, never over it. The « Envoyer à Jean » bar only exists
 * during the guide (onSend given); in normal mode the preview has no send button.
 */
export function PreviewModal({
  reco,
  practitioner,
  onClose,
  onSend,
}: {
  reco: Recommendation;
  practitioner: Practitioner;
  onClose: () => void;
  onSend?: () => Promise<void>;
}) {
  const w = useWording();
  const [tab, setTab] = useState<'email' | 'sms'>('email');
  const [busy, setBusy] = useState(false);
  const doctor = `${practitioner.firstName} ${practitioner.lastName}`;

  return (
    <Modal label="Aperçu avant envoi" onClose={onClose} className="top-8 w-[760px] lg:w-auto lg:left-[228px] lg:right-4 lg:translate-x-0 lg:max-w-none h-[min(768px,calc(100vh-64px))] p-8 max-sm:top-[58px] max-sm:h-[calc(100vh-116px)] max-sm:p-6 bg-surface-card overflow-hidden">
      <div className="flex items-start">
        <div className="flex-1">
          <h2 className="m-0 text-xl font-semibold text-ink">Prévisualisez ce que votre {w.n} va recevoir</h2>
          <div className="mt-1 text-sm text-ink-muted">{w.previewSubtitle}</div>
        </div>
        <button type="button" aria-label="Fermer" onClick={onClose} className="flex text-ink border-0 bg-transparent p-0">
          <X size={20} strokeWidth={2} />
        </button>
      </div>
      <div className="flex justify-center gap-3 mt-4" role="tablist">
        {(
          [
            ['email', 'E-mail'],
            ['sms', 'SMS'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cx(
              'py-2 px-0 text-sm font-medium bg-transparent border-0',
              tab === key ? 'border-b-[3px] border-solid border-brand-900 text-ink' : 'text-ink-muted',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={cx('overflow-hidden', onSend ? 'h-[520px] max-h-[calc(100%-200px)]' : 'h-[calc(100%-120px)]')}>
        {tab === 'email' ? (
          <div className="max-w-[562px] mx-auto mt-4 bg-surface-card border border-border rounded-sm overflow-hidden">
            <div className="h-[76px] bg-brand-800 flex items-center pl-8">
              <img src="/img/logo.png" alt="Simplycure" className="block h-[30px] w-auto invert mix-blend-screen" />
            </div>
            <div className="p-4 text-sm text-ink">
              <p className="mt-0 mb-3 text-base">Bonjour {reco.patient.firstName},</p>
              <p className="mt-0 mb-3 text-ink-muted">
                Suite à votre consultation, <strong className="text-ink">{doctor}</strong>
                <span>{w.previewEmailEnd}</span>
              </p>
              <p className="mt-0 mb-3 text-ink-muted">
                Simplycure est la plateforme utilisée par votre praticien pour vous transmettre ses {w.mot}s et vous
                permettre d'accéder aux produits sélectionnés.
              </p>
              <p className="mt-0 mb-3 text-ink-muted">Vous pouvez la consulter ici :</p>
              <span className="inline-flex items-center h-12 px-4 rounded-sm bg-brand-800 text-brand-lime text-base">{w.previewEmailCta}</span>
              <div className="border-t border-border mt-6 mb-4" />
              <div className="p-4 bg-surface-subtle border-l-[3px] border-brand-600 rounded-sm text-ink-muted">
                <strong className="text-ink">Simplycure</strong> est la plateforme de {w.mot} utilisée par plus de 10 000
                praticiens de santé en Europe. Les produits sélectionnés pour vous sont issus de laboratoires professionnels.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mt-6">
            <div className="w-[260px] rounded-[30px] border-[6px] border-ink bg-surface-subtle p-4 pt-8 h-[440px] box-border">
              {/* SMS text copied from the app. The links are mocked. */}
              <div className="rounded-lg rounded-bl-sm bg-surface-card border border-border p-3 text-sm text-ink">
                Simplycure : Bonjour {reco.patient.firstName}, suite à votre consultation avec {doctor}, votre plan a été
                généré. Lien sécurisé pour y accéder : <span className="text-brand-link underline break-all">app.simplycure.com/r/{reco.uid.slice(0, 8)}</span>{' '}
                STOP : <span className="text-brand-link underline break-all">app.simplycure.com/stop</span>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Bar fixed at the bottom of the preview; on mobile its button takes the full width. */}
      {onSend && (
        <div className="absolute left-0 right-0 bottom-0 py-4 px-8 max-sm:px-6 flex justify-end bg-surface-card max-sm:border-t max-sm:border-border">
          <Button
            size="lg"
            className="max-sm:w-full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSend();
              } finally {
                setBusy(false);
              }
            }}
          >
            <Send size={16} strokeWidth={1.75} />
            Envoyer à {reco.patient.firstName}
          </Button>
        </div>
      )}
    </Modal>
  );
}
