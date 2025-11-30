import factory from '@adonisjs/lucid/factories'
import Dimension from '#models/dimension'

export const DimensionFactory = factory
  .define(Dimension, async ({ faker }) => {
    const dimensions = [
      {
        name: 'Gender',
        description: 'Analysis by gender identity',
      },
      {
        name: 'Ethnicity',
        description: 'Analysis by ethnic background',
      },
      {
        name: 'Age Group',
        description: 'Analysis by age demographics',
      },
      {
        name: 'Disability',
        description: 'Analysis by disability status',
      },
      {
        name: 'Department',
        description: 'Analysis by organizational department',
      },
      {
        name: 'Country',
        description: 'Analysis by geographic location',
      },
    ]

    const dimension = faker.helpers.arrayElement(dimensions)

    return {
      name: dimension.name,
      description: dimension.description,
    }
  })
  .build()
