import type { HttpContext } from '@adonisjs/core/http'
import PromotionAnalysisComparison from '#models/promotion_analysis_comparison'

export default class PromotionAnalysisComparisonsController {
  /**
   * Display a list of all promotion analysis comparisons
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const promotionAnalysisId = request.input('promotion_analysis_id')
    const dimensionId = request.input('dimension_id')

    const query = PromotionAnalysisComparison.query()
      .preload('promotionAnalysis')
      .preload('dimension')

    if (promotionAnalysisId) {
      query.where('promotion_analysis_id', promotionAnalysisId)
    }

    if (dimensionId) {
      query.where('dimension_id', dimensionId)
    }

    const promotionAnalysisComparisons = await query.paginate(page, limit)

    return response.ok(promotionAnalysisComparisons)
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
      const promotionAnalysisComparison = await PromotionAnalysisComparison.create(data)
      await promotionAnalysisComparison.load('promotionAnalysis')
      await promotionAnalysisComparison.load('dimension')

      return response.created(promotionAnalysisComparison)
    } catch (error) {
      return response.badRequest({ error: 'Failed to create promotion analysis comparison' })
    }
  }

  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    try {
      const promotionAnalysisComparison = await PromotionAnalysisComparison.query()
        .where('id', params.id)
        .preload('promotionAnalysis')
        .preload('dimension')
        .preload('files')
        .firstOrFail()

      return response.ok(promotionAnalysisComparison)
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis comparison not found' })
    }
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const promotionAnalysisComparison = await PromotionAnalysisComparison.findOrFail(params.id)

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

      promotionAnalysisComparison.merge(data)
      await promotionAnalysisComparison.save()
      await promotionAnalysisComparison.load('promotionAnalysis')
      await promotionAnalysisComparison.load('dimension')

      return response.ok(promotionAnalysisComparison)
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis comparison not found' })
    }
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const promotionAnalysisComparison = await PromotionAnalysisComparison.findOrFail(params.id)
      await promotionAnalysisComparison.delete()

      return response.ok({ message: 'Promotion analysis comparison deleted successfully' })
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis comparison not found' })
    }
  }
}
