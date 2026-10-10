import { PageHeader } from '@/app/components/ui/ambient';
import { CONTACTS } from '@/lib/site-config';
import { groqTasks, listTasks } from '@/lib/ai/groq-config';

export const metadata = { title: 'How we use AI' };

// Describes what lib/ai/*, workflows/resume-parse and workflows/match-score
// actually do. If those change, change this page in the same PR.
export default function AiUsePage() {
  const zdr = process.env.AI_GATEWAY_ZDR === '1';
  // Decided by the same switches that route the calls (lib/ai/groq-config.ts).
  const onGroq = groqTasks();
  return (
    <main>
      <PageHeader eyebrow="Legal" title="How we use AI" width="max-w-3xl" />
      <div className="prose-links mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p>
          AI is used in four places. In none of them does it decide anything about you on its own:
          people — you, and the employer — make every hiring decision.
        </p>

        <h2>What it does</h2>
        <ul>
          <li>
            <strong>Résumé reading.</strong> When you upload a résumé, a language model extracts
            structured details (name, skills, experience) so you do not retype them. Skills that
            match our catalogue are added to your profile; you can edit or remove them.
          </li>
          <li>
            <strong>Match score.</strong> The text of your résumé and of a job posting are each
            converted to a numerical representation, and the similarity between the two is shown to
            you and to the employer as a percentage. It is a rough indicator of topical overlap —{' '}
            <em>not</em> a judgement of your ability, and not calibrated to hiring outcomes.
          </li>
          <li>
            <strong>Job skills.</strong> For postings, a model lists the skills a role asks for.
          </li>
          <li>
            <strong>Bio coach.</strong> If you open it, the text of your bio and your messages are
            sent to a model to suggest rewrites.
          </li>
        </ul>

        <h2>Limits you should know about</h2>
        <ul>
          <li>
            The score can be wrong. It rewards similar wording, so it can under-rate people whose
            experience is described differently, in another language, or in an unusual format, and
            it can be influenced by keyword choice. Scanned or image-only résumés may not be read at
            all.
          </li>
          <li>
            If a résumé cannot be read by the AI model, a simpler rule-based reader is used, which
            is less accurate. We re-read those résumés with the model when it is available again.
          </li>
          <li>
            Text hidden inside a document is treated as data, not as instructions, and is not
            followed.
          </li>
        </ul>

        <h2>Human oversight and your options</h2>
        <ul>
          <li>No application is accepted or rejected by the platform automatically.</li>
          <li>Employers see the score alongside your résumé and decide for themselves.</li>
          <li>
            You can delete a résumé (and so its score), edit any extracted detail, or ask for a
            person to review anything the score contributed to by writing to{' '}
            <a href={`mailto:${CONTACTS.privacy}`}>{CONTACTS.privacy}</a>.
          </li>
        </ul>

        <h2>Where the data goes</h2>
        <p>
          {onGroq.length > 0
            ? `For ${listTasks(onGroq)}, the text you submit is sent directly to Groq, an AI inference provider, under our own account. Everything else — and any of those requests Groq cannot answer — goes to AI model providers through a gateway operated by our hosting provider.`
            : 'Résumé text and the other inputs above are sent to AI model providers through a gateway operated by our hosting provider.'}{' '}
          Each is listed on the <a href="/legal/processors">processors</a> page.
          {zdr
            ? ' Requests through the gateway are routed only to providers that have agreed not to retain them or use them to train models.'
            : ' We do not send your data to a provider for any purpose other than producing the result you asked for.'}
          {onGroq.length > 0 && zdr
            ? ' That routing setting applies to the gateway; requests sent directly to Groq are not covered by it.'
            : ''}
        </p>
      </div>
    </main>
  );
}
