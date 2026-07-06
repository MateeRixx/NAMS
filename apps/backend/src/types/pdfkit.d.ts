declare module 'pdfkit' {
  import { EventEmitter } from 'events';

  interface PDFDocumentOptions {
    size?: string | [number, number];
    margin?: number;
    info?: Record<string, string | undefined>;
    bufferPages?: boolean;
  }

  class PDFDocument extends EventEmitter {
    constructor(options?: PDFDocumentOptions);
    font(font: string): this;
    fontSize(size: number): this;
    fillColor(color: string): this;
    text(
      text: string,
      x?: number,
      y?: number,
      options?: {
        width?: number;
        align?: string;
        lineBreak?: boolean;
        indent?: number;
        paragraphGap?: number;
        columns?: number;
        columnGap?: number;
        height?: number;
        ellipsis?: boolean;
      }
    ): this;
    rect(x: number, y: number, w: number, h: number): this;
    roundedRect(x: number, y: number, w: number, h: number, r: number): this;
    fill(color?: string): this;
    stroke(color?: string): this;
    lineWidth(w: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    end(): void;
    pipe(destination: NodeJS.WritableStream): this;
  }

  export default PDFDocument;
}
