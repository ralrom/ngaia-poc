import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import File from '#models/file'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import drive from '@adonisjs/drive/services/main'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

test.group('Files controller', (group) => {
  // Cleanup DB between tests
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('POST /files - should upload a file successfully', async ({ client, assert }) => {
    const sampleFilePath = join(__dirname, '..', 'sample-files', 'sample-pdf.pdf')
    const fileBuffer = readFileSync(sampleFilePath)

    const response = await client
      .post('/files')
      .fields({ type: 'document' })
      .file('file', fileBuffer, { filename: 'sample-pdf.pdf' })

    response.assertStatus(201)
    response.assertBodyContains({
      type: 'document',
    })

    const body = response.body()
    assert.exists(body.id)
    assert.exists(body.path)
    assert.isTrue(body.path.includes('uploads/document/'))
    assert.isTrue(body.path.endsWith('.pdf'))

    // Extract file path from URL for verification
    // The URL format is: http://localhost:9000/bucket-name/path/to/file
    const urlPath = new URL(body.path).pathname
    // Remove the leading slash and bucket name
    const pathParts = urlPath.substring(1).split('/')
    const filePath = pathParts.slice(1).join('/') // Skip bucket name

    // Fetch the file directly from drive service
    const fileContent = await drive.use().get(filePath)

    // Verify the file content exists
    assert.exists(fileContent)
    assert.isNotEmpty(fileContent)
  })

  test('POST /files - should upload file with default type when not provided', async ({
    client,
  }) => {
    const sampleFilePath = join(__dirname, '..', 'sample-files', 'sample-pdf.pdf')
    const fileBuffer = readFileSync(sampleFilePath)

    const response = await client
      .post('/files')
      .file('file', fileBuffer, { filename: 'sample-pdf.pdf' })

    response.assertStatus(201)
    response.assertBodyContains({
      type: 'general',
    })
  })

  test('POST /files - should return 400 when no file is provided', async ({ client }) => {
    const response = await client.post('/files').fields({ type: 'document' })

    response.assertStatus(400)
    response.assertBodyContains({
      error: 'No file provided',
    })
  })

  test('GET /files - should list all files with pagination', async ({ client, assert }) => {
    // Create test files in database
    await File.createMany([
      { type: 'document', path: 'https://example.com/file1.pdf' },
      { type: 'image', path: 'https://example.com/file2.jpg' },
      { type: 'document', path: 'https://example.com/file3.pdf' },
    ])

    const response = await client.get('/files').qs({ page: 1, limit: 10 })

    response.assertStatus(200)

    const body = response.body()
    console.log(body.data)
    assert.properties(body, ['meta', 'data'])
    assert.equal(body.data.length, 3)
    assert.equal(body.meta.total, 3)
  })

  test('GET /files - should filter files by type', async ({ client, assert }) => {
    // Create test files in database
    await File.createMany([
      { type: 'document', path: 'https://example.com/file1.pdf' },
      { type: 'image', path: 'https://example.com/file2.jpg' },
      { type: 'document', path: 'https://example.com/file3.pdf' },
    ])

    const response = await client.get('/files').qs({ type: 'document' })

    response.assertStatus(200)

    const body = response.body()
    assert.equal(body.data.length, 2)
    assert.isTrue(body.data.every((file: any) => file.type === 'document'))
  })

  test('GET /files - should paginate results correctly', async ({ client, assert }) => {
    // Create 15 test files
    const files = Array.from({ length: 15 }, (_, i) => ({
      type: 'test',
      path: `https://example.com/file${i + 1}.pdf`,
    }))
    await File.createMany(files)

    const response = await client.get('/files').qs({ page: 1, limit: 10 })

    response.assertStatus(200)

    const body = response.body()
    assert.equal(body.data.length, 10)
    assert.equal(body.meta.total, 15)
    assert.equal(body.meta.currentPage, 1)
    assert.equal(body.meta.lastPage, 2)
  })

  test('GET /files/:id - should show a specific file', async ({ client }) => {
    const file = await File.create({
      type: 'document',
      path: 'https://example.com/test.pdf',
    })

    const response = await client.get(`/files/${file.id}`)

    response.assertStatus(200)
    response.assertBodyContains({
      id: file.id,
      type: 'document',
      path: 'https://example.com/test.pdf',
    })
  })

  test('GET /files/:id - should return 404 for non-existent file', async ({ client }) => {
    const response = await client.get('/files/99999')

    response.assertStatus(404)
    response.assertBodyContains({
      error: 'File not found',
    })
  })

  test('GET /files/:id/download - should download a file', async ({ client, assert }) => {
    // First, upload a file
    const sampleFilePath = join(__dirname, '..', 'sample-files', 'sample-pdf.pdf')
    const fileBuffer = readFileSync(sampleFilePath)

    const uploadResponse = await client
      .post('/files')
      .fields({ type: 'test' })
      .file('file', fileBuffer, { filename: 'sample-pdf.pdf' })

    uploadResponse.assertStatus(201)
    const uploadedFile = uploadResponse.body()

    // Now download the file
    const downloadResponse = await client.get(`/files/${uploadedFile.id}/download`)

    downloadResponse.assertStatus(200)

    // Check headers
    const contentDisposition = downloadResponse.headers()['content-disposition']
    assert.exists(contentDisposition)
    assert.isTrue(contentDisposition.includes('attachment'))

    // Check that we received binary content
    assert.isTrue(downloadResponse.body().length > 0)
  })

  test('GET /files/:id/download - should return 404 for non-existent file', async ({ client }) => {
    const response = await client.get('/files/99999/download')

    response.assertStatus(404)
    response.assertBodyContains({
      error: 'File not found',
    })
  })

  test('GET /files/:id/download - should return 404 when file not in storage', async ({
    client,
  }) => {
    // Create a file record without actually uploading to storage
    const file = await File.create({
      type: 'test',
      path: 'http://localhost:9000/uploads/test/nonexistent.pdf',
    })

    const response = await client.get(`/files/${file.id}/download`)

    response.assertStatus(404)
    response.assertBodyContains({
      error: 'File not found in storage',
    })
  })

  test('PUT /files/:id - should update file metadata', async ({ client, assert }) => {
    const file = await File.create({
      type: 'document',
      path: 'https://example.com/test.pdf',
    })

    const response = await client.put(`/files/${file.id}`).json({
      type: 'image',
      path: 'https://example.com/updated.jpg',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      id: file.id,
      type: 'image',
      path: 'https://example.com/updated.jpg',
    })

    // Verify in database
    await file.refresh()
    assert.equal(file.type, 'image')
    assert.equal(file.path, 'https://example.com/updated.jpg')
  })

  test('PUT /files/:id - should return 404 for non-existent file', async ({ client }) => {
    const response = await client.put('/files/99999').json({
      type: 'document',
    })

    response.assertStatus(404)
    response.assertBodyContains({
      error: 'File not found',
    })
  })

  test('DELETE /files/:id - should delete file from storage and database', async ({
    client,
    assert,
  }) => {
    // First, upload a file
    const sampleFilePath = join(__dirname, '..', 'sample-files', 'sample-pdf.pdf')
    const fileBuffer = readFileSync(sampleFilePath)

    const uploadResponse = await client
      .post('/files')
      .fields({ type: 'test' })
      .file('file', fileBuffer, { filename: 'sample-pdf.pdf' })

    uploadResponse.assertStatus(201)
    const uploadedFile = uploadResponse.body()

    // Extract file path from URL
    const urlPath = new URL(uploadedFile.path).pathname
    const pathParts = urlPath.substring(1).split('/')
    const filePath = pathParts.slice(1).join('/') // Skip bucket name

    // Verify file exists in storage before deletion
    const existsBeforeDelete = await drive.use().exists(filePath)
    assert.isTrue(existsBeforeDelete)

    // Delete the file
    const deleteResponse = await client.delete(`/files/${uploadedFile.id}`)

    deleteResponse.assertStatus(200)
    deleteResponse.assertBodyContains({
      message: 'File deleted successfully',
    })

    // Verify file is deleted from storage
    const existsAfterDelete = await drive.use().exists(filePath)
    assert.isFalse(existsAfterDelete)

    // Verify file is deleted from database
    const fileInDb = await File.find(uploadedFile.id)
    assert.isNull(fileInDb)
  })

  test('DELETE /files/:id - should return 404 for non-existent file', async ({ client }) => {
    const response = await client.delete('/files/99999')

    response.assertStatus(404)
    response.assertBodyContains({
      error: 'File not found',
    })
  })

  test('DELETE /files/:id - should delete database record even if storage deletion fails', async ({
    client,
    assert,
  }) => {
    // Create a file record with invalid storage path
    const file = await File.create({
      type: 'test',
      path: 'http://localhost:9000/uploads/test/nonexistent.pdf',
    })

    const response = await client.delete(`/files/${file.id}`)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'File deleted successfully',
    })

    // Verify file is deleted from database
    const fileInDb = await File.find(file.id)
    assert.isNull(fileInDb)
  })
})
