import { PDFDocument, PDFPage, Rotation, degrees, reduceRotation, toDegrees } from 'pdf-lib';
import { LayoutPicker } from '../layout-picker';
import { Options } from '../options';

export class PageDrawer {

    private inputPdf: PDFDocument;
    private layoutPicker: LayoutPicker;
    private options: Options;

    private inputDegree: number;

    private outputDoc: PDFDocument;
    private copiedPages: PDFPage[];

    constructor(inputPdf: PDFDocument, layoutPicker: LayoutPicker, options: Options) {
        this.inputPdf = inputPdf;
        this.layoutPicker = layoutPicker;
        this.options = options;

        this.inputDegree = reduceRotation(toDegrees(inputPdf.getPage(layoutPicker.getPageRangeLeft()).getRotation()));
    }

    async createOutputDoc() {
        this.outputDoc = await PDFDocument.create();
        const copiedIndices: number[] = [];
        for (let i = this.layoutPicker.getPageRangeLeft(); i <= this.layoutPicker.getPageRangeRight(); i++) {
            copiedIndices.push(i);
        }
        this.copiedPages = await this.outputDoc.copyPages(this.inputPdf, copiedIndices);
    }

    getPageCount() {
        const numInputPages = this.layoutPicker.getPageRangeRight() - this.layoutPicker.getPageRangeLeft() + 1;
        const numRows = this.layoutPicker.getNumRows();
        const numCols = this.layoutPicker.getNumCols();
        return numInputPages * numRows * numCols;
    }

    addPage() {
        this.outputDoc.addPage(this.options.pageSize);
    }

    async drawPage(inputPageIdx: number, outputPageIdx: number, row: number, col: number) {
        const embedded = await this.embedPage(inputPageIdx);
        let inputWidth = embedded.width;
        let inputHeight = embedded.height;
        if (this.inputDegree == 90 || this.inputDegree == 270) {
            [inputWidth, inputHeight] = [inputHeight, inputWidth];
        }

        const outputPage = this.outputDoc.getPage(outputPageIdx);
        const outputWidth = outputPage.getWidth();
        const outputHeight = outputPage.getHeight();

        const scale = Math.min(outputWidth * 0.5 / inputHeight, outputHeight * 0.25 / inputWidth);
        const embeddedDims = embedded.scale(scale);

        let deltaY = 0;
        if (this.options.alignSpine) {
            deltaY = outputHeight / 8 - inputWidth * scale / 2;
            if (row % 2 == 0) {
                deltaY *= -1;
            }
        }
    
        let sgnX, sgnY: number;
        if (this.inputDegree == 90) {
            sgnX = -1;
            sgnY = -1;
        } else if (this.inputDegree == 180) {
            sgnX = -1;
            sgnY = 1;
        } else if (this.inputDegree == 270) {
            sgnX = 1;
            sgnY = 1;
        } else {
            sgnX = 1;
            sgnY = -1;
        }

        if (col == 0) {
            outputPage.drawPage(embedded, {
                ...embeddedDims,
                x: outputWidth / 4 + sgnX * inputHeight * scale / 2,
                y: outputHeight / 8 * (7 - row * 2) + sgnY * inputWidth * scale / 2 + deltaY,
                rotate: degrees(90 - this.inputDegree)
            });
        } else {
            outputPage.drawPage(embedded, {
                ...embeddedDims,
                x: outputWidth / 4 * 3 - sgnX * inputHeight * scale / 2,
                y: outputHeight / 8 * (7 - row * 2) - sgnY * inputWidth * scale / 2 + deltaY,
                rotate: degrees(-90 - this.inputDegree)
            });
        }
    }

    save() {
        if (this.options.drawFoldingLine) {
            this.drawFoldingLine();
        }

        return this.outputDoc.save();
    }

    private embedPage(idx: number) {
        const numRows = this.layoutPicker.getNumRows();
        const numCols = this.layoutPicker.getNumCols();

        let i, j: number;
        if (this.layoutPicker.isRowFirst()) {
            i = Math.floor(idx / numCols) % numRows;
            j = idx % numCols;
        } else {
            j = Math.floor(idx / numRows) % numCols;
            i = idx % numRows;
        }

        const page = this.copiedPages[Math.floor(idx / (numRows * numCols))];
        const x = this.layoutPicker.getUpperLeftX();
        const y = this.layoutPicker.getUpperLeftY();
        const width = this.layoutPicker.getCellWidth();
        const height = this.layoutPicker.getCellHeight();

        if (this.inputDegree == 90) {
            return this.outputDoc.embedPage(page, {
                left: (y + i * height) * page.getWidth(),
                right: (y + (i + 1) * height) * page.getWidth(),
                bottom: (x + j * width) * page.getHeight(),
                top: (x + (j + 1) * width) * page.getHeight(),
            });
        } else if (this.inputDegree == 180) {
            return this.outputDoc.embedPage(page, {
                left: (1 - x - (j + 1) * width) * page.getWidth(),
                right: (1 - x - j * width) * page.getWidth(),
                bottom: (y + i * height) * page.getHeight(),
                top: (y + (i + 1) * height) * page.getHeight(),
            });
        } else if (this.inputDegree == 270) {
            return this.outputDoc.embedPage(page, {
                left: (1 - y - (i + 1) * height) * page.getWidth(),
                right: (1 - y - i * height) * page.getWidth(),
                bottom: (1 - x - (j + 1) * width) * page.getHeight(),
                top: (1 - x - j * width) * page.getHeight(),
            });
        } else {
            return this.outputDoc.embedPage(page, {
                left: (x + j * width) * page.getWidth(),
                right: (x + (j + 1) * width) * page.getWidth(),
                bottom: (1 - y - (i + 1) * height) * page.getHeight(),
                top: (1 - y - i * height) * page.getHeight(),
            });
        }
    }

    private drawFoldingLine() {
        const samplePage = this.outputDoc.getPage(0);
        const pageWidth = samplePage.getWidth();
        const pageHeight = samplePage.getHeight();
    
        const thickness = 0.3;
    
        for (let page of this.outputDoc.getPages()) {
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
