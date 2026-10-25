import { AuthFormSkeleton } from '@/app/(auth)/auth-form-skeleton';
import { ClerkSlot } from '@/app/components/clerk-slot';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to your Joblify account to manage applications, resumes, or job postings.',
};

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
