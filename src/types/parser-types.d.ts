/**
 * Type declarations for parser libraries
 */

declare module 'pdf-parse' {
  interface PDFInfo {
    Title?: string;
    Author?: string;
    Subject?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
  }

  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    text: string;
    version: string;
  }

  function pdfParse(buffer: Buffer): Promise<PDFParseResult>;
  export = pdfParse;
}

declare module 'mammoth' {
  interface ExtractRawTextOptions {
    buffer: Buffer;
  }

  interface ExtractRawTextResult {
    value: string;
    messages: any[];
  }

  export function extractRawText(options: ExtractRawTextOptions): Promise<ExtractRawTextResult>;
}

declare module 'node-html-parser' {
  interface HTMLElement {
    text?: string;
    querySelector(selector: string): HTMLElement | null;
    querySelectorAll(selector: string): HTMLElement[];
    remove(): void;
  }

  export function parse(html: string): HTMLElement;
}

declare module 'file-type' {
  interface FileTypeResult {
    ext: string;
    mime: string;
  }

  export function fileTypeFromBuffer(buffer: Buffer): Promise<FileTypeResult | undefined>;
}
