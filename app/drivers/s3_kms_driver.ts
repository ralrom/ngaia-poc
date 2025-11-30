import { S3Driver } from 'flydrive/drivers/s3'
import type { S3DriverOptions } from 'flydrive/drivers/s3/types'
import { PutObjectCommand, S3Client, PutObjectCommandInput } from '@aws-sdk/client-s3'

export type S3KMSDriverOptions = S3DriverOptions & {
  kmsKeyId?: string
}

/**
 * S3 Driver with KMS encryption support for AWS S3
 *
 * This driver extends the standard FlyDrive S3 driver to automatically
 * apply KMS encryption to all uploaded objects when a KMS key is configured.
 */
export class S3KMSDriver extends S3Driver {
  private kmsKeyId?: string

  constructor(options: S3KMSDriverOptions) {
    const { kmsKeyId, ...s3Options } = options
    super(s3Options)
    this.kmsKeyId = kmsKeyId
  }

  /**
   * Override createPutObjectCommand to add KMS encryption parameters
   */
  protected createPutObjectCommand(
    _client: S3Client,
    options: PutObjectCommandInput
  ): PutObjectCommand {
    // Add KMS encryption if key is provided
    if (this.kmsKeyId) {
      options.ServerSideEncryption = 'aws:kms'
      options.SSEKMSKeyId = this.kmsKeyId
    }

    return new PutObjectCommand(options)
  }
}
