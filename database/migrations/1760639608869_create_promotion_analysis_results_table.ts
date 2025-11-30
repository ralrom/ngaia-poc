import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promotion_analysis_results'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table
        .integer('promotion_analysis_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('promotion_analyses')
        .onDelete('CASCADE')

      table
        .integer('dimension_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('dimensions')
        .onDelete('CASCADE')

      table.decimal('absence_rate', 10, 4).nullable()
      table.decimal('disparate_impact', 10, 4).nullable()
      table.decimal('odds_ratio', 10, 4).nullable()
      table.decimal('pay_gap', 10, 4).nullable()
      table.decimal('career_block', 10, 4).nullable()
      table.decimal('p_value', 10, 4).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Add composite index for common queries
      table.index(['promotion_analysis_id', 'dimension_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
