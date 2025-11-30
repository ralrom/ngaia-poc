import type { HttpContext } from '@adonisjs/core/http'
import Employee from '#models/employee'

export default class EmployeesController {
  /**
   * Display a list of all employees
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const employees = await Employee.query().paginate(page, limit)

    return response.ok(employees)
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const data = request.only([
      'employee_number',
      'gender',
      'ethnicity',
      'age_group',
      'disability',
      'department',
      'country',
      'absence_rate',
      'hired_at',
      'terminated_at',
    ])

    const employee = await Employee.create(data)

    return response.created(employee)
  }

  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    try {
      const employee = await Employee.findOrFail(params.id)
      return response.ok(employee)
    } catch (error) {
      return response.notFound({ error: 'Employee not found' })
    }
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const employee = await Employee.findOrFail(params.id)

      const data = request.only([
        'employee_number',
        'gender',
        'ethnicity',
        'age_group',
        'disability',
        'department',
        'country',
        'absence_rate',
        'hired_at',
        'terminated_at',
      ])

      employee.merge(data)
      await employee.save()

      return response.ok(employee)
    } catch (error) {
      return response.notFound({ error: 'Employee not found' })
    }
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const employee = await Employee.findOrFail(params.id)
      await employee.delete()

      return response.ok({ message: 'Employee deleted successfully' })
    } catch (error) {
      return response.notFound({ error: 'Employee not found' })
    }
  }
}
