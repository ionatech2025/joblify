import { Suspense } from 'react';
import { SignUp } from '@clerk/nextjs';

export const metadata = { title: 'Sign up' };

// The split-screen shell (wordmark + brand panel) lives in app/(auth)/layout.tsx.
export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </Suspense>
  );
}
