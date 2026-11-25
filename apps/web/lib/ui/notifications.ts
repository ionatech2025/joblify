import type { NotificationKind } from '@prisma/client';
import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  Mail,
  MailCheck,
  MessagesSquare,
  Send,
  Share2,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type NotificationAudience = 'JOB_SEEKER' | 'COMPANY';

type Payload = Record<string, unknown>;
type Destination = (payload: Payload) => string | null;

function under(prefix: string, field: unknown): string | null {
  return typeof field === 'string' && field !== '' ? prefix + encodeURIComponent(field) : null;
}

const applications: Destination = () => '/jobseeker/applications';
const applicants: Destination = (p) => under('/company/applicants/', p.jobId);
const jobPage: Destination = (p) => under('/jobs/', p.jobSlug);
const subscribers: Destination = () => '/company/jobseekers?filter=subscribed';

/**
 * Every notification kind's label, icon, and the one place its row opens for
 * each audience. The destinations follow the payloads the writers in
 * app/actions actually store: a company's withdrawal notice carries no jobId
 * and a closed or removed job's notice no jobSlug (its page is gone), so those
 * rows open nothing rather than a broken link.
 */
export const NOTIFICATION_KIND: Record<
  NotificationKind,
  { label: string; icon: LucideIcon; opens: Partial<Record<NotificationAudience, Destination>> }
> = {
  APPLICATION_SUBMITTED: {
    label: 'Application submitted',
    icon: Send,
    opens: { JOB_SEEKER: applications, COMPANY: applicants },
  },
  APPLICATION_STATUS_CHANGED: {
    label: 'Application update',
    icon: BriefcaseBusiness,
    opens: { JOB_SEEKER: applications, COMPANY: applicants },
  },
  NEW_APPLICANT: { label: 'New applicant', icon: UserPlus, opens: { COMPANY: applicants } },
  INTERVIEW_SCHEDULED: {
    label: 'Interview scheduled',
    icon: CalendarCheck,
    opens: { JOB_SEEKER: applications, COMPANY: applicants },
  },
  INVITATION_RECEIVED: {
    label: 'Invitation',
    icon: Mail,
    opens: { JOB_SEEKER: () => '/jobseeker/subscriptions' },
  },
  ACCOUNT_UPDATE: { label: 'Account', icon: ShieldCheck, opens: {} },
  SYSTEM: { label: 'System', icon: Bell, opens: { JOB_SEEKER: jobPage, COMPANY: jobPage } },
  JOB_SHARED: { label: 'Job shared with you', icon: Share2, opens: { JOB_SEEKER: jobPage } },
  CHAT_AREA_ADDED: {
    label: 'Added to a chat',
    icon: MessagesSquare,
    opens: {
      JOB_SEEKER: (p) => under('/jobseeker/chats/', p.chatAreaId),
      COMPANY: (p) => under('/company/chats/', p.chatAreaId),
    },
  },
  NEW_SUBSCRIBER: { label: 'New subscriber', icon: Users, opens: { COMPANY: subscribers } },
  INVITATION_RESPONDED: {
    label: 'Invitation answered',
    icon: MailCheck,
    opens: { COMPANY: subscribers },
  },
};

export function notificationHref(
  n: { kind: NotificationKind; payload: Payload },
  audience: NotificationAudience,
): string | null {
  return NOTIFICATION_KIND[n.kind].opens[audience]?.(n.payload) ?? null;
}
