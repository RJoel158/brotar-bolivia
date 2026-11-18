import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  FileStoragePort,
  StoredImage,
} from '../../application/ports/file-storage.port';

const COVER_SUBDIR = 'campaign-covers';

@Injectable()
export class LocalFileStorageAdapter implements FileStoragePort {
  private readonly uploadsRoot = join(process.cwd(), 'uploads');

  public async saveCampaignCover(params: {
    buffer: Buffer;
    mimeType: string;
  }): Promise<StoredImage> {
    const extension = params.mimeType === 'image/png' ? '.png' : '.jpg';
    const filename = `${randomUUID()}${extension}`;
    const directory = join(this.uploadsRoot, COVER_SUBDIR);
    await mkdir(directory, { recursive: true });

    const absolutePath = join(directory, filename);
    await writeFile(absolutePath, params.buffer);

    return {
      absolutePath,
      publicPath: `/uploads/${COVER_SUBDIR}/${filename}`,
    };
  }
}
