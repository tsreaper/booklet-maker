import { PdfMaker } from './pdf-maker';
import { PageDrawer } from './page-drawer';

export class PocketModMaker implements PdfMaker {

    make(pageDrawer: PageDrawer) {
        const pageCount = pageDrawer.getPageCount();
        const numPages = Math.ceil(pageCount / 8);
        for (let i = 0; i < numPages; i++) {
            pageDrawer.addPage();
        }

        for (let l = 0, r = numPages * 8 - 1, page = 0; l <= r; page++) {
            const lPos = [[0, 0], [0, 1], [1, 1], [2, 1]];
            const rPos = [[1, 0], [2, 0], [3, 0], [3, 1]];
            for (let i = 0; i < 4; i++) {
                if (l < pageCount) {
                    pageDrawer.drawPage(l, page, lPos[i][0], lPos[i][1]);
                }
                l++;
                if (r < pageCount) {
                    pageDrawer.drawPage(r, page, rPos[i][0], rPos[i][1]);
                }
                r--;
            }
        }
    }
}
