import type { HttpContext } from '@adonisjs/core/http'
import Dimension from '#models/dimension'

export default class DimensionsController {
  /**
   * Display a list of all dimensions
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const dimensions = await Dimension.query().paginate(page, limit)

    return response.ok(dimensions)
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const data = request.only(['name', 'description'])

    try {
      const dimension = await Dimension.create(data)
      return response.created(dimension)
    } catch (error) {
      return response.badRequest({ error: 'Failed to create dimension. Name must be unique.' })
    }
  }

  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    try {
      const dimension = await Dimension.findOrFail(params.id)
      return response.ok(dimension)
    } catch (error) {
      return response.notFound({ error: 'Dimension not found' })
    }
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const dimension = await Dimension.findOrFail(params.id)

      const data = request.only(['name', 'description'])

      dimension.merge(data)
      await dimension.save()

      return response.ok(dimension)
    } catch (error) {
      return response.notFound({ error: 'Dimension not found' })
    }
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const dimension = await Dimension.findOrFail(params.id)
      await dimension.delete()

      return response.ok({ message: 'Dimension deleted successfully' })
    } catch (error) {
      return response.notFound({ error: 'Dimension not found' })
    }
  }
}
