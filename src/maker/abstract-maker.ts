import { PDFDocument, PDFPage, degrees } from 'pdf-lib';
import { Options } from '../options';

export abstract class AbstractMaker {

    async make(inputPdf: PDFDocument, options: Options) {
        const outputDoc = await PDFDocument.create();
        this.makeImpl(inputPdf, options, outputDoc);

        if (options.shouldDrawFoldingLine()) {
            this.drawFoldingLine(outputDoc);
        }
    
        return outputDoc.save();
    };

    protected abstract makeImpl(inputPdf: PDFDocument, options: Options, outputDoc: PDFDocument): void;

    protected async drawInputPage(outputDoc: PDFDocument, page: number, row: number, col: number, inputPage: PDFPage, options: Options) {
        const inputWidth = inputPage.getWidth();
        const inputHeight = inputPage.getHeight();
    
        const outputPage = outputDoc.getPage(page);
        const outputWidth = outputPage.getWidth();
        const outputHeight = outputPage.getHeight();
    
        const scale = Math.min(outputWidth * 0.5 / inputHeight, outputHeight * 0.25 / inputWidth);
        const embedded = await outputDoc.embedPage(inputPage);
        const embeddedDims = embedded.scale(scale);
    
        let deltaY = 0;
        if (options.shouldAlignSpine()) {
            deltaY = outputHeight / 8 - inputWidth * scale / 2;
            if (row % 2 == 0) {
                deltaY *= -1;
            }
        }
    
        if (col == 0) {
            outputPage.drawPage(embedded, {
                ...embeddedDims,
                x: outputWidth / 4 + inputHeight * scale / 2,
                y: outputHeight / 8 * (7 - row * 2) - inputWidth * scale / 2 + deltaY,
                rotate: degrees(90)
            });
        } else {
            outputPage.drawPage(embedded, {
                ...embeddedDims,
                x: outputWidth / 4 * 3 - inputHeight * scale / 2,
                y: outputHeight / 8 * (7 - row * 2) + inputWidth * scale / 2 + deltaY,
                rotate: degrees(-90)
            });
        }
    }

    protected drawFoldingLine(outputDoc: PDFDocument) {
        const samplePage = outputDoc.getPage(0);
        const pageWidth = samplePage.getWidth();
        const pageHeight = samplePage.getHeight();
    
        const thickness = 0.3;
    
        for (let page of outputDoc.getPages()) {
            for (let i = 0; i < 3; i++) {
                const y = pageHeight / 4 * (i + 1);
                page.drawLine({
                    start: { x: 0, y: y },
                    end: { x: pageWidth, y: y },
                    thickness: thickness,
                    dashArray: [7, 3, 1, 3]
                });
            }
    
            const x = pageWidth / 2;
            page.drawLine({
                start: { x: x, y: 0 },
                end: { x: x, y: pageHeight },
                thickness: thickness,
                dashArray: [7, 3, 1, 3]
            });
        }
    }
}
