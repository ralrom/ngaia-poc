import factory from '@adonisjs/lucid/factories'
import PromotionAnalysisEmployee from '#models/promotion_analysis_employee'
import { DateTime } from 'luxon'

export const PromotionAnalysisEmployeeFactory = factory
  .define(PromotionAnalysisEmployee, async ({ faker }) => {
    const hiredAt = faker.date.past({ years: 10 })
    const isTerminated = faker.datatype.boolean({ probability: 0.2 })

    return {
      employeeNumber: faker.string.alphanumeric(10),
      gender: faker.helpers.arrayElement(['Male', 'Female', 'Non-binary', 'Prefer not to say']),
      ethnicity: faker.helpers.arrayElement([
        'White',
        'Black or African American',
        'Asian',
        'Hispanic or Latino',
        'Native American',
        'Pacific Islander',
        'Two or more races',
        'Prefer not to say',
      ]),
      ageGroup: faker.helpers.arrayElement([
        '18-24',
        '25-34',
        '35-44',
        '45-54',
        '55-64',
        '65+',
      ]),
      disability: faker.helpers.arrayElement(['Yes', 'No', 'Prefer not to say']),
      department: faker.helpers.arrayElement([
        'Engineering',
        'Sales',
        'Marketing',
        'HR',
        'Finance',
        'Operations',
        'Customer Support',
        'Product',
      ]),
      country: faker.location.country(),
      hiredAt: DateTime.fromJSDate(hiredAt),
      terminatedAt: isTerminated
        ? DateTime.fromJSDate(faker.date.between({ from: hiredAt, to: new Date() }))
        : null,
    }
  })
  .build()
