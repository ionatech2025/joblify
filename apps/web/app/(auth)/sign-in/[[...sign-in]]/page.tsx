import { Suspense } from 'react';
import { SignIn } from '@clerk/nextjs';

export const metadata = { title: 'Sign in' };

export default function SignInPage() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 py-12">
      <Suspense fallback={null}>
        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/dashboard" />
      </Suspense>
    </main>
  );
}
