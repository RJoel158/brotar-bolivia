export const FILE_STORAGE_PORT = Symbol('FILE_STORAGE_PORT');

export interface StoredImage {
  /** Public path beginning with /uploads/... */
  publicPath: string;
  absolutePath: string;
}

export interface FileStoragePort {
  saveCampaignCover(params: {
    buffer: Buffer;
    mimeType: string;
  }): Promise<StoredImage>;
}
