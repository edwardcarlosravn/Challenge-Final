export interface StorageService {
  generatePresignedUploadUrl(
    key: string,
    contentType: string,
  ): Promise<{ presignedUrl: string; publicUrl: string }>;
  getPublicUrl(key: string): string;
}
