import { Suspense } from 'react';
import { SignUp } from '@clerk/nextjs';
import { AmbientCanvas } from '@/app/components/ui/ambient';

export const metadata = { title: 'Sign up' };

export default function SignUpPage() {
  return (
    <main className="relative grid min-h-[70vh] place-items-center overflow-hidden px-4 py-12">
      <AmbientCanvas variant="hero" />
      <div className="relative">
        <Suspense fallback={null}>
          <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl="/dashboard" />
        </Suspense>
      </div>
    </main>
  );
}
