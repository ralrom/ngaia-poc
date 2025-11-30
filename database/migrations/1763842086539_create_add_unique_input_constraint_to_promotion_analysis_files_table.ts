import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promotion_analysis_files'

  async up() {
    this.schema.raw(`
      CREATE UNIQUE INDEX promotion_analysis_unique_input_file
      ON promotion_analysis_files (promotion_analysis_id)
      WHERE type = 'input'
    `)
  }

  async down() {
    this.schema.raw('DROP INDEX IF EXISTS promotion_analysis_unique_input_file')
  }
}
