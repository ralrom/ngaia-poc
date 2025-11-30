import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promotion_analysis_comparisons'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('absence_gap', 10, 4).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('absence_gap')
    })
  }
}