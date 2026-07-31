import { Suspense } from 'react';
import { SignIn } from '@clerk/nextjs';
import { AuthFormSkeleton } from '@/app/(auth)/auth-form-skeleton';

export const metadata = { title: 'Sign in' };

// The split-screen shell (wordmark + brand panel) lives in app/(auth)/layout.tsx.
export default function SignInPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
      />
    </Suspense>
  );
}
