import { NativeModules, NativeEventEmitter } from 'react-native';

const { PdfCoreModule } = NativeModules;

if (!PdfCoreModule) {
  throw new Error('PdfCoreModule پیدا نشد. پروژه را Rebuild کنید.');
}

const emitter = new NativeEventEmitter(PdfCoreModule);

export const PdfCore = {
  getPageText: (uri, password, pageIndex) => PdfCoreModule.getPageText(uri, password ?? null, pageIndex),
  searchTextInPdf: (uri, password, keyword) => PdfCoreModule.searchTextInPdf(uri, password ?? null, keyword),
  getInitialUri: () => PdfCoreModule.getInitialPdfUri(),
  onOpenIntent: (callback) => emitter.addListener('onOpenPdfIntent', callback),
  open: (uri, password) => PdfCoreModule.openDocument(uri, password ?? null),
  getPageSize: (docId, pageIndex) => PdfCoreModule.getPageSize(docId, pageIndex),
  renderPage: (docId, pageIndex, width, height, colorMode = 'light') => PdfCoreModule.renderPage(docId, pageIndex, width, height, colorMode),
  close: (docId) => PdfCoreModule.closeDocument(docId),
};

export default PdfCore;