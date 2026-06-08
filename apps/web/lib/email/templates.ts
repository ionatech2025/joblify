// Plain-text + minimal HTML email templates. Upgrade to React Email components
// in Week 9 when the digest pipeline lands — for V1 transactional this keeps
// the bundle small and the rendering deterministic.

export type ApplicationConfirmTemplate = {
  jobseekerName: string;
  jobTitle: string;
  companyName: string;
  applicationUrl: string;
};

export function applicationConfirm(t: ApplicationConfirmTemplate): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `Your application to ${t.companyName} is in`;
  const text = `Hi ${t.jobseekerName},

We've received your application for "${t.jobTitle}" at ${t.companyName}.
You'll get an email when ${t.companyName} updates the status.

Track it any time: ${t.applicationUrl}

— The Joblify team`;
  const html = `<p>Hi ${escape(t.jobseekerName)},</p>
<p>We've received your application for <strong>${escape(t.jobTitle)}</strong> at ${escape(t.companyName)}.</p>
<p>You'll get an email when ${escape(t.companyName)} updates the status.</p>
<p><a href="${t.applicationUrl}">Track your application</a></p>
<p>— The Joblify team</p>`;
  return { subject, text, html };
}

export type StatusChangeTemplate = {
  jobseekerName: string;
  jobTitle: string;
  companyName: string;
  status: string;
  applicationUrl: string;
};

export function statusChange(t: StatusChangeTemplate): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `Update on your application to ${t.companyName}`;
  const text = `Hi ${t.jobseekerName},

${t.companyName} updated your application for "${t.jobTitle}" — new status: ${t.status}.

View details: ${t.applicationUrl}

— The Joblify team`;
  const html = `<p>Hi ${escape(t.jobseekerName)},</p>
<p>${escape(t.companyName)} updated your application for <strong>${escape(t.jobTitle)}</strong>.</p>
<p>New status: <strong>${escape(t.status)}</strong>.</p>
<p><a href="${t.applicationUrl}">View details</a></p>
<p>— The Joblify team</p>`;
  return { subject, text, html };
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}
