import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import PromotionAnalysisResult from '#models/promotion_analysis_result'
import PromotionAnalysisComparison from '#models/promotion_analysis_comparison'

export default class Dimension extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => PromotionAnalysisResult)
  declare promotionAnalysisResults: HasMany<typeof PromotionAnalysisResult>

  @hasMany(() => PromotionAnalysisComparison)
  declare promotionAnalysisComparisons: HasMany<typeof PromotionAnalysisComparison>
}
