import { Test, TestingModule } from '@nestjs/testing';
import { FileUploadService } from './file-upload.service';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

const mockS3Client = {
  send: jest.fn(),
  config: {} as S3Client['config'],
  destroy: jest.fn(),
  middlewareStack: {} as S3Client['middlewareStack'],
} as jest.Mocked<S3Client>;

const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<
  typeof getSignedUrl
>;

// Mock the S3Client constructor to return our mock
(S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(
  () => mockS3Client,
);

describe('FileUploadService', () => {
  let service: FileUploadService;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      AWS_BUCKET_REGION: 'us-east-1',
      AWS_ACCESS_KEY: 'test-access-key',
      AWS_SECRET_KEY: 'test-secret-key',
      AWS_S3_BUCKET_NAME: 'test-bucket',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FileUploadService],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Service initialization', () => {
    it('should create service with proper configuration when all environment variables are present', () => {
      expect(service).toBeDefined();
    });

    it('should handle all missing environment variables gracefully', () => {
      process.env = {};

      const testService = new FileUploadService();

      expect(testService).toBeDefined();
      expect(S3Client).toHaveBeenCalledWith({
        region: '',
        credentials: {
          accessKeyId: '',
          secretAccessKey: '',
        },
      });
    });
  });

  describe('generateVariationImageUploadUrl', () => {
    const validVariationId = 'variation-123';
    const validFileName = 'test-image.jpg';
    const validContentType = 'image/jpeg';

    beforeEach(() => {
      mockGetSignedUrl.mockResolvedValue('https://test-presigned-url.com');
    });

    it('should create PutObjectCommand with correct parameters', async () => {
      await service.generateVariationImageUploadUrl(
        validVariationId,
        validFileName,
        validContentType,
      );

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(PutObjectCommand),
        { expiresIn: 3600 },
      );

      const callArgs = mockGetSignedUrl.mock.calls[0];
      expect(callArgs).toBeDefined();
      expect(callArgs[0]).toBe(mockS3Client);
      expect(callArgs[1]).toBeInstanceOf(PutObjectCommand);
      expect(callArgs[2]).toEqual({ expiresIn: 3600 });
    });

    it('should return presigned URL and S3 key', async () => {
      const result = await service.generateVariationImageUploadUrl(
        validVariationId,
        validFileName,
        validContentType,
      );

      expect(result).toEqual({
        presignedUrl: 'https://test-presigned-url.com',
        s3Key: expect.stringMatching(
          /^variations\/variation-123\/\d+-test-image\.jpg$/,
        ) as string,
      });
    });

    it('should generate unique S3 keys for multiple calls', async () => {
      const result1 = await service.generateVariationImageUploadUrl(
        validVariationId,
        validFileName,
        validContentType,
      );

      await new Promise((resolve) => setTimeout(resolve, 1));

      const result2 = await service.generateVariationImageUploadUrl(
        validVariationId,
        validFileName,
        validContentType,
      );

      expect(result1.s3Key).not.toBe(result2.s3Key);
    });

    it('should handle S3 service failure', async () => {
      mockGetSignedUrl.mockRejectedValue(new Error('S3 service unavailable'));

      await expect(
        service.generateVariationImageUploadUrl(
          validVariationId,
          validFileName,
          validContentType,
        ),
      ).rejects.toThrow('S3 service unavailable');
    });

    it('should throw error for invalid file extension', async () => {
      await expect(
        service.generateVariationImageUploadUrl(
          validVariationId,
          'document.pdf',
          validContentType,
        ),
      ).rejects.toThrow('Only image files are allowed');
    });

    it('should throw error for invalid content type', async () => {
      await expect(
        service.generateVariationImageUploadUrl(
          validVariationId,
          validFileName,
          'application/pdf',
        ),
      ).rejects.toThrow('Only image files are allowed');
    });
  });

  describe('getPreSignedURLForView', () => {
    const testS3Key = 'variations/123/test-image.jpg';

    beforeEach(() => {
      mockGetSignedUrl.mockResolvedValue('https://test-view-url.com');
    });

    it('should create GetObjectCommand with correct parameters', async () => {
      await service.getPreSignedURLForView(testS3Key);

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(GetObjectCommand),
        { expiresIn: 300 },
      );

      const callArgs = mockGetSignedUrl.mock.calls[0];
      expect(callArgs).toBeDefined();
      expect(callArgs[0]).toBe(mockS3Client);
      expect(callArgs[1]).toBeInstanceOf(GetObjectCommand);
      expect(callArgs[2]).toEqual({ expiresIn: 300 });
    });

    it('should return presigned URL for viewing', async () => {
      const result = await service.getPreSignedURLForView(testS3Key);

      expect(result).toBe('https://test-view-url.com');
    });

    it('should handle S3 service failure', async () => {
      mockGetSignedUrl.mockRejectedValue(new Error('S3 service error'));

      await expect(service.getPreSignedURLForView(testS3Key)).rejects.toThrow(
        'S3 service error',
      );
    });
  });

  describe('getPublicUrl', () => {
    it('should generate correct public URL', () => {
      const s3Key = 'variations/123/test-image.jpg';
      const result = service.getPublicUrl(s3Key);

      expect(result).toBe(
        'https://test-bucket.s3.amazonaws.com/variations/123/test-image.jpg',
      );
    });
  });

  describe('Image validation tests', () => {
    const validVariationId = 'variation-123';

    beforeEach(() => {
      mockGetSignedUrl.mockResolvedValue('https://test-presigned-url.com');
    });

    describe('Valid image files should be accepted', () => {
      const validImageCases = [
        {
          fileName: 'image.jpg',
          contentType: 'image/jpeg',
          description: 'JPEG with .jpg extension',
        },
        {
          fileName: 'image.jpeg',
          contentType: 'image/jpeg',
          description: 'JPEG with .jpeg extension',
        },
        {
          fileName: 'image.png',
          contentType: 'image/png',
          description: 'PNG file',
        },
      ];

      it.each(validImageCases)(
        'should accept $description',
        async ({ fileName, contentType }) => {
          await expect(
            service.generateVariationImageUploadUrl(
              validVariationId,
              fileName,
              contentType,
            ),
          ).resolves.toEqual({
            presignedUrl: 'https://test-presigned-url.com',
            s3Key: expect.stringMatching(
              new RegExp(`^variations/${validVariationId}/\\d+-${fileName}$`),
            ) as string,
          });
        },
      );
    });

    describe('Invalid content types should be rejected', () => {
      const invalidContentTypes = [
        { contentType: 'application/pdf', description: 'PDF document' },
        { contentType: 'video/mp4', description: 'MP4 video' },
        { contentType: 'audio/mp3', description: 'MP3 audio' },
      ];

      it.each(invalidContentTypes)(
        'should reject $description',
        async ({ contentType }) => {
          await expect(
            service.generateVariationImageUploadUrl(
              validVariationId,
              'file.jpg',
              contentType,
            ),
          ).rejects.toThrow('Only image files are allowed');
        },
      );
    });

    describe('Invalid file extensions should be rejected', () => {
      const invalidExtensions = [
        { fileName: 'document.pdf', description: 'PDF extension' },
        { fileName: 'video.mp4', description: 'MP4 extension' },
        { fileName: 'audio.mp3', description: 'MP3 extension' },
      ];

      it.each(invalidExtensions)(
        'should reject $description',
        async ({ fileName }) => {
          await expect(
            service.generateVariationImageUploadUrl(
              validVariationId,
              fileName,
              'image/jpeg',
            ),
          ).rejects.toThrow('Only image files are allowed');
        },
      );
    });

    describe('Content type and extension mismatch scenarios', () => {
      it('should reject non-image extension even with valid image content type', async () => {
        await expect(
          service.generateVariationImageUploadUrl(
            validVariationId,
            'document.pdf',
            'image/jpeg',
          ),
        ).rejects.toThrow('Only image files are allowed');
      });

      it('should reject valid image extension with non-image content type', async () => {
        await expect(
          service.generateVariationImageUploadUrl(
            validVariationId,
            'image.jpg',
            'application/pdf',
          ),
        ).rejects.toThrow('Only image files are allowed');
      });
    });
  });

  describe('Integration scenarios', () => {
    beforeEach(() => {
      mockGetSignedUrl.mockResolvedValue('https://test-presigned-url.com');
    });

    it('should complete full upload flow for valid image', async () => {
      const variationId = 'variation-456';
      const fileName = 'product-image.png';
      const contentType = 'image/png';

      const uploadResult = await service.generateVariationImageUploadUrl(
        variationId,
        fileName,
        contentType,
      );

      expect(uploadResult.presignedUrl).toBe('https://test-presigned-url.com');
      expect(uploadResult.s3Key).toMatch(
        /^variations\/variation-456\/\d+-product-image\.png$/,
      );

      const publicUrl = service.getPublicUrl(uploadResult.s3Key);
      expect(publicUrl).toBe(
        `https://test-bucket.s3.amazonaws.com/${uploadResult.s3Key}`,
      );
      const viewUrl = await service.getPreSignedURLForView(uploadResult.s3Key);
      expect(viewUrl).toBe('https://test-presigned-url.com');
    });

    it('should handle complete flow with service failures', async () => {
      mockGetSignedUrl.mockRejectedValueOnce(
        new Error('Upload URL generation failed'),
      );

      await expect(
        service.generateVariationImageUploadUrl(
          'variation-123',
          'image.jpg',
          'image/jpeg',
        ),
      ).rejects.toThrow('Upload URL generation failed');

      mockGetSignedUrl.mockRejectedValueOnce(
        new Error('View URL generation failed'),
      );

      await expect(service.getPreSignedURLForView('test-key')).rejects.toThrow(
        'View URL generation failed',
      );
    });
  });
});
