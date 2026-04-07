'use client';
import { Lang, LANG_LABELS, setLang } from '../i18n/translations';

interface Props {
  lang: Lang;
  onChange: (l: Lang) => void;
}

const LANGS = Object.keys(LANG_LABELS) as Lang[];

export default function LangSwitcher({ lang, onChange }: Props) {
  const handle = (l: Lang) => { setLang(l); onChange(l); };

  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {LANGS.map(l => (
        <button
          key={l}
          onClick={() => handle(l)}
          style={{
            padding: '3px 7px',
            fontSize: 9,
            fontFamily: 'inherit',
            fontWeight: lang === l ? 'bold' : 'normal',
            borderRadius: 4,
            border: `1px solid ${lang === l ? '#7c3aed' : '#1e1e3f'}`,
            background: lang === l ? '#2d1b69' : 'transparent',
            color: lang === l ? '#c4b5fd' : '#475569',
            cursor: 'pointer',
            letterSpacing: 0.5,
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
