import { AuthFormSkeleton } from '@/app/(auth)/auth-form-skeleton';
import { ClerkSlot } from '@/app/components/clerk-slot';

export const metadata = {
  title: 'Sign up',
  description: 'Create a Joblify account to apply for jobs, build a resume, or hire talent.',
};

// The split-screen shell (wordmark + brand panel) lives in app/(auth)/layout.tsx.
export default function SignUpPage() {
  return (
    <ClerkSlot
      widget="signUp"
      props={{
        path: '/sign-up',
        routing: 'path',
        signInUrl: '/sign-in',
        fallbackRedirectUrl: '/dashboard',
      }}
      fallback={<AuthFormSkeleton />}
    />
  );
}
