const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl,
  createPublication,
  createNote
} = require('../utils/utils')
const { Reader } = require('../../models/Reader')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  // reader1
  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path

  // Create Reader object
  const person = {
    name: 'J. Random Reader'
  }

  await Reader.createReader(readerId, person)

  // reader2
  const token2 = getToken()

  // create publication and documents for reader 1
  const publication = await createPublication(readerUrl)
  const publicationUrl = publication.id

  // create Note for reader 1
  const noteActivity = await createNote(app, token, readerUrl)

  // get the urls needed for the tests
  const noteActivityUrl = noteActivity.get('Location')

  const noteActivityObject = await getActivityFromUrl(
    app,
    noteActivityUrl,
    token
  )

  const noteUrl = noteActivityObject.object.id

  await tap.test(
    'Try to get activity belonging to another reader',
    async () => {
      const res = await request(app)
        .get(urlparse(noteActivityUrl).path)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Activity')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Get Activity')
    }
  )

  await tap.test(
    'Try to get publication belonging to another reader',
    async () => {
      const res = await request(app)
        .get(urlparse(publicationUrl).path)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Publication')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Get Publication')
    }
  )

  await tap.test('Try to get note belonging to another reader', async () => {
    const res = await request(app)
      .get(urlparse(noteUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(error.details.type, 'Note')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Get Note')
  })

  await tap.test(
    'Try to get reader object belonging to another reader',
    async () => {
      const res = await request(app)
        .get(urlparse(readerUrl).path)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Reader')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Get Reader')
    }
  )

  await tap.test('Try to get library belonging to another reader', async () => {
    const res = await request(app)
      .get(`${urlparse(readerUrl).path}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(error.details.type, 'Reader')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Get Library')
  })

  await tap.test('Try to get outbox belonging to another reader', async () => {
    const res = await request(app)
      .get(`${urlparse(readerUrl).path}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(error.details.type, 'Reader')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Get Outbox')
  })

  await tap.test('Try to create an activity for another user', async () => {
    const res = await request(app)
      .post(`${urlparse(readerUrl).path}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
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
            type: 'reader:Tag',
            tagType: 'reader:Stack',
            name: 'mystack',
            json: { property: 'value' }
          }
        })
      )

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(error.details.type, 'Reader')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Create Activity')
  })

  await tap.test(
    'Try to upload files to a folder belonging to another reader',
    async () => {
      const res = await request(app)
        .post(`${urlparse(readerUrl).path}/file-upload`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .attach('files', 'tests/test-files/test-file3.txt')
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Reader')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Upload File')
    }
  )

  await tap.test('Requests without authentication', async () => {
    // outbox
    const res1 = await request(app)
      .get(`${urlparse(readerUrl).path}/activity`)
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res1.statusCode, 401)

    // reader
    const res2 = await request(app)
      .get(urlparse(readerUrl).path)
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res2.statusCode, 401)

    const res3 = await request(app)
      .get('/whoami')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res3.statusCode, 401)

    // publication
    const res4 = await request(app)
      .get(urlparse(publicationUrl).path)
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res4.statusCode, 401)

    // activity
    const res6 = await request(app)
      .get(urlparse(noteActivityUrl).path)
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res6.statusCode, 401)

    // file upload
    const res7 = await request(app)
      .post(`${urlparse(readerUrl).path}/file-upload`)
      .set('Host', 'reader-api.test')
      .attach('files', 'tests/test-files/test-file3.txt')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res7.statusCode, 401)
  })

  await destroyDB(app)
  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
}

module.exports = test
