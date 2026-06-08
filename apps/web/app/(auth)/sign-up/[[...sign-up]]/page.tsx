import { Suspense } from 'react';
import { SignUp } from '@clerk/nextjs';

export const metadata = { title: 'Sign up' };

export default function SignUpPage() {
  return (
    <main style={{ display: 'flex', justifyContent: 'center', padding: '4rem 1rem' }}>
      <Suspense fallback={null}>
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl="/dashboard" />
      </Suspense>
    </main>
  );
}
