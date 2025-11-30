import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promotion_analysis_results_input_files'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('promotion_analysis_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('promotion_analysis_results')
        .onDelete('CASCADE')

      table
        .integer('source_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('files')
        .onDelete('CASCADE')

      // Composite primary key
      table.primary(['promotion_analysis_id', 'source_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
