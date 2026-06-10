import { Suspense } from 'react';
import { SignIn } from '@clerk/nextjs';
import { AmbientCanvas } from '@/app/components/ui/ambient';

export const metadata = { title: 'Sign in' };

export default function SignInPage() {
  return (
    <main className="relative grid min-h-[70vh] place-items-center overflow-hidden px-4 py-12">
      <AmbientCanvas variant="hero" />
      <div className="relative">
        <Suspense fallback={null}>
          <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/dashboard" />
        </Suspense>
      </div>
    </main>
  );
}
