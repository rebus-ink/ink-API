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
const { Document } = require('../../models/Document')
const { urlToId } = require('../../utils/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path

  const resActivity = await createPublication(app, token, readerUrl, {
    name: 'Publication A'
  })

  const pubActivityUrl = resActivity.get('Location')
  const pubActivityObject = await getActivityFromUrl(app, pubActivityUrl, token)
  const publicationUrl = pubActivityObject.object.id

  const resPublication = await request(app)
    .get(urlparse(publicationUrl).path)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

  // creating a document - this will not be exposed to the readers. It will be done as part of the upload
  const createdDocument = await Document.createDocument(
    { id: urlToId(readerId) },
    urlToId(resPublication.body.id),
    {
      documentPath: '/path/1',
      mediaType: 'text/html',
      url: 'http://something/123'
    }
  )

  const documentUrl = `${publicationUrl}${createdDocument.documentPath}`

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      { inReplyTo: documentUrl, context: publicationUrl },
      object
    )
    return await createNote(app, token, readerUrl, noteObj)
  }

  await tap.test('get Notes for reader paginated', async () => {
    await createNoteSimplified({ content: 'first' })
    await createNoteSimplified({ content: 'second' })
    await createNoteSimplified({ content: 'third' })
    await createNoteSimplified() // 4
    await createNoteSimplified() // 5
    await createNoteSimplified() // 6
    await createNoteSimplified() // 7
    await createNoteSimplified() // 8
    await createNoteSimplified() // 9
    await createNoteSimplified() // 10
    await createNoteSimplified() // 11
    await createNoteSimplified() // 12
    await createNoteSimplified() // 13

    const res2 = await request(app)
      .get(`${readerUrl}/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.status, 200)
    await tap.equal(res2.body.totalItems, 10)
    await tap.equal(res2.body.items.length, 10)

    const res3 = await request(app)
      .get(`${readerUrl}/notes?page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.status, 200)
    await tap.equal(res3.body.totalItems, 3)
    await tap.equal(res3.body.items.length, 3)

    const res4 = await request(app)
      .get(`${readerUrl}/notes?limit=11&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res4.status, 200)
    await tap.equal(res4.body.totalItems, 2)
    await tap.equal(res4.body.items.length, 2)
  })

  await tap.test('should paginate up to 100', async () => {
    // 13 so far
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    // 20
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    // 30
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    // 40
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    // 50
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    // 60
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    // 70
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    // 80
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    // 90
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    // 100
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified()
    await createNoteSimplified({ content: 'third last' })
    await createNoteSimplified({ content: 'second last' })
    await createNoteSimplified({ content: 'last' })
    // 110

    const res = await request(app)
      .get(`${readerUrl}/notes?limit=100`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.body.items.length, 100)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
