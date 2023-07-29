import { PDFDocument, PDFPage, degrees } from 'pdf-lib';
import { Options } from './options';

document.getElementById('submit')!.addEventListener('click', (event) => {
    const fileInput = (document.getElementById('file-input') as HTMLInputElement)!;
    if (fileInput.files == null || fileInput.files.length < 1) {
        alert('Please choose a PDF file for typesetting.');
        return;
    }

    const file = fileInput.files![0];
    const reader = new FileReader();
    reader.onload = pdfLoaded;
    reader.readAsArrayBuffer(file);
});

async function pdfLoaded() {
    const inputPdf = await PDFDocument.load(this.result);
    const outputDoc = await PDFDocument.create();
    const numPages = Math.ceil(inputPdf.getPageCount() / 16) * 2;
    for (let i = 0; i < numPages; i++) {
        outputDoc.addPage();
    }
    const options = new Options();

    for (let l = 0, r = Math.ceil(inputPdf.getPageCount() / 4) * 4 - 1, page = 0; l <= r; page += 2) {
        const lPos = [[0, 0, 0], [1, 0, 1], [1, 3, 1], [0, 3, 0], [0, 3, 1], [1, 3, 0], [1, 0, 0], [0, 0, 1]];
        const rPos = [[0, 1, 0], [1, 1, 1], [1, 2, 1], [0, 2, 0], [0, 2, 1], [1, 2, 0], [1, 1, 0], [0, 1, 1]];
        for (let i = 0; i < 8 && l <= r; i++) {
            if (l < inputPdf.getPageCount()) {
                drawInputPage(outputDoc, page + lPos[i][0], lPos[i][1], lPos[i][2], inputPdf.getPage(l), options);
            }
            l++;
            if (r < inputPdf.getPageCount()) {
                drawInputPage(outputDoc, page + rPos[i][0], rPos[i][1], rPos[i][2], inputPdf.getPage(r), options);
            }
            r--;
        }
    }

    if (options.shouldDrawFoldingLine()) {
        drawFoldingLine(outputDoc);
    }

    const outputBytes = await outputDoc.save();
    let downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(new Blob([outputBytes], {type: 'application/pdf'}));
    downloadLink.download = 'booklet.pdf';
    downloadLink.click();
}

async function drawInputPage(outputDoc: PDFDocument, page: number, row: number, col: number, inputPage: PDFPage, options: Options) {
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

function drawFoldingLine(outputDoc: PDFDocument) {
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
