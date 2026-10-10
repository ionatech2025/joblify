'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { withSentry } from '@/lib/observability/sentry-client';

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
    // Rides along with the SDK rather than loading it: vitals are reported as
    // they happen (FCP, LCP, TTFB all land before the SDK's idle-time start),
    // and withSentry() holds them until it is up. Pulling it in from here would
    // put the SDK back on the load path this module is trying to stay off.
    // No-op when the build has no DSN.
    withSentry(({ setMeasurement, captureMessage }) => {
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
    });
  });

  return null;
}
