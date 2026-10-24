import { NativeModules, Platform } from 'react-native';

const { InfiniteCanvasModule } = NativeModules;

export interface DocumentMeta {
  id: string;
  title: string;
  updatedAt: number;
  elementCount: number;
  filePath: string;
}

export interface ExportResult {
  filePath: string;
  mimeType: string;
  fileName: string;
}

export const InfiniteCanvasService = {
  async saveDocument(docJson: string): Promise<{ id: string; title: string; updatedAt: number; filePath: string }> {
    if (!InfiniteCanvasModule) throw new Error('ماژول بوم نقاشی در این دستگاه پشتیبانی نمی‌شود.');
    return await InfiniteCanvasModule.saveDocument(docJson);
  },

  async loadDocument(docId: string): Promise<string> {
    if (!InfiniteCanvasModule) throw new Error('ماژول بوم نقاشی در این دستگاه پشتیبانی نمی‌شود.');
    return await InfiniteCanvasModule.loadDocument(docId);
  },

  async listDocuments(): Promise<DocumentMeta[]> {
    if (!InfiniteCanvasModule) return [];
    return await InfiniteCanvasModule.listDocuments();
  },

  async deleteDocument(docId: string): Promise<boolean> {
    if (!InfiniteCanvasModule) return false;
    return await InfiniteCanvasModule.deleteDocument(docId);
  },

  async duplicateDocument(docId: string): Promise<{ id: string; title: string; updatedAt: number }> {
    if (!InfiniteCanvasModule) throw new Error('ماژول بوم نقاشی یافت نشد');
    return await InfiniteCanvasModule.duplicateDocument(docId);
  },

  async renameDocument(docId: string, newTitle: string): Promise<boolean> {
    if (!InfiniteCanvasModule) return false;
    return await InfiniteCanvasModule.renameDocument(docId, newTitle);
  },

  async exportDocument(
    docJson: string,
    format: 'png' | 'jpeg' | 'pdf',
    options?: {
      transparentBackground?: boolean;
      scale?: number;
      quality?: number;
      pageSize?: 'fit' | 'a4_portrait' | 'a4_landscape';
    }
  ): Promise<ExportResult> {
    if (!InfiniteCanvasModule) throw new Error('ماژول بوم نقاشی یافت نشد');
    return await InfiniteCanvasModule.exportDocument(docJson, format, options ?? {});
  },

  async exportActiveCanvas(
    format: 'png' | 'jpeg' | 'pdf',
    options?: {
      transparentBackground?: boolean;
      scale?: number;
      quality?: number;
      pageSize?: 'fit' | 'a4_portrait' | 'a4_landscape';
    }
  ): Promise<ExportResult> {
    if (!InfiniteCanvasModule) throw new Error('ماژول بوم نقاشی یافت نشد');
    if (InfiniteCanvasModule.exportActiveCanvas) {
      return await InfiniteCanvasModule.exportActiveCanvas(format, options ?? {});
    }
    return await InfiniteCanvasModule.exportDocument('{}', format, options ?? {});
  },

  async getActiveDocumentJson(): Promise<string> {
    if (!InfiniteCanvasModule?.getActiveDocumentJson) return '{}';
    return await InfiniteCanvasModule.getActiveDocumentJson();
  },

  async shareFile(filePath: string, mimeType: string, title?: string): Promise<boolean> {
    if (!InfiniteCanvasModule) return false;
    return await InfiniteCanvasModule.shareFile(filePath, mimeType, title ?? 'اشتراک‌گذاری بوم');
  }
};
