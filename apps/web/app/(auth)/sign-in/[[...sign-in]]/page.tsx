import { Suspense } from 'react';
import { SignIn } from '@clerk/nextjs';

export const metadata = { title: 'Sign in' };

// The split-screen shell (wordmark + brand panel) lives in app/(auth)/layout.tsx.
export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
      />
    </Suspense>
  );
}
