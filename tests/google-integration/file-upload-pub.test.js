const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../utils/utils')
const { urlToId } = require('../../utils/utils')

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

  let jobId, publicationId, documentPath

  await tap.test('Upload file', async () => {
    // check bucket before to see number of files
    const bucket = await storage.bucket('publication-file-uploads-test')
    const [filesBefore] = await bucket.getFiles()
    const lengthBefore = filesBefore.length

    const res = await request(app)
      .post(`${readerUrl}/file-upload-pub`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', 'tests/test-files/file.epub')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.type, 'epub')
    await tap.ok(body.id)

    jobId = body.id

    // check files
    const [filesAfter] = await bucket.getFiles()
    await tap.equal(filesAfter.length, lengthBefore + 1)
  })

  await tap.test('Get job - should be incomplete', async () => {
    const res = await request(app)
      .get(`/job-${jobId}`)
      .set('Authorization', `Bearer ${token}`)

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.notOk(body.finished)
    await tap.equal(body.status, 304)
  })

  await tap.test('Job should eventually be complete', async () => {
    function sleep (ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }

    await sleep(10000)

    //  const tryGetJob = async () => {
    //    timestamp = new Date().getTime()
    const res = await request(app)
      .get(`/job-${jobId}`)
      .set('Authorization', `Bearer ${token}`)

    //  if (res.body.finished || timestamp > timeoutTime) {
    const finished = !!res.body.finished
    const error = res.body.error
    const status = res.body.status
    publicationId = res.body.publicationId
    await tap.ok(finished)
    await tap.notOk(error)
    await tap.equal(status, 302)
    // } else {
    //   await sleep(1000)
    //   await tryGetJob()
    // }
    // }
    //   await tryGetJob()
  })

  await tap.test(
    'Once complete, should be able to get the publication',
    async () => {
      const res = await request(app)
        .get(`/publication-${publicationId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
      await tap.equal(res.statusCode, 200)
      const body = res.body
      await tap.equal(body.name, 'Minimal Test File')
      documentPath = body.readingOrder[0].url
    }
  )

  await tap.test('Should be able to get document', async () => {
    const res = await request(app)
      .get(`/publication-${publicationId}/${documentPath}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    const expectedUrl = `https://storage.googleapis.com/publication-file-storage-test/reader-${readerId}/publication-${publicationId}/${documentPath}`

    await tap.equal(res.statusCode, 302)
    await tap.equal(res.text, `Found. Redirecting to ${expectedUrl}`)
  })

  // await tap.test('Upload multiple files concurrently', async () => {
  //   const upload = request(app)
  //     .post(`${publicationUrl2}/file-upload`)
  //     .set('Authorization', `Bearer ${token}`)
  //     .field('name', 'file')
  //     .field('documentPath', crypto.randomBytes(8).toString('hex'))
  //     .field('mediaType', 'text/html')
  //     .field('json', JSON.stringify({ test: 'Value' }))
  //     .attach('file', 'tests/test-files/test-file4.txt')

  //   const res = await Promise.all([
  //     upload,
  //     upload,
  //     upload,
  //     upload,
  //     upload,
  //     upload,
  //     upload,
  //     upload,
  //     upload,
  //     upload
  //   ])

  //   await tap.equal(res[0].statusCode, 200)
  //   await tap.equal(res[1].statusCode, 200)
  //   await tap.equal(res[2].statusCode, 200)
  //   await tap.equal(res[3].statusCode, 200)
  //   await tap.equal(res[4].statusCode, 200)
  //   await tap.equal(res[5].statusCode, 200)
  //   await tap.equal(res[6].statusCode, 200)
  //   await tap.equal(res[7].statusCode, 200)
  //   await tap.equal(res[8].statusCode, 200)
  //   await tap.equal(res[9].statusCode, 200)
  // })

  // await tap.test(
  //   'try to upload a file to a publication that does not exist',
  //   async () => {
  //     const res = await request(app)
  //       .post(`${publicationUrl}abc/file-upload`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .field('name', 'file')
  //       .field('documentPath', path)
  //       .field('mediaType', 'text/html')
  //       .field('json', JSON.stringify({ test: 'Value' }))
  //       .attach('file', 'tests/test-files/test-file1.txt')
  //     await tap.equal(res.status, 404)
  //     const error = JSON.parse(res.text)
  //     await tap.equal(error.statusCode, 404)
  //     await tap.equal(error.error, 'Not Found')
  //     await tap.equal(error.details.type, 'Publication')
  //     await tap.type(error.details.id, 'string')
  //     await tap.equal(error.details.activity, 'Upload File to Publication')
  //   }
  // )

  // await tap.test(
  //   'using the upload route without including a file',
  //   async () => {
  //     const res = await request(app)
  //       .post(`${publicationUrl}/file-upload`)
  //       .set('Authorization', `Bearer ${token}`)
  //       .field('name', 'file')
  //       .field('documentPath', path)
  //       .field('mediaType', 'text/html')
  //       .field('json', JSON.stringify({ test: 'Value' }))

  //     await tap.equal(res.status, 400)
  //     const error = JSON.parse(res.text)
  //     await tap.equal(error.statusCode, 400)
  //     await tap.equal(error.error, 'Bad Request')
  //     await tap.equal(error.details.type, 'publication-file-upload')
  //     await tap.equal(error.details.missingParams[0], 'req.file')
  //     await tap.equal(error.details.activity, 'Upload File to Publication')
  //   }
  // )

  // await tap.test('get file through redirect', async () => {
  //   const res = await request(app)
  //     .get(`${publicationUrl}/${path}`)
  //     .set('Authorization', `Bearer ${token}`)

  //   await tap.ok(res)
  //   await tap.equal(res.status, 302)
  //   await tap.equal(res.text, `Found. Redirecting to ${url}`)
  // })

  // await tap.test('get file that does not exist', async () => {
  //   const res = await request(app)
  //     .get(`${publicationUrl}/${path}abc`)
  //     .set('Authorization', `Bearer ${token}`)

  //   await tap.ok(res)
  //   await tap.equal(res.status, 404)
  //   const error = JSON.parse(res.text)
  //   await tap.equal(error.statusCode, 404)
  //   await tap.equal(error.error, 'Not Found')
  //   await tap.equal(error.details.type, 'Document')
  //   await tap.equal(error.details.path, path + 'abc')
  //   await tap.equal(error.details.activity, 'Get File for Publication')
  // })

  // await tap.test(
  //   'try to get a file for a publication that does not exist',
  //   async () => {
  //     const res = await request(app)
  //       .get(`${publicationUrl}abc/${path}`)
  //       .set('Authorization', `Bearer ${token}`)

  //     await tap.ok(res)
  //     await tap.equal(res.status, 404)
  //     const error = JSON.parse(res.text)
  //     await tap.equal(error.statusCode, 404)
  //     await tap.equal(error.error, 'Not Found')
  //     await tap.equal(error.details.type, 'Publication')
  //     await tap.type(error.details.id, 'string')
  //     await tap.equal(error.details.activity, 'Get File for Publication')
  //   }
  // )

  await destroyDB(app)
  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
}

module.exports = test
