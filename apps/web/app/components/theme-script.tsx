/**
 * Blocking inline script that resolves the theme before first paint.
 *
 * Runs as the first child of <body>, so <html> already exists and the class
 * lands before any pixel is painted — no flash of the wrong theme.
 *
 * It reads localStorage only. That is deliberate: `cacheComponents` (PPR) is
 * on, and anything at layout scope that reads REQUEST data (cookies, headers)
 * collapses every route's static shell to a fallback — the constraint spelled
 * out in app/layout.tsx. A cookie-backed theme would do exactly that; a
 * client-side script does not, because the shell it patches is already static.
 *
 * The storage key and shape must stay in sync with the zustand `persist`
 * config in lib/stores/ui.ts (name: 'joblify.ui', partialize → { theme }).
 */
export const THEME_STORAGE_KEY = 'joblify.ui';

const script = `(function(){try{var t='system';var raw=localStorage.getItem('${THEME_STORAGE_KEY}');if(raw){var p=JSON.parse(raw);if(p&&p.state&&p.state.theme){t=p.state.theme}}var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
