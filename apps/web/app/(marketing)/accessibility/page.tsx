export const metadata = { title: 'Accessibility statement' };

export default function AccessibilityPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1>Accessibility statement</h1>
      <p>
        Joblify is committed to making this site usable by everyone. We target compliance with{' '}
        <strong>WCAG 2.2 Level AA</strong> and run automated checks (axe-core) on every deploy. We
        also test manually with screen readers (NVDA, VoiceOver) on critical funnels (sign-up,
        search, apply, status changes).
      </p>
      <h2>Known limitations</h2>
      <p>
        Where automated checks cannot verify intent, we rely on manual review. If a flow is broken
        for you, let us know — we treat accessibility bugs at the same severity as functional bugs.
      </p>
      <h2>Get in touch</h2>
      <p>
        Email <a href="mailto:accessibility@joblify.example">accessibility@joblify.example</a> or
        report directly through your account settings.
      </p>
      <p className="text-sm text-neutral-500">Last audited: see /legal/processors for date.</p>
    </main>
  );
}
