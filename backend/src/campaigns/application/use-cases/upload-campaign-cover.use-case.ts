import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  FILE_STORAGE_PORT,
  type FileStoragePort,
} from '../ports/file-storage.port';

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png']);

export interface UploadCampaignCoverCommand {
  buffer: Buffer;
  mimeType: string;
  originalName?: string;
  size: number;
}

export interface UploadCampaignCoverResult {
  publicPath: string;
}

@Injectable()
export class UploadCampaignCoverUseCase {
  constructor(
    @Inject(FILE_STORAGE_PORT)
    private readonly fileStorage: FileStoragePort,
  ) {}

  public async execute(
    command: UploadCampaignCoverCommand,
  ): Promise<UploadCampaignCoverResult> {
    if (!command.buffer || command.size <= 0) {
      throw new BadRequestException('Debes enviar una imagen de portada.');
    }

    if (command.size > MAX_COVER_BYTES) {
      throw new BadRequestException('La imagen no puede superar 5 MB.');
    }

    const mimeType = (command.mimeType || '').toLowerCase();
    if (!ALLOWED_MIME.has(mimeType)) {
      throw new BadRequestException('Solo se aceptan imágenes JPG o PNG.');
    }

    const stored = await this.fileStorage.saveCampaignCover({
      buffer: command.buffer,
      mimeType,
    });

    return { publicPath: stored.publicPath };
  }
}
