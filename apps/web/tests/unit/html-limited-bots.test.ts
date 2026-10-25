import { describe, expect, it } from 'vitest';
import {
  ADDED_LIMITED_BOTS,
  HTML_LIMITED_BOTS,
  NEXT_DEFAULT_LIMITED_BOTS,
} from '@/lib/seo/html-limited-bots';

// htmlLimitedBots fails silently: a wrong pattern just means a crawler gets its
// <title> and description streamed into <body>. These pin the agents that
// matter, using the user-agent strings they actually send.

const UA = {
  chrome:
    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',
  safari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  googlebot:
    'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  googleInspection: 'Mozilla/5.0 (compatible; Google-InspectionTool/1.0)',
  adsBot: 'Mozilla/5.0 (compatible; AdsBot-Google; +http://www.google.com/adsbot.html)',
  bing: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  oaiSearch:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  chatgptUser:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
  perplexity:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  claudeSearch:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0)',
  facebook: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  twitter: 'Twitterbot/1.0',
  slack: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  linkedin: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
  telegram: 'TelegramBot (like TwitterBot)',
  lighthouseLegacy:
    'Mozilla/5.0 (Linux; Android 11) Chrome/100 Mobile Safari/537.36 Chrome-Lighthouse',
  lighthouseModern:
    'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36 Lighthouse',
  // Training crawlers: disallowed in robots.ts, so they never reach a page.
  gptbot:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot',
  claudebot:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  ccbot: 'CCBot/2.0 (https://commoncrawl.org/faq/)',
};

describe('HTML_LIMITED_BOTS (blocking <head> metadata)', () => {
  it.each([
    'googlebot',
    'googleInspection',
    'adsBot',
    'bing',
    'oaiSearch',
    'chatgptUser',
    'perplexity',
    'claudeSearch',
    'facebook',
    'twitter',
    'slack',
    'linkedin',
    'telegram',
    'lighthouseLegacy',
    'lighthouseModern',
  ] as const)('gives %s its metadata in <head>', (agent) => {
    expect(HTML_LIMITED_BOTS.test(UA[agent])).toBe(true);
  });

  it.each(['chrome', 'safari'] as const)(
    'leaves %s on streamed metadata (first paint is not blocked)',
    (agent) => {
      expect(HTML_LIMITED_BOTS.test(UA[agent])).toBe(false);
    },
  );

  it.each(['gptbot', 'claudebot', 'ccbot'] as const)(
    'does not list the %s training crawler (robots.ts disallows it)',
    (agent) => {
      expect(HTML_LIMITED_BOTS.test(UA[agent])).toBe(false);
    },
  );

  it('keeps every pattern of Next’s own default list', () => {
    // Replacing the default drops anything omitted; this is the guard against a
    // partial copy. 27 = the 16.4 list.
    expect(NEXT_DEFAULT_LIMITED_BOTS).toHaveLength(27);
    for (const pattern of NEXT_DEFAULT_LIMITED_BOTS) {
      expect(HTML_LIMITED_BOTS.source).toContain(pattern);
    }
  });

  it('adds only agents that are not training crawlers', () => {
    const training =
      /gptbot|claudebot|ccbot|bytespider|cohere|anthropic-ai|omgili|applebot-extended|meta-externalagent/i;
    for (const pattern of ADDED_LIMITED_BOTS) {
      expect(training.test(pattern), pattern).toBe(false);
    }
  });
});
