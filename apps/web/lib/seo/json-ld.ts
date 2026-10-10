/**
 * Serialise a JSON-LD document so it can sit inside an inline
 * `<script type="application/ld+json">` element.
 *
 * Why this exists: `JSON.stringify` output is valid JSON but NOT safe HTML.
 * It leaves `<`, `>` and `&` alone, so a job description containing
 * `</script><script>…` ends the JSON-LD element early and the remainder is
 * parsed as live markup. Job text is authored by employers, and this app's
 * enforced CSP still carries `'unsafe-inline'`, so the policy would not have
 * stopped it. Escaping the three HTML-significant characters (plus the two
 * line separators that are legal in JSON but terminate a JavaScript string
 * literal in older parsers) makes the payload inert while remaining
 * byte-for-byte equivalent JSON — `JSON.parse` of the result returns the
 * original value, which is what search engines do with it.
 */

// Built from code points rather than written as literals: U+2028/U+2029 are
// line terminators in JavaScript source, so a literal one would end the regex.
const LINE_SEPARATOR = new RegExp(String.fromCharCode(0x2028), 'g');
const PARAGRAPH_SEPARATOR = new RegExp(String.fromCharCode(0x2029), 'g');

export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(LINE_SEPARATOR, '\\u2028')
    .replace(PARAGRAPH_SEPARATOR, '\\u2029');
}
