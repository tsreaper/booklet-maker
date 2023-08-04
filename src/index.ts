import { PDFDocument } from 'pdf-lib';
import { Options } from './options';
import { DefaultMaker } from './maker/default-maker';
import { PocketModMaker } from './maker/pocketmod-maker';
import { SizePicker } from './size-picker';
import { LayoutPicker } from './layout-picker';
import { PdfMaker } from './maker/pdf-maker';
import { PageDrawer } from './maker/page-drawer';

const fileInput = (document.getElementById('file-input') as HTMLInputElement)!;
const craftingArea = document.getElementById('crafting-area')!;
fileInput.addEventListener('change', () => {
    if (fileInput.files == null || fileInput.files.length < 1) {
        craftingArea.style.display = 'none';
    } else {
        const file = fileInput.files![0];
        const reader = new FileReader();
        reader.onload = pdfLoaded;
        reader.readAsArrayBuffer(file);
    }
});

const layoutPicker = new LayoutPicker();
const sizePicker = new SizePicker();
document.getElementById('paper-size-div')!.appendChild(sizePicker.div);

let inputPdf: PDFDocument;

async function pdfLoaded() {
    inputPdf = await PDFDocument.load(this.result);
    layoutPicker.setInputPdf(inputPdf);
    craftingArea.style.display = 'block';
}

document.getElementById('submit')!.addEventListener('click', async () => {
    const pageSize = sizePicker.getPageSizeInPixels();
    if (pageSize == null) {
        alert('Please input width and height of exported page as numbers.');
        return;
    }
    const options = new Options(pageSize);

    const pageDrawer = new PageDrawer(inputPdf, layoutPicker, options);
    await pageDrawer.createOutputDoc();

    let maker: PdfMaker;
    if ((document.getElementById('output-layout-default') as HTMLInputElement)!.checked) {
        maker = new DefaultMaker();
    } else {
        maker = new PocketModMaker();
    }
    maker.make(pageDrawer);

    const outputBytes = await pageDrawer.save();
    let downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(new Blob([outputBytes], {type: 'application/pdf'}));
    downloadLink.download = 'booklet.pdf';
    downloadLink.click();
});
