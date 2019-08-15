const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl
} = require('../utils/utils')

const { urlToId } = require('../../utils/utils')
const _ = require('lodash')
const { Document } = require('../../models/Document')
const crypto = require('crypto')

const { Storage } = require('@google-cloud/storage')
const storage = new Storage()

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path
  const readerId = urlToId(readerCompleteUrl)
  let file1Name

  // create publication
  const resActivity = await request(app)
    .post(`${readerUrl}/activity`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )
    .send(
      JSON.stringify({
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          { reader: 'https://rebus.foundation/ns/reader' }
        ],
        type: 'Create',
        object: {
          type: 'Publication',
          name: 'Publication A',
          author: ['John Smith'],
          editor: 'Jane Doe',
          description: 'this is a description!!',
          links: [{ property: 'value' }],
          readingOrder: [{ name: 'one' }, { name: 'two' }, { name: 'three' }],
          resources: [{ property: 'value' }],
          json: { property: 'value' }
        }
      })
    )

  const pubActivityUrl = resActivity.get('Location')
  const pubActivityObject = await getActivityFromUrl(app, pubActivityUrl, token)
  const publicationUrl = urlparse(pubActivityObject.object.id).path
  const publicationId = urlToId(pubActivityObject.object.id)
  let path = 'very/long/path/to/some/random/useless/file'
  let url

  // create secon publication
  const resActivity2 = await request(app)
    .post(`${readerUrl}/activity`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )
    .send(
      JSON.stringify({
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          { reader: 'https://rebus.foundation/ns/reader' }
        ],
        type: 'Create',
        object: {
          type: 'Publication',
          name: 'Publication B',
          author: ['John Smith'],
          editor: 'Jane Doe',
          description: 'this is a description!!',
          links: [{ property: 'value' }],
          readingOrder: [{ name: 'one' }, { name: 'two' }, { name: 'three' }],
          resources: [{ property: 'value' }],
          json: { property: 'value' }
        }
      })
    )

  const pubActivityUrl2 = resActivity2.get('Location')
  const pubActivityObject2 = await getActivityFromUrl(
    app,
    pubActivityUrl2,
    token
  )
  const publicationUrl2 = urlparse(pubActivityObject2.object.id).path

  await tap.test('Upload file', async () => {
    const res = await request(app)
      .post(`${publicationUrl}/file-upload`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'file')
      .field('documentPath', path)
      .field('mediaType', 'text/html')
      .field('json', JSON.stringify({ test: 'Value' }))
      .attach('file', 'tests/test-files/test-file1.txt')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.url, 'string')
    await tap.equal(body.documentPath, path)
    await tap.equal(body.mediaType, 'text/html')
    await tap.type(body.json, 'object')
    await tap.equal(body.json.test, 'Value')

    // check bucket
    const bucket = await storage.bucket(
      `reader-test-${publicationId.toLowerCase()}`
    )

    const exists = await bucket.exists()
    await tap.ok(exists[0])

    // check files
    const [files] = await bucket.getFiles()
    await tap.equal(files.length, 1)
    file1Name = urlparse(body.url).path.substr(readerId.length + 14)
    const file1Exists = _.find(files, file => file.name === file1Name)
    await tap.ok(file1Exists)

    // check that document was created
    const document = await Document.byPath(publicationId, path)

    await tap.ok(document)
    await tap.type(document.id, 'string')
    await tap.equal(document.documentPath, path)
    await tap.type(document.url, 'string')
    await tap.type(document.json, 'object')
    await tap.equal(document.json.test, 'Value')
    url = document.url
  })

  await tap.test('Upload multiple files concurrently', async () => {
    const upload = request(app)
      .post(`${publicationUrl2}/file-upload`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'file')
      .field('documentPath', crypto.randomBytes(8).toString('hex'))
      .field('mediaType', 'text/html')
      .field('json', JSON.stringify({ test: 'Value' }))
      .attach('file', 'tests/test-files/test-file4.txt')

    const res = await Promise.all([
      upload,
      upload,
      upload,
      upload,
      upload,
      upload,
      upload,
      upload,
      upload,
      upload
    ])

    await tap.equal(res[0].statusCode, 200)
    await tap.equal(res[1].statusCode, 200)
    await tap.equal(res[2].statusCode, 200)
    await tap.equal(res[3].statusCode, 200)
    await tap.equal(res[4].statusCode, 200)
    await tap.equal(res[5].statusCode, 200)
    await tap.equal(res[6].statusCode, 200)
    await tap.equal(res[7].statusCode, 200)
    await tap.equal(res[8].statusCode, 200)
    await tap.equal(res[9].statusCode, 200)
  })

  await tap.test(
    'try to upload a file to a publication that does not exist',
    async () => {
      const res = await request(app)
        .post(`${publicationUrl}abc/file-upload`)
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'file')
        .field('documentPath', path)
        .field('mediaType', 'text/html')
        .field('json', JSON.stringify({ test: 'Value' }))
        .attach('file', 'tests/test-files/test-file1.txt')
      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(error.details.type, 'Publication')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Upload File to Publication')
    }
  )

  await tap.test(
    'using the upload route without including a file',
    async () => {
      const res = await request(app)
        .post(`${publicationUrl}/file-upload`)
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'file')
        .field('documentPath', path)
        .field('mediaType', 'text/html')
        .field('json', JSON.stringify({ test: 'Value' }))

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(error.details.type, 'publication-file-upload')
      await tap.equal(error.details.missingParams[0], 'req.file')
      await tap.equal(error.details.activity, 'Upload File to Publication')
    }
  )

  await tap.test('get file through redirect', async () => {
    const res = await request(app)
      .get(`${publicationUrl}/${path}`)
      .set('Authorization', `Bearer ${token}`)

    await tap.ok(res)
    await tap.equal(res.status, 302)
    await tap.equal(res.text, `Found. Redirecting to ${url}`)
  })

  await tap.test('get file that does not exist', async () => {
    const res = await request(app)
      .get(`${publicationUrl}/${path}abc`)
      .set('Authorization', `Bearer ${token}`)

    await tap.ok(res)
    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.details.type, 'Document')
    await tap.equal(error.details.path, path + 'abc')
    await tap.equal(error.details.activity, 'Get File for Publication')
  })

  await tap.test(
    'try to get a file for a publication that does not exist',
    async () => {
      const res = await request(app)
        .get(`${publicationUrl}abc/${path}`)
        .set('Authorization', `Bearer ${token}`)

      await tap.ok(res)
      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(error.details.type, 'Publication')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Get File for Publication')
    }
  )

  await destroyDB(app)
  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
}

module.exports = test
