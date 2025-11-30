import factory from '@adonisjs/lucid/factories'
import PromotionAnalysisComparison from '#models/promotion_analysis_comparison'

export const PromotionAnalysisComparisonFactory = factory
  .define(PromotionAnalysisComparison, async ({ faker }) => {
    // Generate more realistic p-values with weighted distribution
    // 20% highly significant (p < 0.01)
    // 20% significant (0.01 <= p < 0.05)
    // 20% borderline (0.05 <= p < 0.1)
    // 40% not significant (p >= 0.1)
    const random = faker.number.float({ min: 0, max: 1, fractionDigits: 2 })
    let pValue: number

    if (random < 0.2) {
      // Highly significant: 0.001 to 0.01
      pValue = faker.number.float({ min: 0.001, max: 0.01, fractionDigits: 4 })
    } else if (random < 0.4) {
      // Significant: 0.01 to 0.05
      pValue = faker.number.float({ min: 0.01, max: 0.05, fractionDigits: 4 })
    } else if (random < 0.6) {
      // Borderline: 0.05 to 0.1
      pValue = faker.number.float({ min: 0.05, max: 0.1, fractionDigits: 4 })
    } else {
      // Not significant: 0.1 to 0.95
      pValue = faker.number.float({ min: 0.1, max: 0.95, fractionDigits: 4 })
    }

    return {
      disparateImpact: faker.number.float({ min: 0.5, max: 1.5, fractionDigits: 4 }),
      oddsRatio: faker.number.float({ min: 0.5, max: 2.0, fractionDigits: 4 }),
      payGap: faker.number.float({ min: -0.5, max: 0.5, fractionDigits: 4 }),
      careerBlock: faker.number.float({ min: 0, max: 1, fractionDigits: 4 }),
      pValue,
    }
  })
  .build()
