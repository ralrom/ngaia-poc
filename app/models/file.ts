import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import PromotionAnalysisResult from '#models/promotion_analysis_result'
import PromotionAnalysisComparison from '#models/promotion_analysis_comparison'

export default class File extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare type: string

  @column()
  declare path: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @manyToMany(() => PromotionAnalysisResult, {
    pivotTable: 'promotion_analysis_results_final_report_files',
    localKey: 'id',
    pivotForeignKey: 'source_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'promotion_analysis_id',
  })
  declare resultsFinalReport: ManyToMany<typeof PromotionAnalysisResult>

  @manyToMany(() => PromotionAnalysisResult, {
    pivotTable: 'promotion_analysis_results_input_files',
    localKey: 'id',
    pivotForeignKey: 'source_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'promotion_analysis_id',
  })
  declare resultsInput: ManyToMany<typeof PromotionAnalysisResult>

  @manyToMany(() => PromotionAnalysisComparison, {
    pivotTable: 'promotion_analysis_comparisons_files',
    localKey: 'id',
    pivotForeignKey: 'file_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'promotion_analysis_id',
    pivotColumns: ['type', 'metadata'],
    pivotTimestamps: true,
  })
  declare comparisons: ManyToMany<typeof PromotionAnalysisComparison>
}
