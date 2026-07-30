import { AuthVisualPanel } from './auth-visual-panel';

/**
 * Split-screen auth shell: Clerk widget centred on the left (it renders its own
 * heading), brand panel on the right above `lg`.
 *
 * The two pages previously built this grid, the wordmark and the panel each for
 * themselves, which is the kind of duplication that lets sign-in and sign-up
 * drift apart. The design-regression spec asserts the panel is visible at
 * 1440×900 and hidden at 390×844 — that behaviour lives in AuthVisualPanel.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-[80vh] lg:grid-cols-2">
      <section className="flex flex-col items-center justify-center gap-8 px-4 py-12 sm:px-6">
        <p className="text-fg m-0 flex items-center gap-2 text-lg font-extrabold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size brand mark */}
          <img src="/logo.png" alt="" width={28} height={28} className="size-7 rounded-md" />
          Joblify
        </p>
        {children}
      </section>
      <AuthVisualPanel />
    </main>
  );
}
