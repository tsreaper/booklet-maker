import { PdfMaker } from './pdf-maker';
import { PageDrawer } from './page-drawer';

export class DefaultMaker implements PdfMaker {

    make(pageDrawer: PageDrawer) {
        const pageCount = pageDrawer.getPageCount();
        const numPages = Math.ceil(pageCount / 16) * 2;
        for (let i = 0; i < numPages; i++) {
            pageDrawer.addPage();
        }

        for (let l = 0, r = Math.ceil(pageCount / 4) * 4 - 1, page = 0; l <= r; page += 2) {
            const lPos = [[0, 0, 0], [1, 0, 1], [1, 3, 1], [0, 3, 0], [0, 3, 1], [1, 3, 0], [1, 0, 0], [0, 0, 1]];
            const rPos = [[0, 1, 0], [1, 1, 1], [1, 2, 1], [0, 2, 0], [0, 2, 1], [1, 2, 0], [1, 1, 0], [0, 1, 1]];
            for (let i = 0; i < 8 && l <= r; i++) {
                if (l < pageCount) {
                    pageDrawer.drawPage(l, page + lPos[i][0], lPos[i][1], lPos[i][2]);
                }
                l++;
                if (r < pageCount) {
                    pageDrawer.drawPage(r, page + rPos[i][0], rPos[i][1], rPos[i][2]);
                }
                r--;
            }
        }
    }
}
