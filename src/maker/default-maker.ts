import { PDFDocument } from 'pdf-lib';
import { AbstractMaker } from './abstract-maker';
import { Options } from '../options';

export class DefaultMaker extends AbstractMaker {

    protected async makeImpl(inputPdf: PDFDocument, options: Options, outputDoc: PDFDocument) {
        const numPages = Math.ceil(inputPdf.getPageCount() / 16) * 2;
        for (let i = 0; i < numPages; i++) {
            outputDoc.addPage();
        }

        for (let l = 0, r = Math.ceil(inputPdf.getPageCount() / 4) * 4 - 1, page = 0; l <= r; page += 2) {
            const lPos = [[0, 0, 0], [1, 0, 1], [1, 3, 1], [0, 3, 0], [0, 3, 1], [1, 3, 0], [1, 0, 0], [0, 0, 1]];
            const rPos = [[0, 1, 0], [1, 1, 1], [1, 2, 1], [0, 2, 0], [0, 2, 1], [1, 2, 0], [1, 1, 0], [0, 1, 1]];
            for (let i = 0; i < 8 && l <= r; i++) {
                if (l < inputPdf.getPageCount()) {
                    this.drawInputPage(outputDoc, page + lPos[i][0], lPos[i][1], lPos[i][2], inputPdf.getPage(l), options);
                }
                l++;
                if (r < inputPdf.getPageCount()) {
                    this.drawInputPage(outputDoc, page + rPos[i][0], rPos[i][1], rPos[i][2], inputPdf.getPage(r), options);
                }
                r--;
            }
        }
    }
}
