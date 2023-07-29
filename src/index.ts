import { PDFDocument } from 'pdf-lib';
import { Options } from './options';
import { AbstractMaker } from './maker/abstract-maker';
import { DefaultMaker } from './maker/default-maker';
import { PocketModMaker } from './maker/pocketmod-maker';

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
    const options = new Options();

    let maker: AbstractMaker;
    if ((document.getElementById('layout-default') as HTMLInputElement)!.checked) {
        maker = new DefaultMaker();
    } else {
        maker = new PocketModMaker();
    }

    const outputBytes = await maker.make(inputPdf, options);
    let downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(new Blob([outputBytes], {type: 'application/pdf'}));
    downloadLink.download = 'booklet.pdf';
    downloadLink.click();
}
