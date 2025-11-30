import type { HttpContext } from '@adonisjs/core/http'
import PromotionAnalysisResult from '#models/promotion_analysis_result'

export default class PromotionAnalysisResultsController {
  /**
   * Display a list of all promotion analysis results
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const promotionAnalysisId = request.input('promotion_analysis_id')
    const dimensionId = request.input('dimension_id')

    const query = PromotionAnalysisResult.query().preload('promotionAnalysis').preload('dimension')

    if (promotionAnalysisId) {
      query.where('promotion_analysis_id', promotionAnalysisId)
    }

    if (dimensionId) {
      query.where('dimension_id', dimensionId)
    }

    const promotionAnalysisResults = await query.paginate(page, limit)

    return response.ok(promotionAnalysisResults)
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const data = request.only([
      'promotionAnalysisId',
      'dimensionId',
      'disparateImpact',
      'oddsRatio',
      'payGap',
      'careerBlock',
      'pValue',
      'absenceGap',
    ])

    try {
      const promotionAnalysisResult = await PromotionAnalysisResult.create(data)
      await promotionAnalysisResult.load('promotionAnalysis')
      await promotionAnalysisResult.load('dimension')

      return response.created(promotionAnalysisResult)
    } catch (error) {
      return response.badRequest({ error: 'Failed to create promotion analysis result' })
    }
  }

  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    try {
      const promotionAnalysisResult = await PromotionAnalysisResult.query()
        .where('id', params.id)
        .preload('promotionAnalysis')
        .preload('dimension')
        .firstOrFail()

      return response.ok(promotionAnalysisResult)
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis result not found' })
    }
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const promotionAnalysisResult = await PromotionAnalysisResult.findOrFail(params.id)

      const data = request.only([
        'promotionAnalysisId',
        'dimensionId',
        'disparateImpact',
        'oddsRatio',
        'payGap',
        'careerBlock',
        'pValue',
        'absenceGap',
      ])

      promotionAnalysisResult.merge(data)
      await promotionAnalysisResult.save()
      await promotionAnalysisResult.load('promotionAnalysis')
      await promotionAnalysisResult.load('dimension')

      return response.ok(promotionAnalysisResult)
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis result not found' })
    }
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const promotionAnalysisResult = await PromotionAnalysisResult.findOrFail(params.id)
      await promotionAnalysisResult.delete()

      return response.ok({ message: 'Promotion analysis result deleted successfully' })
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis result not found' })
    }
  }
}
