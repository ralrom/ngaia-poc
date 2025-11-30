import Dimension from '#models/dimension'
import PromotionAnalysis from '#models/promotion_analysis'
import File from '#models/file'
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class PromotionAnalysisComparison extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare promotionAnalysisId: number

  @column()
  declare dimensionId: number

  @column()
  declare disparateImpact: number | null

  @column()
  declare oddsRatio: number | null

  @column()
  declare payGap: number | null

  @column()
  declare careerBlock: number | null

  @column()
  declare pValue: number | null

  @column()
  declare absenceGap: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => PromotionAnalysis)
  declare promotionAnalysis: BelongsTo<typeof PromotionAnalysis>

  @belongsTo(() => Dimension)
  declare dimension: BelongsTo<typeof Dimension>

  @manyToMany(() => File, {
    pivotTable: 'promotion_analysis_comparisons_files',
    localKey: 'id',
    pivotForeignKey: 'promotion_analysis_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'file_id',
    pivotColumns: ['type', 'metadata'],
    pivotTimestamps: true,
  })
  declare files: ManyToMany<typeof File>
}
