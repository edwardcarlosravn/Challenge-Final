import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { VariationImageRepository } from 'src/application/contracts/persistence/variation-image.repository';
import { SkipThrottle } from '@nestjs/throttler';
@Resolver()
export class FileUploadResolver {
  constructor(
    private readonly fileUploadService: FileUploadService,
    @Inject('VariationImageRepository')
    private readonly variationImageRepository: VariationImageRepository,
  ) {}
  @SkipThrottle()
  @Mutation(() => String)
  async generateVariationImageUploadUrl(
    @Args('variationId') variationId: string,
    @Args('fileName') fileName: string,
    @Args('contentType') contentType: string,
  ) {
    const { presignedUrl, s3Key } =
      await this.fileUploadService.generateVariationImageUploadUrl(
        variationId,
        fileName,
        contentType,
      );

    await this.variationImageRepository.create(s3Key, variationId);

    return presignedUrl;
  }
  @SkipThrottle()
  @Query(() => [String])
  async getVariationImageUrls(@Args('variationId') variationId: string) {
    const images =
      await this.variationImageRepository.findManyByVariationId(variationId);

    return images.map((image) =>
      this.fileUploadService.getPublicUrl(image.s3Key),
    );
  }
}
