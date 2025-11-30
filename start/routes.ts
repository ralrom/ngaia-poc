/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import drive from '@adonisjs/drive/services/main'
import { SqsService } from '#services/sqs_service'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import { middleware } from '#start/kernel'

const PromotionAnalysesController = () => import('#controllers/promotion_analyses_controller')
const EmployeesController = () => import('#controllers/employees_controller')
const DimensionsController = () => import('#controllers/dimensions_controller')
const PromotionAnalysisEmployeesController = () =>
  import('#controllers/promotion_analysis_employees_controller')
const PromotionAnalysisResultsController = () =>
  import('#controllers/promotion_analysis_results_controller')
const PromotionAnalysisComparisonsController = () =>
  import('#controllers/promotion_analysis_comparisons_controller')
const FilesController = () => import('#controllers/files_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router
  .group(() => {
    router.resource('promotion-analyses', PromotionAnalysesController).apiOnly()
    router
      .post('promotion-analyses/:id/files', [PromotionAnalysesController, 'uploadFile'])
      .as('promotion-analyses.files.upload')
    router
      .post('promotion-analyses/:id/files/link', [PromotionAnalysesController, 'linkFile'])
      .as('promotion-analyses.files.link')
    router
      .delete('promotion-analyses/:id/files/:fileId', [PromotionAnalysesController, 'detachFile'])
      .as('promotion-analyses.files.detach')
    router
      .post('promotion-analyses/:id/process', [PromotionAnalysesController, 'process'])
      .as('promotion-analyses.process')
  })
  .use(middleware.cognito_auth())
router.resource('employees', EmployeesController).apiOnly()
router.resource('dimensions', DimensionsController).apiOnly()
router.resource('promotion-analysis-employees', PromotionAnalysisEmployeesController).apiOnly()
router.resource('promotion-analysis-results', PromotionAnalysisResultsController).apiOnly()
router.resource('promotion-analysis-comparisons', PromotionAnalysisComparisonsController).apiOnly()
router.resource('files', FilesController).apiOnly()
router.get('files/:id/download', [FilesController, 'download']).as('files.download')
router.get('/test-s3', async ({ response }) => {
  try {
    const testFile = 'test.csv'
    const bucket = env.get('S3_BUCKET')
    const region = env.get('AWS_REGION')
    const s3Key = `audit_promotion/analyse/raw/${testFile}`
    const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`

    // Use the Drive service with S3KMSDriver
    await drive.use().put(s3Key, 'Hello S3!')

    logger.info('✅ PUT successful')

    return response.ok({
      status: 'ok',
      message: 'S3 working with KMS encryption',
      file: testFile,
      url: s3Url,
    })
  } catch (error) {
    logger.error('❌ S3 Error:', error.message)
    logger.error('Stack:', error.stack)
    return response.internalServerError({
      error: error.message,
      details: error.stack,
    })
  }
})

router.post('/test-sqs', async ({ response }) => {
  try {
    const testFile = 'test.csv'
    const s3Key = `audit_promotion/analyse/raw/${testFile}`
    const sqsService = new SqsService()
    await sqsService.sendS3ProcessingMessage(
      s3Key, // Ex: "audit_promotion/upload/data.csv"
      'gaia-demo-prod' // Votre bucket
    )
    return response.ok({
      message: 'Fichier envoyé pour traitement',
      s3Key,
    })
  } catch (error) {
    console.error('Erreur SQS:', error)
    return response.badRequest({
      success: false,
      error: error.message,
    })
  }
})
