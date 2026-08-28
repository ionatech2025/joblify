'use client';

import { useReportWebVitals } from 'next/web-vitals';

/**
 * Field Core Web Vitals, reported as Sentry measurements.
 *
 * Why this exists: INP is a field-only metric — it needs real interactions, so
 * no lab run can produce it, which is why lighthouserc.js correctly does not
 * assert it. But the app's only field-metric source was Vercel Speed Insights,
 * and AnalyticsGate mounts that only after `joblify_consent=all`. So INP was
 * measured on the accepting minority of sessions, a group that is
 * systematically unlike the rest of the traffic — meaning the one metric that
 * would catch an input-latency regression on the long console forms was, in
 * practice, invisible.
 *
 * What is sent: the metric name, its value, its rating, and the navigation
 * type. That is all. No user id, no session id, no URL, no query string, no
 * cookie — nothing that identifies a person or a visit, and nothing that could
 * be joined back to one. It rides the Sentry client, which this app already
 * initialises for every session regardless of consent (see
 * instrumentation-client.ts), so this changes what is measured, not who is
 * measured or on what legal basis.
 *
 * Speed Insights stays exactly as it was, behind the consent gate. If the
 * privacy owner concludes it can be ungated — Vercel documents it as
 * cookieless — this can go; until then it is the honest way to have the number.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    // Fire-and-forget: never let telemetry throw into a page, and never let it
    // load Sentry on the critical path — the import resolves from the chunk the
    // client instrumentation has already pulled in.
    void import('@sentry/nextjs')
      .then(({ setMeasurement, captureMessage }) => {
        const unit = metric.name === 'CLS' ? 'none' : 'millisecond';
        setMeasurement(`webvital.${metric.name}`, metric.value, unit);

        // A 'poor' INP is the signal worth an actual event rather than only a
        // measurement attached to whatever transaction happens to be open.
        if (metric.name === 'INP' && metric.rating === 'poor') {
          captureMessage('poor INP', {
            level: 'warning',
            tags: { metric: 'INP', rating: metric.rating },
            extra: { value: metric.value, navigationType: metric.navigationType },
          });
        }
      })
      .catch(() => {
        /* telemetry is best-effort */
      });
  });

  return null;
}
