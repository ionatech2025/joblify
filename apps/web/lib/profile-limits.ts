/**
 * Most skills a profile may carry.
 *
 * One number for the form (client schema) and the action (server schema), and
 * deliberately >= what résumé parsing can hand back (40, lib/ai/prompts/
 * resume-parse.ts). They disagreed at 30 vs 40, so an account whose skills came
 * from résumé auto-fill could never save any profile change: the form refused
 * with a raw validator string ("Array must contain at most 30 element(s)").
 * The limit exists to bound input, not to ration skills.
 */
export const MAX_PROFILE_SKILLS = 50;

export const PROFILE_SKILLS_LIMIT_MESSAGE = `Choose up to ${MAX_PROFILE_SKILLS} skills - untick a few and save again.`;
