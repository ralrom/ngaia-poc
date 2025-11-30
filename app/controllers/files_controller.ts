import type { HttpContext } from '@adonisjs/core/http'
import File from '#models/file'
import drive from '@adonisjs/drive/services/main'
import { cuid } from '@adonisjs/core/helpers'
import db from '@adonisjs/lucid/services/db'

export default class FilesController {
  /**
   * Display a list of all files
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const type = request.input('type')

    const query = File.query()

    if (type) {
      query.where('type', type)
    }

    const files = await query.paginate(page, limit)

    return response.ok(files)
  }

  /**
   * Handle form submission for the create action
   * Uses database transaction to ensure atomicity between S3 upload and DB record creation
   */
  async store({ request, response }: HttpContext) {
    const uploadedFile = request.file('file', {
      size: '100mb',
      extnames: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'],
    })

    if (!uploadedFile) {
      return response.badRequest({ error: 'No file provided' })
    }

    const type = request.input('type', 'general')

    // Generate unique filename
    const fileName = `${cuid()}.${uploadedFile.extname}`
    const filePath = `${type}/${fileName}`

    // Start database transaction
    const trx = await db.connection().transaction()

    try {
      // Create database record first within transaction
      const file = await File.create(
        {
          type,
          path: '', // Temporary empty path, will be updated after S3 upload
        },
        { client: trx }
      )

      try {
        // Upload to S3/MinIO
        await uploadedFile.moveToDisk(filePath)

        // Get the file URL
        const url = await drive.use().getUrl(filePath)

        // Update the file record with the actual URL
        file.path = url
        await file.save()

        // Commit transaction - both DB and S3 operations succeeded
        await trx.commit()

        return response.created(file)
      } catch (uploadError) {
        // S3/MinIO upload failed - rollback database transaction
        await trx.rollback()
        console.error('File upload to storage failed:', uploadError)
        return response.badRequest({
          error: 'Failed to upload file to storage',
          message: uploadError instanceof Error ? uploadError.message : 'Unknown error',
        })
      }
    } catch (dbError) {
      // Database error - rollback transaction
      await trx.rollback()
      console.error('Database error during file creation:', dbError)
      return response.badRequest({
        error: 'Failed to create file record',
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
      })
    }
  }

  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    try {
      const file = await File.findOrFail(params.id)
      return response.ok(file)
    } catch (error) {
      return response.notFound({ error: 'File not found' })
    }
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const file = await File.findOrFail(params.id)

      const data = request.only(['type', 'path'])

      file.merge(data)
      await file.save()

      return response.ok(file)
    } catch (error) {
      return response.notFound({ error: 'File not found' })
    }
  }

  /**
   * Download/serve a file
   */
  async download({ params, response }: HttpContext) {
    try {
      const file = await File.findOrFail(params.id)
      const exists = await drive.use().exists(file.path)

      if (!exists) {
        return response.notFound({ error: 'File not found in storage' })
      }

      // Stream the file from S3/MinIO
      const fileStream = await drive.use().getStream(file.path)

      // Set appropriate headers
      response.header('Content-Type', 'application/octet-stream')
      response.header('Content-Disposition', `attachment; filename="${file.path.split('/').pop()}"`)

      return response.stream(fileStream)
    } catch (error) {
      console.error('File download error:', error)
      return response.notFound({ error: 'File not found' })
    }
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const file = await File.findOrFail(params.id)

      // Extract the file path from the URL
      // URL format: http://localhost:9000/bucket-name/path/to/file
      const urlPath = new URL(file.path).pathname
      const pathParts = urlPath.substring(1).split('/')
      const filePath = pathParts.slice(1).join('/') // Skip bucket name

      try {
        // Delete from S3/MinIO
        await drive.use().delete(filePath)
      } catch (deleteError) {
        console.error('Error deleting file from storage:', deleteError)
        // Continue with database deletion even if storage deletion fails
      }

      // Delete database record
      await file.delete()

      return response.ok({ message: 'File deleted successfully' })
    } catch (error) {
      return response.notFound({ error: 'File not found' })
    }
  }
}
