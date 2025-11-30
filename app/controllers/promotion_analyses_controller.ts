import type { HttpContext } from '@adonisjs/core/http'
import PromotionAnalysis from '#models/promotion_analysis'
import File from '#models/file'
import { SqsService } from '#services/sqs_service'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import drive from '@adonisjs/drive/services/main'
import { cuid } from '@adonisjs/core/helpers'

export default class PromotionAnalysesController {
  /**
   * Display a list of all promotion analyses
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const promotionAnalyses = await PromotionAnalysis.query()
      .preload('user')
      .preload('results', (query) => {
        query.preload('dimension')
      })
      .preload('comparisons', (query) => {
        query.preload('dimension')
      })
      .withCount('employees')
      .withCount('files')
      .paginate(page, limit)

    // Serialize data with $extras (which contains the counts)
    const data = promotionAnalyses.all().map((analysis) => {
      const serialized = analysis.serialize() as any
      return {
        ...serialized,
        ...analysis.$extras,
      }
    })

    return response.ok({
      meta: promotionAnalyses.getMeta(),
      data,
    })
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const title = request.input('title')

    if (!title) {
      return response.badRequest({ error: 'Title is required' })
    }

    // User is set by cognito_auth middleware
    if (!request.user) {
      return response.unauthorized({ error: 'Authentication required' })
    }

    const promotionAnalysis = await PromotionAnalysis.create({
      userId: request.user.id,
      title,
    })

    await promotionAnalysis.load('user')

    return response.created(promotionAnalysis)
  }

  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    try {
      const promotionAnalysis = await PromotionAnalysis.query()
        .where('id', params.id)
        .preload('user')
        .preload('files')
        .preload('employees', (query) => {
          query.preload('employee')
        })
        .preload('results', (query) => {
          query.preload('dimension')
        })
        .preload('comparisons', (query) => {
          query.preload('dimension')
        })
        .firstOrFail()

      // Serialize with pivot data
      const serialized = promotionAnalysis.serialize() as any

      // Add pivot data to files
      if (serialized.files && promotionAnalysis.files) {
        serialized.files = promotionAnalysis.files.map((file) => {
          const fileSerialized = file.serialize() as any
          // Include pivot data from $extras
          if (file.$extras.pivot_type) {
            fileSerialized.pivot_type = file.$extras.pivot_type
          }
          if (file.$extras.pivot_metadata !== undefined) {
            fileSerialized.pivot_metadata = file.$extras.pivot_metadata
          }
          if (file.$extras.pivot_promotion_analysis_id) {
            fileSerialized.pivot_promotion_analysis_id = file.$extras.pivot_promotion_analysis_id
          }
          if (file.$extras.pivot_file_id) {
            fileSerialized.pivot_file_id = file.$extras.pivot_file_id
          }
          return fileSerialized
        })
      }

      return response.ok(serialized)
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis not found' })
    }
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const promotionAnalysis = await PromotionAnalysis.findOrFail(params.id)

      const userId = request.input('user_id')

      if (userId) {
        promotionAnalysis.userId = userId
      }

      await promotionAnalysis.save()
      await promotionAnalysis.load('user')

      return response.ok(promotionAnalysis)
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis not found' })
    }
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const promotionAnalysis = await PromotionAnalysis.findOrFail(params.id)
      await promotionAnalysis.delete()

      return response.ok({ message: 'Promotion analysis deleted successfully' })
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis not found' })
    }
  }

  /**
   * Upload a file and attach it to a promotion analysis as input
   * This endpoint is for users to upload their input files
   * Does NOT trigger SQS processing - use /process endpoint for that
   */
  async uploadFile({ params, request, response }: HttpContext) {
    try {
      const promotionAnalysis = await PromotionAnalysis.findOrFail(params.id)

      // Check for file upload
      const uploadedFile = request.file('file', {
        size: '100mb',
        extnames: ['csv'],
      })

      if (!uploadedFile) {
        return response.badRequest({ error: 'File upload is required' })
      }

      // Check if an input file already exists
      await promotionAnalysis.load('files')
      const existingInputFile = promotionAnalysis.files.find(
        (file) => file.$extras.pivot_type === 'input'
      )

      if (existingInputFile) {
        return response.badRequest({
          error: 'Promotion analysis already has an input file. Please remove it first.',
        })
      }

      // Generate unique filename and S3 path
      const fileName = `${cuid()}.${uploadedFile.extname}`
      const s3Key = `audit_promotion/analyse/raw/${fileName}`

      // Start database transaction
      const trx = await db.connection().transaction()

      try {
        // 1. Create file record in database
        const file = await File.create(
          {
            type: 'csv',
            path: '', // Temporary, will be updated after S3 upload
          },
          { client: trx }
        )

        try {
          // 2. Upload to S3/MinIO
          await uploadedFile.moveToDisk(s3Key)

          // 3. Get the file URL and update record
          const url = await drive.use().getUrl(s3Key)
          file.path = url
          file.useTransaction(trx)
          await file.save()

          // 4. Attach file to promotion analysis with type='input'
          await promotionAnalysis
            .useTransaction(trx)
            .related('files')
            .attach({
              [file.id]: {
                type: 'input',
                metadata: null,
              },
            })

          // 5. Commit transaction - all operations succeeded
          await trx.commit()

          // Reload analysis with files
          await promotionAnalysis.load('files')

          return response.created({
            message: 'File uploaded and attached successfully',
            file,
            promotion_analysis: promotionAnalysis,
          })
        } catch (uploadError) {
          // S3 upload failed - rollback everything
          await trx.rollback()
          logger.error('File upload error:', uploadError)
          return response.badRequest({
            error: 'Failed to upload file',
            message: uploadError instanceof Error ? uploadError.message : 'Unknown error',
          })
        }
      } catch (dbError) {
        // Database error - rollback transaction
        await trx.rollback()
        logger.error('Database error during file upload:', dbError)
        return response.badRequest({
          error: 'Failed to create file record',
          message: dbError instanceof Error ? dbError.message : 'Unknown error',
        })
      }
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis not found' })
    }
  }

  /**
   * Link an existing S3 file to a promotion analysis (for 3rd party backend)
   * Accepts an S3 key pointing to an existing file in S3
   * Creates a file record and attaches it to the analysis WITHOUT triggering SQS
   * This is intended for results/reports uploaded by external processors
   */
  async linkFile({ params, request, response }: HttpContext) {
    try {
      const promotionAnalysis = await PromotionAnalysis.findOrFail(params.id)
      const s3Key = request.input('s3_key')
      const type = request.input('type', 'final_report')
      const metadata = request.input('metadata', null)

      if (!s3Key) {
        return response.badRequest({ error: 's3_key is required' })
      }

      // Validate type
      const validTypes = ['final_report']
      if (!validTypes.includes(type)) {
        return response.badRequest({
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}. Use the regular /files endpoint for 'input' type.`,
        })
      }

      const bucket = env.get('S3_BUCKET')
      const region = env.get('AWS_REGION', 'us-east-1')

      if (!bucket) {
        return response.internalServerError({
          error: 'S3_BUCKET is not configured.',
        })
      }

      // Start database transaction
      const trx = await db.connection().transaction()

      try {
        // Verify file exists in S3
        try {
          await drive.use().exists(s3Key)
        } catch (error) {
          await trx.rollback()
          return response.notFound({
            error: 'File not found in S3',
            s3_key: s3Key,
          })
        }

        // Generate S3 URL
        const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`

        // Create file record in database
        const file = await File.create(
          {
            type: 'csv',
            path: s3Url,
          },
          { client: trx }
        )

        // Attach file to promotion analysis
        await promotionAnalysis
          .useTransaction(trx)
          .related('files')
          .attach({
            [file.id]: {
              type,
              metadata,
            },
          })

        // Commit transaction
        await trx.commit()

        // Reload analysis with files
        await promotionAnalysis.load('files')

        logger.info(`S3 file attached to promotion analysis: ${s3Key}`)

        return response.created({
          message: 'S3 file attached successfully',
          file,
          promotion_analysis: promotionAnalysis,
        })
      } catch (attachError) {
        await trx.rollback()
        logger.error('Failed to attach S3 file:', attachError)
        return response.badRequest({
          error: 'Failed to attach S3 file',
          message: attachError instanceof Error ? attachError.message : 'Unknown error',
        })
      }
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis not found' })
    }
  }

  /**
   * Detach a file from a promotion analysis
   */
  async detachFile({ params, response }: HttpContext) {
    try {
      const promotionAnalysis = await PromotionAnalysis.findOrFail(params.id)
      const fileId = params.fileId

      if (!fileId) {
        return response.badRequest({ error: 'File ID is required' })
      }

      // Detach the file from the promotion analysis
      await promotionAnalysis.related('files').detach([fileId])

      // Reload the analysis with remaining files
      await promotionAnalysis.load('files')

      return response.ok({
        message: 'File detached successfully',
        promotion_analysis: promotionAnalysis,
      })
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis not found' })
    }
  }

  /**
   * Start processing a promotion analysis by triggering SQS
   * Validates that the analysis has an input file and is not already processing
   */
  async process({ params, response }: HttpContext) {
    try {
      const promotionAnalysis = await PromotionAnalysis.findOrFail(params.id)

      // Check if already processing
      if (promotionAnalysis.status === 'processing') {
        return response.badRequest({
          error: 'This promotion analysis is already being processed',
          status: promotionAnalysis.status,
        })
      }

      // Load files to find the input file
      await promotionAnalysis.load('files')
      const inputFile = promotionAnalysis.files.find(
        (file) => file.$extras.pivot_type === 'input'
      )

      if (!inputFile) {
        return response.badRequest({
          error: 'No input file attached to this promotion analysis. Please upload an input file first.',
        })
      }

      // Validate SQS configuration
      const sqsQueueUrl = env.get('SQS_QUEUE_URL')
      const bucket = env.get('S3_BUCKET')

      if (!sqsQueueUrl) {
        return response.internalServerError({
          error: 'SQS_QUEUE_URL is not configured. Cannot process file for analysis.',
        })
      }

      if (!bucket) {
        return response.internalServerError({
          error: 'S3_BUCKET is not configured. Cannot process file for analysis.',
        })
      }

      // Extract S3 key from file path URL
      // URL format: http://localhost:9000/bucket-name/path/to/file
      let s3Key: string
      try {
        const urlPath = new URL(inputFile.path).pathname
        const pathParts = urlPath.substring(1).split('/')
        s3Key = pathParts.slice(1).join('/') // Skip bucket name
      } catch (urlError) {
        logger.error('Failed to parse file URL:', urlError)
        return response.badRequest({
          error: 'Invalid file path format',
        })
      }

      // Start database transaction
      const trx = await db.connection().transaction()

      try {
        // Update status to processing
        promotionAnalysis.status = 'processing'
        promotionAnalysis.useTransaction(trx)
        await promotionAnalysis.save()

        // Send SQS message
        const sqsService = new SqsService()
        try {
          await sqsService.sendS3ProcessingMessage(s3Key, bucket)
          logger.info(`SQS message sent for promotion analysis ${params.id}: ${s3Key}`)
        } catch (sqsError) {
          // SQS failed - rollback status update
          await trx.rollback()
          logger.error('Failed to send SQS message:', sqsError)
          return response.internalServerError({
            error: 'Failed to send file for processing',
            message: sqsError instanceof Error ? sqsError.message : 'Unknown SQS error',
          })
        }

        // Commit transaction
        await trx.commit()

        return response.ok({
          message: 'Processing started successfully',
          promotion_analysis: promotionAnalysis,
          s3_key: s3Key,
        })
      } catch (dbError) {
        await trx.rollback()
        logger.error('Database error during process:', dbError)
        return response.badRequest({
          error: 'Failed to update promotion analysis status',
          message: dbError instanceof Error ? dbError.message : 'Unknown error',
        })
      }
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis not found' })
    }
  }

}
