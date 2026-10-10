/**
 * User agents that must receive <title>, <meta> and the canonical link inside
 * <head> in the first bytes of the response.
 *
 * Next streams async metadata (generateMetadata) into <body> once it resolves,
 * so the static shell can flush first; that is right for browsers. Agents that
 * match this pattern get blocking metadata in <head> instead. The
 * `htmlLimitedBots` option REPLACES Next's default list, so the default
 * (next/dist/shared/lib/router/utils/html-bots, 16.4) is repeated here and
 * extended with the fetchers that either do not run JavaScript or read only
 * <head>: Googlebot (first-wave indexing is raw HTML), the AI search/answer
 * crawlers, and link unfurlers the default lacks.
 *
 * Measured on /jobs/<slug> before this: Googlebot, GPTBot, OAI-SearchBot,
 * ClaudeBot and PerplexityBot all got <title> and the description ~34 KB into
 * <body>, while Bing and the social bots got them in <head>.
 *
 * AI *training* crawlers (GPTBot, ClaudeBot, CCBot, ...) are disallowed in
 * app/robots.ts and are deliberately not listed here.
 *
 * Kept in its own dependency-free module, imported by next.config.ts, so the
 * pattern has a unit test: the option is silent when it is wrong.
 */

/** Verbatim copy of Next 16.4's default. Re-check on a Next upgrade. */
export const NEXT_DEFAULT_LIMITED_BOTS = [
  '[\\w-]+-Google',
  'Google-[\\w-]+',
  'Chrome-Lighthouse',
  'Slurp',
  'DuckDuckBot',
  'baiduspider',
  'yandex',
  'sogou',
  'bitlybot',
  'tumblr',
  'vkShare',
  'quora link preview',
  'redditbot',
  'ia_archiver',
  'Bingbot',
  'BingPreview',
  'applebot',
  'facebookexternalhit',
  'facebookcatalog',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'Discordbot',
  'WhatsApp',
  'SkypeUriPreview',
  'Yeti',
  'googleweblight',
] as const;

export const ADDED_LIMITED_BOTS = [
  'Googlebot',
  'GoogleOther',
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'DuckAssistBot',
  'MistralAI-User',
  'YouBot',
  'Amazonbot',
  'Meta-ExternalFetcher',
  'TelegramBot',
  'Pinterestbot',
  'Embedly',
  'Iframely',
] as const;

export const HTML_LIMITED_BOTS = new RegExp(
  [...NEXT_DEFAULT_LIMITED_BOTS, ...ADDED_LIMITED_BOTS].join('|'),
  'i',
);
