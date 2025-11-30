// app/Services/SqsService.ts
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import env from '#start/env'

export class SqsService {
  private client: SQSClient

  constructor() {
    this.client = new SQSClient({
      region: env.get('AWS_REGION'),
    })
  }

  /**
   * Envoie un message pour traiter un fichier S3
   */
  async sendS3ProcessingMessage(s3Key: string, bucketName: string) {
    const messageBody = {
      Records: [
        {
          s3: {
            bucket: {
              name: bucketName,
            },
            object: {
              key: s3Key,
            },
          },
          // criteres: ['Gender', '...'],
          // type: 'promotion_analyses',
          // id: '1234',
        },
      ],
    }

    const command = new SendMessageCommand({
      QueueUrl: env.get('SQS_QUEUE_URL'),
      MessageBody: JSON.stringify(messageBody),
      MessageGroupId: 'gaia-processing',
      MessageDeduplicationId: `${s3Key}-${Date.now()}`, // Ajoutez ceci si nécessaire
    })

    return await this.client.send(command)
  }
}
