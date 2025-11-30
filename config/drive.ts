import { S3KMSDriver } from '#drivers/s3_kms_driver'
import env from '#start/env'
import { defineConfig, services } from '@adonisjs/drive'

const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK', 's3'),

  /**
   * The services object can be used to configure multiple file system
   * services each using the same or a different driver.
   */
  services: {
    /**
     * AWS S3 with KMS encryption
     * Uses IAM roles for authentication (no credentials needed)
     */
    s3: () => {
      return new S3KMSDriver({
        region: env.get('AWS_REGION')!,
        bucket: env.get('S3_BUCKET')!,
        kmsKeyId: env.get('KMS_KEY_ID'),
        visibility: 'private',
      })
    },

    minio: services.s3({
      region: env.get('AWS_REGION')!,
      bucket: env.get('S3_BUCKET')!,
      endpoint: env.get('S3_ENDPOINT'),
      forcePathStyle: true,
      visibility: 'private',
      credentials: {
        accessKeyId: env.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY', ''),
      },
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
