import { useWording } from '../lib/wording';
import { Bold, ChevronDown, Italic, List, ListOrdered, Paperclip, Save, Underline } from '../ui/icons';

/**
 * « Note patient » of the recommendation editor: the text the patient receives, signed by the practitioner.
 * The formatting toolbar, « Modèle de note » and « Joindre une ressource » are static (not in the prototype).
 */
export function NoteEditor({
  note,
  signature,
  onChange,
  onBlur,
}: {
  note: string;
  signature: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const w = useWording();
  return (
    <>
      {/* Mobile (app capture): « Modèle de note » goes under the title. */}
      <div className="flex items-center gap-3 max-sm:flex-wrap">
        <h2 className="m-0 flex-1 max-sm:basis-full text-lg font-semibold text-ink">Note {w.n}</h2>
        <span className="inline-flex items-center gap-2 h-8 px-4 border border-border rounded-full bg-surface-card text-13 leading-4 text-ink-muted">
          Modèle de note
          <ChevronDown size={14} strokeWidth={1.75} />
        </span>
        <span className="flex text-ink-muted">
          <Save size={18} strokeWidth={1.75} />
        </span>
      </div>
      <div className="mt-3 bg-surface-card border border-border rounded-lg overflow-hidden">
        <div className="flex gap-2 py-2 px-3 border-b border-border">
          {[Bold, Italic, Underline, List, ListOrdered].map((Icon, i) => (
            <span key={i} className="w-8 h-8 flex items-center justify-center text-ink-muted">
              <Icon size={16} strokeWidth={1.75} />
            </span>
          ))}
        </div>
        <div className="pt-3 px-4 pb-6 text-base text-ink">
          <textarea
            aria-label={`Note ${w.n}`}
            value={note}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            rows={1}
            className="block w-full resize-none [field-sizing:content] border-0 outline-none bg-transparent text-base text-ink p-0 font-sans"
          />
          <div className="mt-3 italic">
            {signature}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-6 pl-3 text-base text-ink">
        <Paperclip size={18} strokeWidth={1.75} />
        Joindre une ressource
      </div>

    </>
  );
}
