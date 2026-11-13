// Mail to a company account about its own verification. Same plain-text +
// minimal HTML shape as templates.ts.

export type CompanyDecision = { status: 'VERIFIED' } | { status: 'REJECTED'; reason: string };

export function companyVerificationEmail(
  t: { recipientName: string; companyName: string; url: string } & CompanyDecision,
): { subject: string; text: string; html: string } {
  if (t.status === 'VERIFIED') {
    const subject = `${t.companyName} is verified on Joblify`;
    const text = `Hi ${t.recipientName},

${t.companyName} is now verified. Your jobs appear in search and the company directory.

Post a job: ${t.url}

— The Joblify team`;
    const html = `<p>Hi ${escape(t.recipientName)},</p>
<p><strong>${escape(t.companyName)}</strong> is now verified. Your jobs appear in search and the company directory.</p>
<p><a href="${t.url}">Post a job</a></p>
<p>— The Joblify team</p>`;
    return { subject, text, html };
  }

  const subject = `We could not verify ${t.companyName} yet`;
  const text = `Hi ${t.recipientName},

We reviewed ${t.companyName} and could not verify it yet.

Reason: ${t.reason}

Update your company details and resubmit for review: ${t.url}

— The Joblify team`;
  const html = `<p>Hi ${escape(t.recipientName)},</p>
<p>We reviewed <strong>${escape(t.companyName)}</strong> and could not verify it yet.</p>
<p>Reason: ${escape(t.reason)}</p>
<p><a href="${t.url}">Update your details and resubmit</a></p>
<p>— The Joblify team</p>`;
  return { subject, text, html };
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}
