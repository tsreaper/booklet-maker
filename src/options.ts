export class Options {
    private alignSpine: boolean;
    private drawFoldingLine: boolean;

    constructor() {
        this.alignSpine = (document.querySelector('#option-align-spine') as HTMLInputElement).checked;
        this.drawFoldingLine = (document.querySelector('#option-draw-folding-line') as HTMLInputElement).checked;
    }

    shouldAlignSpine() {
        return this.alignSpine;
    }

    shouldDrawFoldingLine() {
        return this.drawFoldingLine;
    }
}
