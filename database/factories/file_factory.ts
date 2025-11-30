import factory from '@adonisjs/lucid/factories'
import File from '#models/file'

export const FileFactory = factory
  .define(File, async ({ faker }) => {
    const fileTypes = [
      'csv',
      'xlsx',
      'pdf',
      'json',
      'txt',
      'docx',
      'html',
    ]

    const type = faker.helpers.arrayElement(fileTypes)
    const fileName = faker.system.fileName({ extensionCount: 0 })

    return {
      type: type,
      path: `/uploads/${faker.string.uuid()}/${fileName}.${type}`,
    }
  })
  .build()
