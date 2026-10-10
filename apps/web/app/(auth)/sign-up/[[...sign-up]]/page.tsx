import { SignUp } from '@clerk/nextjs';
import { AuthFormSkeleton } from '@/app/(auth)/auth-form-skeleton';
import { ClerkSlot } from '@/app/components/clerk-slot';

export const metadata = { title: 'Sign up' };

// The split-screen shell (wordmark + brand panel) lives in app/(auth)/layout.tsx.
export default function SignUpPage() {
  return (
    <ClerkSlot fallback={<AuthFormSkeleton />}>
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </ClerkSlot>
  );
}
