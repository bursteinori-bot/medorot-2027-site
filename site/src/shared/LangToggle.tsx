import { useLang } from '../i18n/lang'

// The small Hebrew/English switch. It shows the language you can switch TO ("EN" on the Hebrew site, "עב" on the
// English one), keeps the current page, form answers and scroll position, and only swaps the text and direction.
export function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useLang()
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
      aria-label={t.toggle.aria}
      title={t.toggle.aria}
      className={`inline-flex items-center justify-center font-brand font-bold leading-none tracking-wide select-none transition-colors ${className}`}
    >
      <span lang={t.toggle.textLang} aria-hidden>{t.toggle.text}</span>
    </button>
  )
}
