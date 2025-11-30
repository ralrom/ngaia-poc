import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Drop old promotion_analysis_results file pivot tables
    this.schema.dropTableIfExists('promotion_analysis_results_input_files')
    this.schema.dropTableIfExists('promotion_analysis_results_llm_input_files')
    this.schema.dropTableIfExists('promotion_analysis_results_llm_output_files')
    this.schema.dropTableIfExists('promotion_analysis_results_final_report_files')

    // Drop old promotion_analysis_comparisons file pivot tables
    this.schema.dropTableIfExists('promotion_analysis_comparisons_input_files')
    this.schema.dropTableIfExists('promotion_analysis_comparisons_llm_input_files')
    this.schema.dropTableIfExists('promotion_analysis_comparisons_llm_output_files')
  }

  async down() {
    // Recreate promotion_analysis_results file pivot tables
    this.schema.createTable('promotion_analysis_results_input_files', (table) => {
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
      table.primary(['promotion_analysis_id', 'source_id'])
    })

    this.schema.createTable('promotion_analysis_results_llm_input_files', (table) => {
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
      table.primary(['promotion_analysis_id', 'source_id'])
    })

    this.schema.createTable('promotion_analysis_results_llm_output_files', (table) => {
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
      table.primary(['promotion_analysis_id', 'source_id'])
    })

    this.schema.createTable('promotion_analysis_results_final_report_files', (table) => {
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
      table.primary(['promotion_analysis_id', 'source_id'])
    })

    // Recreate promotion_analysis_comparisons file pivot tables
    this.schema.createTable('promotion_analysis_comparisons_input_files', (table) => {
      table
        .integer('promotion_analysis_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('promotion_analysis_comparisons')
        .onDelete('CASCADE')
      table
        .integer('source_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('files')
        .onDelete('CASCADE')
      table.primary(['promotion_analysis_id', 'source_id'])
    })

    this.schema.createTable('promotion_analysis_comparisons_llm_input_files', (table) => {
      table
        .integer('promotion_analysis_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('promotion_analysis_comparisons')
        .onDelete('CASCADE')
      table
        .integer('source_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('files')
        .onDelete('CASCADE')
      table.primary(['promotion_analysis_id', 'source_id'])
    })

    this.schema.createTable('promotion_analysis_comparisons_llm_output_files', (table) => {
      table
        .integer('promotion_analysis_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('promotion_analysis_comparisons')
        .onDelete('CASCADE')
      table
        .integer('source_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('files')
        .onDelete('CASCADE')
      table.primary(['promotion_analysis_id', 'source_id'])
    })
  }
}
