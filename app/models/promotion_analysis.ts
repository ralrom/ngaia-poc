import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import File from '#models/file'
import PromotionAnalysisEmployee from '#models/promotion_analysis_employee'
import PromotionAnalysisResult from '#models/promotion_analysis_result'
import PromotionAnalysisComparison from '#models/promotion_analysis_comparison'

export default class PromotionAnalysis extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare title: string

  @column()
  declare status: 'pending' | 'processing' | 'completed' | 'failed'

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @manyToMany(() => File, {
    pivotTable: 'promotion_analysis_files',
    localKey: 'id',
    pivotForeignKey: 'promotion_analysis_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'file_id',
    pivotColumns: ['type', 'metadata'],
    pivotTimestamps: true,
  })
  declare files: ManyToMany<typeof File>

  @hasMany(() => PromotionAnalysisEmployee)
  declare employees: HasMany<typeof PromotionAnalysisEmployee>

  @hasMany(() => PromotionAnalysisResult)
  declare results: HasMany<typeof PromotionAnalysisResult>

  @hasMany(() => PromotionAnalysisComparison)
  declare comparisons: HasMany<typeof PromotionAnalysisComparison>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
