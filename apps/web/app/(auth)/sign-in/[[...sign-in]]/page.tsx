import { Suspense } from 'react';
import { SignIn } from '@clerk/nextjs';
import { AuthVisualPanel } from '../../auth-visual-panel';

export const metadata = { title: 'Sign in' };

// Split-screen auth: Clerk widget centered on the left (it renders its own
// heading), brand panel on the right (lg+ only).
export default function SignInPage() {
  return (
    <main className="grid min-h-[80vh] lg:grid-cols-2">
      <section className="flex flex-col items-center justify-center gap-8 px-4 py-12 sm:px-6">
        <p className="m-0 flex items-center gap-2 text-lg font-extrabold tracking-tight text-neutral-900">
          {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size brand mark */}
          <img src="/logo.png" alt="" width={28} height={28} className="size-7 rounded-md" />
          Joblify
        </p>
        <Suspense fallback={null}>
          <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/dashboard" />
        </Suspense>
      </section>
      <AuthVisualPanel />
    </main>
  );
}
