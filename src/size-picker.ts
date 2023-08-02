const MM_TO_INCHES = 1 / 25.4;
const DEFAULT_DPI = 72;
const DEFAULT_PAPER = 'A4';
const PAPER = {
    'A3 (297 x 420 mm)': [297 * MM_TO_INCHES, 420 * MM_TO_INCHES],
    'A4 (210 x 297 mm)': [210 * MM_TO_INCHES, 297 * MM_TO_INCHES],
    'A5 (148 x 210 mm)': [148 * MM_TO_INCHES, 210 * MM_TO_INCHES],
    'US Letter (8.5 x 11 inches)': [8.5, 11],
};

export class SizePicker {

    readonly div: HTMLDivElement;

    private sizeSelector: HTMLSelectElement;

    private customDiv: HTMLDivElement;
    private widthInput: HTMLInputElement;
    private heightInput: HTMLInputElement;
    private mmOrInches: HTMLSelectElement;

    constructor() {
        this.div = document.createElement('div');

        let innerHtml = '';
        for (let paper in PAPER) {
            innerHtml += `<option value="${paper}" ${paper.startsWith(DEFAULT_PAPER) ? 'selected' : ''}>${paper}</option>\n`;
        }
        innerHtml += '<option value="custom">Custom</option>\n';

        this.sizeSelector = document.createElement('select');
        this.sizeSelector.innerHTML = innerHtml;

        this.div.appendChild(this.sizeSelector);
        
        this.widthInput = document.createElement('input');
        this.widthInput.style.width = '50px';
        this.heightInput = document.createElement('input');
        this.heightInput.style.width = '50px';
        this.mmOrInches = document.createElement('select');
        this.mmOrInches.innerHTML = '<option value="mm">mm</option>\n<option value="inches">inches</option>\n';
        this.mmOrInches.style.marginLeft = '5px';

        this.customDiv = document.createElement('div');
        this.customDiv.appendChild(this.widthInput);
        const x = document.createElement('span');
        x.innerHTML = ' x ';
        this.customDiv.appendChild(x);
        this.customDiv.appendChild(this.heightInput);
        this.customDiv.append(this.mmOrInches);

        this.customDiv.style.marginLeft = '5px';
        this.customDiv.style.display = 'none';
        this.div.appendChild(this.customDiv);

        this.sizeSelector.addEventListener('change', () => {
            if (this.sizeSelector.value == 'custom') {
                this.customDiv.style.display = 'inline';
            } else {
                this.customDiv.style.display = 'none';
            }
        });
    }

    getPageSizeInPixels(): [number, number] | null {
        const key = this.sizeSelector.value;
        if (key == 'custom') {
            const k = this.mmOrInches.value == 'mm' ? MM_TO_INCHES : 1;
            const width = Number.parseFloat(this.widthInput.value) * k;
            const height = Number.parseFloat(this.heightInput.value) * k;
            if (isNaN(width) || isNaN(height)) {
                return null;
            } else {
                return [width * DEFAULT_DPI, height * DEFAULT_DPI];
            }
        } else {
            return [PAPER[key][0] * DEFAULT_DPI, PAPER[key][1] * DEFAULT_DPI];
        }
    }
}
