import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FileUploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_BUCKET_REGION || '',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY || '',
        secretAccessKey: process.env.AWS_SECRET_KEY || '',
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || '';
  }

  async generateVariationImageUploadUrl(
    variationId: string,
    fileName: string,
    contentType: string,
  ): Promise<{ presignedUrl: string; s3Key: string }> {
    this.validateImageFile(fileName, contentType);
    const s3Key = `variations/${variationId}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });

    return { presignedUrl, s3Key };
  }

  getPublicUrl(s3Key: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${s3Key}`;
  }

  async getPreSignedURLForView(s3Key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: 300,
    });
  }
  private validateImageFile(fileName: string, contentType: string): void {
    const validImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/svg+xml',
    ];

    if (!validImageTypes.includes(contentType.toLowerCase())) {
      throw new Error('Only image files are allowed');
    }

    const validExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.bmp',
      '.svg',
    ];
    const fileExtension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      throw new Error('Only image files are allowed');
    }
  }
}
