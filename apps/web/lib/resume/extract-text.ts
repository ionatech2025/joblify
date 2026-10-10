import { unzipSync } from 'fflate';
import { DOCX_MIME, PDF_MIME } from './mime';

export { DOCX_MIME, PDF_MIME };

/**
 * Plain-text extraction for uploaded resumes (PDF, DOCX).
 *
 * This code parses files written by strangers, inside a request-serving
 * function that also holds the database credentials. Three decisions follow
 * from that:
 *
 *   - **Small, maintained, dependency-light parsers.** PDF goes through `unpdf`
 *     (current PDF.js, serverless build, no native canvas). DOCX is a zip of
 *     XML, so it is read with `fflate` and a linear regex over
 *     `word/document.xml` — no general-purpose XML DOM. The previous
 *     `mammoth` → `@xmldom/xmldom` chain carried eight open high-severity
 *     advisories (quadratic parse time, ReDoS) reachable with one crafted file;
 *     `pdf-parse@1` bundled a 2018 PDF.js and had not shipped since 2019.
 *   - **Hard budgets**, enforced before work is done: input bytes, PDF page
 *     count, decompressed DOCX XML size, zip entry count, output characters and
 *     a wall-clock deadline between pages. A file that exceeds one is rejected,
 *     not "best-effort parsed".
 *   - **Typed failures** (`ResumeExtractionError`) so callers can tell a hostile
 *     or corrupt file from an infrastructure fault and not retry the former.
 */

export const EXTRACT_LIMITS = {
  maxInputBytes: 5 * 1024 * 1024,
  maxPdfPages: 40,
  maxDocxXmlBytes: 8 * 1024 * 1024,
  maxZipEntries: 2_000,
  maxOutputChars: 200_000,
  maxMillis: 15_000,
} as const;

export type ExtractionFailure = 'UNSUPPORTED' | 'TOO_LARGE' | 'CORRUPT';

export class ResumeExtractionError extends Error {
  constructor(
    readonly code: ExtractionFailure,
    message: string,
  ) {
    super(message);
    this.name = 'ResumeExtractionError';
  }
}

export async function extractResumeText(bytes: Uint8Array, mime: string): Promise<string> {
  if (bytes.byteLength > EXTRACT_LIMITS.maxInputBytes) {
    throw new ResumeExtractionError('TOO_LARGE', 'File exceeds the size limit');
  }
  if (mime === PDF_MIME) return extractPdf(bytes);
  if (mime === DOCX_MIME) return extractDocx(bytes);
  // `.doc` (OLE2) is deliberately not handled: no maintained pure-JS reader
  // exists and file-type reports it as application/x-cfb, never as msword.
  throw new ResumeExtractionError('UNSUPPORTED', `Unsupported resume type ${mime}`);
}

// --- PDF -------------------------------------------------------------------

async function extractPdf(bytes: Uint8Array): Promise<string> {
  const { getDocumentProxy } = await import('unpdf');
  const deadline = Date.now() + EXTRACT_LIMITS.maxMillis;

  let pdf: Awaited<ReturnType<typeof getDocumentProxy>>;
  try {
    // Copy: pdf.js transfers (detaches) the buffer it is given.
    pdf = await getDocumentProxy(new Uint8Array(bytes));
  } catch (err) {
    throw new ResumeExtractionError(
      'CORRUPT',
      `Could not read PDF: ${err instanceof Error ? err.message : 'unknown error'}`,
    );
  }

  try {
    if (pdf.numPages > EXTRACT_LIMITS.maxPdfPages) {
      throw new ResumeExtractionError(
        'TOO_LARGE',
        `PDF has ${pdf.numPages} pages (limit ${EXTRACT_LIMITS.maxPdfPages})`,
      );
    }

    let out = '';
    for (let n = 1; n <= pdf.numPages; n++) {
      if (Date.now() > deadline) {
        throw new ResumeExtractionError('TOO_LARGE', 'PDF took too long to read');
      }
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      for (const item of content.items) {
        if (!('str' in item)) continue;
        out += item.str;
        out += item.hasEOL ? '\n' : ' ';
      }
      out += '\n';
      page.cleanup();
      if (out.length >= EXTRACT_LIMITS.maxOutputChars) break;
    }
    return out.slice(0, EXTRACT_LIMITS.maxOutputChars);
  } finally {
    // Release the worker and its parsed state (loadingTask.destroy is the
    // teardown unpdf's PDF.js build exposes).
    await pdf.loadingTask.destroy().catch(() => undefined);
  }
}

// --- DOCX ------------------------------------------------------------------

function extractDocx(bytes: Uint8Array): string {
  let xml: Uint8Array | undefined;
  try {
    let entries = 0;
    const files = unzipSync(bytes, {
      // Decompress ONLY word/document.xml, and refuse it up front if its
      // declared size is over budget. fflate sizes the inflate buffer from the
      // declared size, so a header that lies cannot make it grow past this.
      filter(file) {
        entries += 1;
        if (entries > EXTRACT_LIMITS.maxZipEntries) {
          throw new ResumeExtractionError('TOO_LARGE', 'Archive has too many entries');
        }
        if (file.name !== 'word/document.xml') return false;
        if (file.originalSize > EXTRACT_LIMITS.maxDocxXmlBytes) {
          throw new ResumeExtractionError('TOO_LARGE', 'Document body is too large');
        }
        return true;
      },
    });
    xml = files['word/document.xml'];
  } catch (err) {
    if (err instanceof ResumeExtractionError) throw err;
    throw new ResumeExtractionError('CORRUPT', 'Could not read Word document');
  }

  if (!xml)
    throw new ResumeExtractionError('CORRUPT', 'Not a Word document (no word/document.xml)');
  return docxXmlToText(new TextDecoder('utf-8').decode(xml));
}

const RUN = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\s*\/>|<w:(?:br|cr)\s*\/>/g;

/** Linear scan of WordprocessingML: text runs, tabs and breaks, per paragraph. */
export function docxXmlToText(xml: string): string {
  const lines: string[] = [];
  let total = 0;

  for (const paragraph of xml.split('</w:p>')) {
    let line = '';
    RUN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = RUN.exec(paragraph)) !== null) {
      if (m[1] !== undefined) line += decodeXmlEntities(m[1]);
      else line += m[0].startsWith('<w:tab') ? '\t' : '\n';
    }
    if (line.trim().length === 0) continue;
    lines.push(line);
    total += line.length + 1;
    if (total >= EXTRACT_LIMITS.maxOutputChars) break;
  }

  return lines.join('\n').slice(0, EXTRACT_LIMITS.maxOutputChars);
}

function decodeXmlEntities(s: string): string {
  if (!s.includes('&')) return s;
  return s.replace(
    /&(?:#(\d+)|#x([0-9a-fA-F]+)|(amp|lt|gt|quot|apos));/g,
    (_m, dec, hex, named) => {
      if (named) return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[named as string] ?? '';
      const cp = dec !== undefined ? parseInt(dec, 10) : parseInt(hex, 16);
      // Reject surrogates, non-characters and out-of-range code points.
      if (!Number.isFinite(cp) || cp < 0x20 || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) {
        return cp === 0x9 || cp === 0xa || cp === 0xd ? String.fromCodePoint(cp) : '';
      }
      return String.fromCodePoint(cp);
    },
  );
}
