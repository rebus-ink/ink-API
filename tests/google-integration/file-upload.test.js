const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../utils/utils')
const { urlToId } = require('../../utils/utils')
const _ = require('lodash')

const { Storage } = require('@google-cloud/storage')
const storage = new Storage()

const test = async app => {
  const token = getToken()
  const userCompleteUrl = await createUser(app, token)
  const userUrl = urlparse(userCompleteUrl).path
  const userId = urlToId(userCompleteUrl)
  let file1Name, file2Name

  await tap.test('Upload file', async () => {
    const res = await request(app)
      .post(`${userUrl}/file-upload`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'files')
      .attach('files', 'tests/test-files/test-file1.txt')
      .attach('files', 'tests/test-files/test-file2.html')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body['test-file1.txt'], 'string')
    await tap.ok(
      body['test-file1.txt'].startsWith(
        'https://storage.googleapis.com/reader-test'
      )
    )
    await tap.type(body['test-file2.html'], 'string')

    // check bucket
    const bucket = await storage.bucket(`reader-test-${userId.toLowerCase()}`)

    const exists = await bucket.exists()
    await tap.ok(exists[0])

    // check files
    const [files] = await bucket.getFiles()
    await tap.equal(files.length, 2)
    file1Name = urlparse(body['test-file1.txt']).path.substr(userId.length + 14)
    const file1Exists = _.find(files, file => file.name === file1Name)
    await tap.ok(file1Exists)

    file2Name = urlparse(body['test-file2.html']).path.substr(
      userId.length + 14
    )
    const file2Exists = _.find(files, file => file.name === file2Name)
    await tap.ok(file2Exists)
  })

  await tap.test('Upload another file for the same user', async () => {
    const res = await request(app)
      .post(`${userUrl}/file-upload`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'files')
      .attach('files', 'tests/test-files/test-file3.txt')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body['test-file3.txt'], 'string')
    await tap.ok(
      body['test-file3.txt'].startsWith(
        'https://storage.googleapis.com/reader-test'
      )
    )

    // check bucket
    const bucket = await storage.bucket(`reader-test-${userId.toLowerCase()}`)
    const exists = await bucket.exists()
    await tap.ok(exists)

    // check files
    const [files] = await bucket.getFiles()
    await tap.equal(files.length, 3)
    const file1Exists = _.find(files, file => file.name === file1Name)
    await tap.ok(file1Exists)

    const file2Exists = _.find(files, file => file.name === file2Name)
    await tap.ok(file2Exists)

    let file3Name = urlparse(body['test-file3.txt']).path.substr(
      userId.length + 14
    )
    const file3Exists = _.find(files, file => file.name === file3Name)
    await tap.ok(file3Exists)

    // clean up bucket, only if we are sure it only contains the test files.
    if (files.length === 3 && file1Exists && file2Exists && file3Exists) {
      await bucket.deleteFiles()
      await bucket.delete()
    }
  })

  await tap.test('Upload without including a file', async () => {
    const res = await request(app)
      .post(`${userUrl}/file-upload`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'files')

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(error.details.type, 'file-upload')
    await tap.equal(error.details.missingParams[0], 'req.files')
    await tap.equal(error.details.activity, 'Upload File')
  })

  await destroyDB(app)
}

module.exports = test
