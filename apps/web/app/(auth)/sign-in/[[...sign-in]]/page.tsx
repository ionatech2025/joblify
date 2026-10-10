import { AuthFormSkeleton } from '@/app/(auth)/auth-form-skeleton';
import { ClerkSlot } from '@/app/components/clerk-slot';

export const metadata = { title: 'Sign in' };

// The split-screen shell (wordmark + brand panel) lives in app/(auth)/layout.tsx.
export default function SignInPage() {
  return (
    <ClerkSlot
      widget="signIn"
      props={{
        path: '/sign-in',
        routing: 'path',
        signUpUrl: '/sign-up',
        fallbackRedirectUrl: '/dashboard',
      }}
      fallback={<AuthFormSkeleton />}
    />
  );
}
