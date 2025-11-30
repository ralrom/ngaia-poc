import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Employee extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

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
}
