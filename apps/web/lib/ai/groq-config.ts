// Which AI tasks are routed to Groq, as pure functions of the environment.
//
// Split from groq.ts so the legal pages can state what actually happens without
// importing the AI SDK: /legal/processors and /legal/ai must describe the real
// routing, and the one place that decides it is here.

export type AiTask = 'bio-coach' | 'resume-parse' | 'skill-extraction';

/** Suffix of the per-task env vars: AI_PROVIDER_<ENV>, AI_GROQ_MODELS_<ENV>. */
export const TASK_ENV: Record<AiTask, string> = {
  'bio-coach': 'BIO_COACH',
  'resume-parse': 'RESUME_PARSE',
  'skill-extraction': 'SKILL_EXTRACTION',
};

/** What a person would call each task — used in the legal pages. */
export const TASK_LABEL: Record<AiTask, string> = {
  'resume-parse': 'résumé reading',
  'skill-extraction': 'job skill extraction',
  'bio-coach': 'bio coach',
};

type Env = Record<string, string | undefined>;

/**
 * Whether `task` tries Groq first: `AI_PROVIDER_<TASK>=groq`, or the blanket
 * `AI_PROVIDER=groq`, *and* a key. Neither alone routes data to Groq, and a
 * per-task value ("gateway") overrides the blanket one.
 */
export function groqEnabledFor(task: AiTask, env: Env = process.env): boolean {
  const chosen = env[`AI_PROVIDER_${TASK_ENV[task]}`] ?? env.AI_PROVIDER;
  return chosen === 'groq' && Boolean(env.GROQ_API_KEY);
}

/** The tasks currently routed to Groq, in a stable order. */
export function groqTasks(env: Env = process.env): AiTask[] {
  return (['resume-parse', 'skill-extraction', 'bio-coach'] as const).filter((t) =>
    groqEnabledFor(t, env),
  );
}

/** "résumé reading, job skill extraction and bio coach" */
export function listTasks(tasks: AiTask[]): string {
  const labels = tasks.map((t) => TASK_LABEL[t]);
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}
