import { describe, it, expect } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import {
  DOCX_MIME,
  EXTRACT_LIMITS,
  PDF_MIME,
  ResumeExtractionError,
  docxXmlToText,
  extractResumeText,
} from '@/lib/resume/extract-text';

// These run the REAL parsers (unpdf's PDF.js build, fflate) on real files built
// in the test — the resume pipeline's only defence against hostile uploads is
// this module, so it is exercised end to end rather than mocked.

/** A minimal, valid, text-only PDF with one line of text per page. */
function makePdf(pages: string[]): Uint8Array {
  const objs: string[] = [];
  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
  objs.push('<< /Type /Catalog /Pages 2 0 R >>');
  objs.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  const fontId = 3 + pages.length * 2;
  pages.forEach((text, i) => {
    const contentId = 4 + i * 2;
    objs.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R ` +
        `/Resources << /Font << /F1 ${fontId} 0 R >> >> >>`,
    );
    const stream = `BT /F1 12 Tf 72 720 Td (${text.replace(/[()\\]/g, '\\$&')}) Tj ET`;
    objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return strToU8(out);
}

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
function makeDocx(bodyXml: string, extraFiles: Record<string, Uint8Array> = {}): Uint8Array {
  const doc = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="${W}"><w:body>${bodyXml}</w:body></w:document>`;
  return zipSync({
    '[Content_Types].xml': strToU8('<Types/>'),
    'word/document.xml': strToU8(doc),
    ...extraFiles,
  });
}

describe('PDF', () => {
  it('extracts text from a real PDF', async () => {
    const text = await extractResumeText(makePdf(['Jane Doe, Platform Engineer']), PDF_MIME);
    expect(text).toContain('Jane Doe, Platform Engineer');
  });

  it('reads every page up to the budget', async () => {
    const text = await extractResumeText(makePdf(['first page', 'second page']), PDF_MIME);
    expect(text).toContain('first page');
    expect(text).toContain('second page');
  });

  it('refuses a document over the page budget instead of grinding through it', async () => {
    const pages = Array.from({ length: EXTRACT_LIMITS.maxPdfPages + 1 }, (_, i) => `page ${i}`);
    await expect(extractResumeText(makePdf(pages), PDF_MIME)).rejects.toMatchObject({
      name: 'ResumeExtractionError',
      code: 'TOO_LARGE',
    });
  });

  it('reports garbage as CORRUPT, not as an infrastructure fault', async () => {
    await expect(
      extractResumeText(strToU8('%PDF-1.4 this is not really a pdf'), PDF_MIME),
    ).rejects.toMatchObject({ code: 'CORRUPT' });
  });
});

describe('DOCX', () => {
  it('extracts paragraphs, tabs and entities from a real .docx', async () => {
    const bytes = makeDocx(
      '<w:p><w:r><w:t>Jane Doe</w:t></w:r></w:p>' +
        '<w:p><w:r><w:t xml:space="preserve">R&amp;D </w:t></w:r><w:r><w:tab/><w:t>Engineer &lt;Lead&gt;</w:t></w:r></w:p>' +
        '<w:p><w:r><w:t>&#169; 2026</w:t></w:r></w:p>',
    );
    const text = await extractResumeText(bytes, DOCX_MIME);
    expect(text).toBe('Jane Doe\nR&D \tEngineer <Lead>\n© 2026');
  });

  it('ignores every other file in the archive (media, macros, embeddings)', async () => {
    const bytes = makeDocx('<w:p><w:r><w:t>hello</w:t></w:r></w:p>', {
      'word/vbaProject.bin': strToU8('MACRO'),
      'word/media/image1.png': new Uint8Array(1000),
    });
    expect(await extractResumeText(bytes, DOCX_MIME)).toBe('hello');
  });

  it('refuses an archive with a decompressed body over budget (a zip bomb)', async () => {
    // ~9 MB of XML that compresses to a few KB.
    const run = '<w:p><w:r><w:t>aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</w:t></w:r></w:p>';
    const bomb = run.repeat(Math.ceil((EXTRACT_LIMITS.maxDocxXmlBytes + 1024) / run.length));
    const bytes = makeDocx(bomb);
    expect(bytes.byteLength).toBeLessThan(EXTRACT_LIMITS.maxInputBytes);
    await expect(extractResumeText(bytes, DOCX_MIME)).rejects.toMatchObject({ code: 'TOO_LARGE' });
  });

  it('refuses an archive with an absurd number of entries', async () => {
    const many: Record<string, Uint8Array> = {};
    for (let i = 0; i < EXTRACT_LIMITS.maxZipEntries + 5; i++) many[`junk/${i}.txt`] = strToU8('x');
    await expect(extractResumeText(makeDocx('<w:p/>', many), DOCX_MIME)).rejects.toMatchObject({
      code: 'TOO_LARGE',
    });
  });

  it('a zip with no word/document.xml is not a Word document', async () => {
    const bytes = zipSync({ 'readme.txt': strToU8('hi') });
    await expect(extractResumeText(bytes, DOCX_MIME)).rejects.toMatchObject({ code: 'CORRUPT' });
  });

  it('arbitrary bytes are CORRUPT', async () => {
    await expect(extractResumeText(strToU8('PK nope'), DOCX_MIME)).rejects.toMatchObject({
      code: 'CORRUPT',
    });
  });
});

describe('guards', () => {
  it('refuses input over the byte budget before parsing anything', async () => {
    const big = new Uint8Array(EXTRACT_LIMITS.maxInputBytes + 1);
    await expect(extractResumeText(big, PDF_MIME)).rejects.toMatchObject({ code: 'TOO_LARGE' });
  });

  it('refuses unsupported types, including legacy .doc', async () => {
    for (const mime of ['application/msword', 'application/x-cfb', 'text/html']) {
      await expect(extractResumeText(new Uint8Array(4), mime)).rejects.toBeInstanceOf(
        ResumeExtractionError,
      );
    }
  });
});

describe('docxXmlToText', () => {
  it('is linear on pathological input (no catastrophic backtracking)', () => {
    const nasty = '<w:p>' + '<w:t ' + 'a="b" '.repeat(20_000) + '</w:p>'; // unterminated tag soup
    const t0 = performance.now();
    docxXmlToText(nasty);
    expect(performance.now() - t0).toBeLessThan(500);
  });

  it('drops invalid numeric entities instead of emitting them', () => {
    expect(docxXmlToText('<w:p><w:t>a&#0;b&#xD800;c</w:t></w:p>')).toBe('abc');
  });
});
