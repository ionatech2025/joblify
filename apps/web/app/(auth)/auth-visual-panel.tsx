import { AmbientCanvas } from '@/app/components/ui/ambient';
import { Badge } from '@/app/components/ui/badge';
import { Card } from '@/app/components/ui/card';

// Right half of the auth split-screen (Untitled-UI register): the ambient hero
// wash inside a rounded inset canvas, one floating glass "match card" mock and
// a display-type tagline. Purely visual — hidden below lg; the mock card is
// aria-hidden so its sample data is never announced.
export function AuthVisualPanel() {
  return (
    <div data-testid="auth-visual-panel" className="hidden p-6 lg:flex">
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-indigo-100/80 px-10 py-16 shadow-soft">
        <AmbientCanvas variant="hero" />
        <div className="relative flex flex-col items-center gap-10 text-center">
          <div aria-hidden="true">
            <Card tone="glass" className="w-72 -rotate-2 p-5 text-left">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-sm font-semibold text-neutral-900">Senior Product Designer</p>
                  <p className="m-0 mt-1 text-xs text-neutral-700">Aurora Labs · Remote</p>
                </div>
                <Badge tone="success">92% match</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge tone="neutral">Figma</Badge>
                <Badge tone="neutral">Design systems</Badge>
              </div>
            </Card>
          </div>
          <p className="display m-0 max-w-sm text-3xl text-neutral-900">Where careers find momentum.</p>
        </div>
      </div>
    </div>
  );
}
