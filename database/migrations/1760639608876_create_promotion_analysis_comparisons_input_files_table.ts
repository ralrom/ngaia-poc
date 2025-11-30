import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promotion_analysis_comparisons_files'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table
        .integer('promotion_analysis_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('promotion_analysis_comparisons')
        .onDelete('CASCADE')

      table
        .integer('file_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('files')
        .onDelete('CASCADE')

      table
        .enum('type', ['input', 'llm_input', 'llm_output', 'final_report'])
        .notNullable()
        .defaultTo('input')

      table.jsonb('metadata').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Unique constraint: one file can only be attached once with the same type
      table.unique(['promotion_analysis_id', 'file_id', 'type'])

      // Index for faster queries
      table.index(['promotion_analysis_id', 'type'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
