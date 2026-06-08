import { Suspense } from 'react';
import { SignUp } from '@clerk/nextjs';

export const metadata = { title: 'Sign up' };

export default function SignUpPage() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 py-12">
      <Suspense fallback={null}>
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl="/dashboard" />
      </Suspense>
    </main>
  );
}
