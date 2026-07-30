'use client';

import { useActionState, useState } from 'react';
import { sendChatMessage, type SendMessageResult } from '@/app/actions/chat';
import { Field, Input, Select, Textarea } from '@/app/components/ui/form';
import { Button } from '@/app/components/ui/button';

// Message form. Submits through useActionState so the draft survives expected
// failures: Send locks (label flips to "Sending…") while the action is
// pending, an { ok: false } result renders inline next to the button with
// role="alert", and the fields only clear after a confirmed send. The kind
// select carries the flowchart's "share material, orient & communicate
// interview details" — MATERIAL pairs with an attachment link.
export function ChatComposer({ chatAreaId }: { chatAreaId: string }) {
  const [state, formAction, isPending] = useActionState<SendMessageResult | null, FormData>(
    sendChatMessage.bind(null, chatAreaId),
    null,
  );

  // Controlled values: React 19 resets uncontrolled fields after every form
  // action — success or failure — which is exactly the data loss this
  // composer exists to prevent.
  const [body, setBody] = useState('');
  const [kind, setKind] = useState('TEXT');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Clear the draft only once a send is confirmed. Adjusting state during
  // render — guarded so it can't loop — is React's recommended alternative to
  // a setState-in-effect (same pattern as jobs-search.tsx).
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.ok) {
      setBody('');
      setKind('TEXT');
      setAttachmentUrl('');
    }
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3">
      <Field label="Message">
        <Textarea
          name="body"
          rows={3}
          required
          maxLength={4000}
          placeholder="Write a message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Type">
          <Select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="TEXT">Message</option>
            <option value="MATERIAL">Material (attach a link)</option>
            <option value="INTERVIEW_DETAILS">Interview details</option>
          </Select>
        </Field>
        <Field label="Attachment link (optional)">
          <Input
            name="attachmentUrl"
            type="url"
            placeholder="https://…"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Sending…' : 'Send'}
        </Button>
        {state && !state.ok && (
          <p role="alert" className="m-0 text-sm text-danger">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
