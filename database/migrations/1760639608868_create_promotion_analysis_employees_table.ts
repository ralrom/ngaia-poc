import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promotion_analysis_employees'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))

      table
        .uuid('employee_id')
        .notNullable()
        .references('id')
        .inTable('employees')
        .onDelete('CASCADE')

      table
        .integer('promotion_analysis_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('promotion_analyses')
        .onDelete('CASCADE')

      table.string('employee_number').notNullable().index()
      table.string('gender').nullable()
      table.string('ethnicity').nullable()
      table.string('age_group').nullable()
      table.string('disability').nullable()
      table.string('department').nullable()
      table.string('country').nullable()
      table.timestamp('hired_at').nullable()
      table.timestamp('terminated_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Add composite index for common queries
      table.index(['promotion_analysis_id', 'employee_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
