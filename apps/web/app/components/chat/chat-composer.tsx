import { sendChatMessage } from '@/app/actions/chat';
import { Field, Input, Select, Textarea } from '@/app/components/ui/form';
import { Button } from '@/app/components/ui/button';

// Message form (server-rendered; React resets it after the action succeeds).
// The kind select carries the flowchart's "share material, orient &
// communicate interview details" — MATERIAL pairs with an attachment link.
export function ChatComposer({ chatAreaId }: { chatAreaId: string }) {
  return (
    <form action={sendChatMessage.bind(null, chatAreaId)} className="mt-6 flex flex-col gap-3">
      <Field label="Message">
        <Textarea name="body" rows={3} required maxLength={4000} placeholder="Write a message…" />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Type">
          <Select name="kind" defaultValue="TEXT">
            <option value="TEXT">Message</option>
            <option value="MATERIAL">Material (attach a link)</option>
            <option value="INTERVIEW_DETAILS">Interview details</option>
          </Select>
        </Field>
        <Field label="Attachment link (optional)">
          <Input name="attachmentUrl" type="url" placeholder="https://…" />
        </Field>
      </div>
      <Button type="submit" className="self-start">
        Send
      </Button>
    </form>
  );
}
