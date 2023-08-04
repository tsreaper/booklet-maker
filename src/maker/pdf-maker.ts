import { PageDrawer } from "./page-drawer";

export interface PdfMaker {
    make(pageDrawer: PageDrawer);
}
