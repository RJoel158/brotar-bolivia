import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { UploadCampaignCoverUseCase } from './upload-campaign-cover.use-case';
import type { FileStoragePort } from '../ports/file-storage.port';

describe('UploadCampaignCoverUseCase', () => {
  let useCase: UploadCampaignCoverUseCase;
  let fileStorage: { saveCampaignCover: jest.Mock };

  beforeEach(() => {
    fileStorage = {
      saveCampaignCover: jest.fn().mockResolvedValue({
        publicPath: '/uploads/campaign-covers/abc.jpg',
        absolutePath: '/tmp/abc.jpg',
      }),
    };
    useCase = new UploadCampaignCoverUseCase(
      fileStorage as unknown as FileStoragePort,
    );
  });

  it('stores a valid jpeg cover and returns public path', async () => {
    const result = await useCase.execute({
      buffer: Buffer.from([1, 2, 3]),
      mimeType: 'image/jpeg',
      size: 3,
    });

    expect(result.publicPath).toBe('/uploads/campaign-covers/abc.jpg');
    expect(fileStorage.saveCampaignCover).toHaveBeenCalledWith({
      buffer: expect.any(Buffer),
      mimeType: 'image/jpeg',
    });
  });

  it('rejects unsupported mime types', async () => {
    await expect(
      useCase.execute({
        buffer: Buffer.from([1]),
        mimeType: 'image/gif',
        size: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fileStorage.saveCampaignCover).not.toHaveBeenCalled();
  });

  it('rejects files larger than 5MB', async () => {
    await expect(
      useCase.execute({
        buffer: Buffer.alloc(10),
        mimeType: 'image/png',
        size: 5 * 1024 * 1024 + 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
