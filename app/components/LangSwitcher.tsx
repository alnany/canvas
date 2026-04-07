'use client';
import { Lang, LANG_LABELS, setLang } from '../i18n/translations';

interface Props {
  lang: Lang;
  onChange: (l: Lang) => void;
}

const LANGS = Object.keys(LANG_LABELS) as Lang[];

export default function LangSwitcher({ lang, onChange }: Props) {
  const handle = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const l = e.target.value as Lang;
    setLang(l);
    onChange(l);
  };

  return (
    <select
      value={lang}
      onChange={handle}
      style={{
        background: '#12121a',
        color: '#c4b5fd',
        border: '1px solid #4c1d95',
        borderRadius: 6,
        padding: '5px 8px',
        fontSize: 11,
        fontFamily: 'inherit',
        cursor: 'pointer',
        outline: 'none',
        letterSpacing: 0.5,
      }}
    >
      {LANGS.map(l => (
        <option key={l} value={l} style={{ background: '#12121a', color: '#e2e8f0' }}>
          {LANG_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
