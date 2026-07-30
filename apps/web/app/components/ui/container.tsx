import { cn } from '@/lib/cn';

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  // cn(), not a template append: a caller passing `max-w-3xl` has to *replace*
  // max-w-6xl, and naive concatenation would leave both classes on the element
  // with Tailwind's source order deciding the winner.
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6', className)}>{children}</div>;
}
