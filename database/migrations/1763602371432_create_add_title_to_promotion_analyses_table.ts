import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promotion_analyses'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('title').notNullable().defaultTo('Untitled Analysis')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('title')
    })
  }
}