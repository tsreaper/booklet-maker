import { PDFDocument } from 'pdf-lib';
import { AbstractMaker } from './abstract-maker';
import { Options } from '../options';

export class PocketModMaker extends AbstractMaker {

    protected async makeImpl(inputPdf: PDFDocument, options: Options, outputDoc: PDFDocument) {
        const numPages = Math.ceil(inputPdf.getPageCount() / 8);
        for (let i = 0; i < numPages; i++) {
            outputDoc.addPage(options.pageSize);
        }

        for (let l = 0, r = numPages * 8 - 1, page = 0; l <= r; page++) {
            const lPos = [[0, 0], [0, 1], [1, 1], [2, 1]];
            const rPos = [[1, 0], [2, 0], [3, 0], [3, 1]];
            for (let i = 0; i < 4; i++) {
                if (l < inputPdf.getPageCount()) {
                    this.drawInputPage(outputDoc, page, lPos[i][0], lPos[i][1], inputPdf.getPage(l), options);
                }
                l++;
                if (r < inputPdf.getPageCount()) {
                    this.drawInputPage(outputDoc, page, rPos[i][0], rPos[i][1], inputPdf.getPage(r), options);
                }
                r--;
            }
        }
    }
}
