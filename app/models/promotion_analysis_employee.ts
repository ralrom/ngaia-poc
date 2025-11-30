import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import PromotionAnalysis from '#models/promotion_analysis'

export default class PromotionAnalysisEmployee extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare employeeId: string

  @column()
  declare promotionAnalysisId: number

  @column()
  declare employeeNumber: string

  @column()
  declare gender: string | null

  @column()
  declare ethnicity: string | null

  @column()
  declare ageGroup: string | null

  @column()
  declare disability: string | null

  @column()
  declare department: string | null

  @column()
  declare country: string | null

  @column()
  declare absenceRate: number | null

  @column.dateTime()
  declare hiredAt: DateTime | null

  @column.dateTime()
  declare terminatedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Employee)
  declare employee: BelongsTo<typeof Employee>

  @belongsTo(() => PromotionAnalysis)
  declare promotionAnalysis: BelongsTo<typeof PromotionAnalysis>
}
