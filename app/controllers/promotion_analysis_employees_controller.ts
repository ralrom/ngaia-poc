import type { HttpContext } from '@adonisjs/core/http'
import PromotionAnalysisEmployee from '#models/promotion_analysis_employee'

export default class PromotionAnalysisEmployeesController {
  /**
   * Display a list of all promotion analysis employees
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const promotionAnalysisId = request.input('promotion_analysis_id')

    const query = PromotionAnalysisEmployee.query()
      .preload('employee')
      .preload('promotionAnalysis')

    if (promotionAnalysisId) {
      query.where('promotion_analysis_id', promotionAnalysisId)
    }

    const promotionAnalysisEmployees = await query.paginate(page, limit)

    return response.ok(promotionAnalysisEmployees)
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const data = request.only([
      'employee_id',
      'promotion_analysis_id',
      'employee_number',
      'gender',
      'ethnicity',
      'age_group',
      'disability',
      'department',
      'country',
      'hired_at',
      'terminated_at',
    ])

    try {
      const promotionAnalysisEmployee = await PromotionAnalysisEmployee.create(data)
      await promotionAnalysisEmployee.load('employee')
      await promotionAnalysisEmployee.load('promotionAnalysis')

      return response.created(promotionAnalysisEmployee)
    } catch (error) {
      return response.badRequest({ error: 'Failed to create promotion analysis employee' })
    }
  }

  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    try {
      const promotionAnalysisEmployee = await PromotionAnalysisEmployee.query()
        .where('id', params.id)
        .preload('employee')
        .preload('promotionAnalysis')
        .firstOrFail()

      return response.ok(promotionAnalysisEmployee)
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis employee not found' })
    }
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const promotionAnalysisEmployee = await PromotionAnalysisEmployee.findOrFail(params.id)

      const data = request.only([
        'employee_id',
        'promotion_analysis_id',
        'employee_number',
        'gender',
        'ethnicity',
        'age_group',
        'disability',
        'department',
        'country',
        'hired_at',
        'terminated_at',
      ])

      promotionAnalysisEmployee.merge(data)
      await promotionAnalysisEmployee.save()
      await promotionAnalysisEmployee.load('employee')
      await promotionAnalysisEmployee.load('promotionAnalysis')

      return response.ok(promotionAnalysisEmployee)
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis employee not found' })
    }
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const promotionAnalysisEmployee = await PromotionAnalysisEmployee.findOrFail(params.id)
      await promotionAnalysisEmployee.delete()

      return response.ok({ message: 'Promotion analysis employee deleted successfully' })
    } catch (error) {
      return response.notFound({ error: 'Promotion analysis employee not found' })
    }
  }
}
