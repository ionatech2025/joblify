import { Suspense } from 'react';
import { SignIn } from '@clerk/nextjs';

export const metadata = { title: 'Sign in' };

export default function SignInPage() {
  return (
    <main style={{ display: 'flex', justifyContent: 'center', padding: '4rem 1rem' }}>
      <Suspense fallback={null}>
        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/dashboard" />
      </Suspense>
    </main>
  );
}
