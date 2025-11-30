import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'employees'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
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
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
