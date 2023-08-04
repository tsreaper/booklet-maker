import { PDFDocument, PDFPage } from "pdf-lib";
import * as pdfjsLib from 'pdfjs-dist';
import * as pdfJsWorker from 'pdfjs-dist/build/pdf.worker.entry';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfJsWorker;

export class LayoutPicker {

    private inputPdf: PDFDocument;

    private numRows;
    private numCols;
    private areaX1 = 0;
    private areaY1 = 0;
    private areaX2 = 1;
    private areaY2 = 1;

    private pageRangeLeftInput: HTMLInputElement;
    private pageRangeRightInput: HTMLInputElement;

    private numRowsInput: HTMLInputElement;
    private numColsInput: HTMLInputElement;
    private rowFirstRadio: HTMLInputElement;

    private upperLeftRadio: HTMLInputElement;
    private bottomCanvas: HTMLCanvasElement;
    private topCanvas: HTMLCanvasElement;

    constructor() {
        this.pageRangeLeftInput = (document.getElementById('page-range-left') as HTMLInputElement);
        this.pageRangeRightInput = (document.getElementById('page-range-right') as HTMLInputElement);

        this.numRowsInput = (document.getElementById('num-rows') as HTMLInputElement);
        this.numColsInput = (document.getElementById('num-cols') as HTMLInputElement);
        this.rowFirstRadio = (document.getElementById('page-order-row-first') as HTMLInputElement);

        this.upperLeftRadio = (document.getElementById('page-area-upper-left') as HTMLInputElement);
        this.bottomCanvas = (document.getElementById('bottom-canvas') as HTMLCanvasElement);
        this.topCanvas = (document.getElementById('top-canvas') as HTMLCanvasElement);

        this.pageRangeLeftInput.addEventListener('change', this.changePageRangeLeft.bind(this));
        this.numRowsInput.addEventListener('change', this.changeNumRows.bind(this));
        this.numColsInput.addEventListener('change', this.changeNumCols.bind(this));
        this.topCanvas.addEventListener('mousedown', this.clickCanvas.bind(this));
    }

    setInputPdf(inputPdf: PDFDocument) {
        this.inputPdf = inputPdf;

        this.changePageRangeLeft();
        this.changeNumRows();
        this.changeNumCols();
    }

    private async extractPdf(pageNum: number) {
        const tmpDoc = await PDFDocument.create();
        const [copiedPage] = await tmpDoc.copyPages(this.inputPdf, [pageNum]);
        tmpDoc.addPage(copiedPage);
        const rawData = await tmpDoc.save();

        const pdfJsDoc = await pdfjsLib.getDocument(rawData).promise;
        const pdfJsPage = await pdfJsDoc.getPage(1);
        const viewport = pdfJsPage.getViewport({ scale: 1.5 });

        const context = this.bottomCanvas.getContext('2d')!;
        this.bottomCanvas.height = viewport.height;
        this.bottomCanvas.width = viewport.width;
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };
        await pdfJsPage.render(renderContext).promise;

        this.topCanvas.height = this.bottomCanvas.height;
        this.topCanvas.width = this.bottomCanvas.width;
        this.redrawArea();
    }

    private changePageRangeLeft() {
        this.extractPdf(this.getPageRangeLeft());
    }

    private changeNumRows() {
        this.numRows = Math.floor(parseFloat(this.numRowsInput.value));
        if (isNaN(this.numRows)) {
            this.numRows = 1;
        }
        this.numRows = Math.max(1, Math.min(50, this.numRows));

        this.redrawArea();
    }

    private changeNumCols() {
        this.numCols = Math.floor(parseFloat(this.numColsInput.value));
        if (isNaN(this.numCols)) {
            this.numCols = 1;
        }
        this.numCols = Math.max(1, Math.min(50, this.numCols));

        this.redrawArea();
    }

    private clickCanvas(event: MouseEvent) {
        const x = event.offsetX / this.topCanvas.width;
        const y = event.offsetY / this.topCanvas.height;
        if (this.upperLeftRadio.checked) {
            this.areaX1 = x;
            this.areaY1 = y;
        } else {
            this.areaX2 = x;
            this.areaY2 = y;
        }

        this.redrawArea();
    }

    private redrawArea() {
        const width = this.topCanvas.width;
        const height = this.topCanvas.height;
        const context = this.topCanvas.getContext('2d')!;
        context.clearRect(0, 0, width, height);
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, width, height);

        const x1 = this.getUpperLeftX() * width;
        const y1 = this.getUpperLeftY() * height;
        const x2 = this.getLowerRightX() * width;
        const y2 = this.getLowerRightY() * height;
        context.clearRect(x1, y1, x2 - x1, y2 - y1);

        const crossLength = 20;
        const crossWidth = 5;
        this.drawCross(context, this.areaX1 * width, this.areaY1 * height, crossLength, crossWidth, 'blue');
        this.drawCross(context, this.areaX2 * width, this.areaY2 * height, crossLength, crossWidth, 'red');

        const cellWidth = this.getCellWidth() * width;
        const cellHeight = this.getCellHeight() * height;
        const cellBorderWidth = 4;
        context.fillStyle = 'green';
        for (let i = 1; i < this.numRows; i++) {
            context.fillRect(x1, y1 + i * cellHeight - cellBorderWidth / 2, x2 - x1, cellBorderWidth);
        }
        for (let i = 1; i < this.numCols; i++) {
            context.fillRect(x1 + i * cellWidth - cellBorderWidth / 2, y1, cellBorderWidth, y2 - y1);
        }
    }

    private drawCross(context: CanvasRenderingContext2D, x: number, y: number, length: number, width: number, color: string) {
        context.fillStyle = color;
        context.fillRect(x - length / 2, y - width / 2, length, width);
        context.fillRect(x - width / 2, y - length / 2, width, length);
    }

    getPageRangeLeft() {
        let pageRangeLeft = Math.floor(parseFloat(this.pageRangeLeftInput.value));
        if (isNaN(pageRangeLeft)) {
            pageRangeLeft = 1;
        }
        return Math.max(1, Math.min(this.inputPdf.getPageCount(), pageRangeLeft)) - 1;
    }

    getPageRangeRight() {
        let pageRangeRight = Math.floor(parseFloat(this.pageRangeRightInput.value));
        if (isNaN(pageRangeRight)) {
            pageRangeRight = this.inputPdf.getPageCount();
        }
        return Math.max(1, Math.min(this.inputPdf.getPageCount(), pageRangeRight)) - 1;
    }

    getNumRows() {
        return this.numRows;
    }

    getNumCols() {
        return this.numCols;
    }

    getUpperLeftX() {
        return Math.min(this.areaX1, this.areaX2);
    }

    getUpperLeftY() {
        return Math.min(this.areaY1, this.areaY2);
    }

    getLowerRightX() {
        return Math.max(this.areaX1, this.areaX2);
    }
    
    getLowerRightY() {
        return Math.max(this.areaY1, this.areaY2);
    }

    getCellWidth() {
        return (this.getLowerRightX() - this.getUpperLeftX()) / this.numCols;
    }

    getCellHeight() {
        return (this.getLowerRightY() - this.getUpperLeftY()) / this.numRows;
    }

    isRowFirst() {
        return this.rowFirstRadio.checked;
    }
}
