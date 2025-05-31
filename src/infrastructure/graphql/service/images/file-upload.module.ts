import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadResolver } from './file-upload.resolver';
import { PrismaService } from 'src/infrastructure/persistence/prisma/prisma.service';

@Module({
  providers: [FileUploadService, FileUploadResolver, PrismaService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
