// Resume MIME types, in a module with no imports so anything (a client
// component, the storage layer, the parser) can use them without dragging the
// extraction libraries along.
export const PDF_MIME = 'application/pdf';
export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
