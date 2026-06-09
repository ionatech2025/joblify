export const metadata = {
  title: 'Resources',
  description: 'Practical guides for jobseekers and employers on Joblify.',
};

export default function ResourcesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-neutral-900">Resources</h1>
      <p className="mt-4 text-neutral-600">Short, practical guides for getting the most out of Joblify.</p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-neutral-900">For jobseekers</h2>
        <ul className="mt-2 list-disc pl-5 text-neutral-700">
          <li>Upload a focused résumé — we parse it to autofill applications and score every job for you.</li>
          <li>Keep your headline and skills sharp; they&apos;re what recruiters see first.</li>
          <li>Save a search to get matching new roles in your daily digest.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-neutral-900">For employers</h2>
        <ul className="mt-2 list-disc pl-5 text-neutral-700">
          <li>Write a clear title and detailed description — AI extracts the required skills on save.</li>
          <li>Move applicants through the pipeline and keep private notes per candidate.</li>
          <li>Add a logo and company details so your posts stand out in search.</li>
        </ul>
      </section>
    </main>
  );
}
