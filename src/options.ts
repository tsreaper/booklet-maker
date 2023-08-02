export class Options {
    readonly pageSize: [number, number];

    readonly alignSpine: boolean;
    readonly drawFoldingLine: boolean;

    constructor(pageSize: [number, number]) {
        this.pageSize = pageSize;

        this.alignSpine = (document.querySelector('#option-align-spine') as HTMLInputElement).checked;
        this.drawFoldingLine = (document.querySelector('#option-draw-folding-line') as HTMLInputElement).checked;
    }
}
