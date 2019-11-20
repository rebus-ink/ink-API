const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote,
  createDocument
} = require('../utils/utils')

const test = async app => {
  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path

  const publication = await createPublication(readerUrl, {
    name: 'Publication A'
  })
  const publicationUrl = publication.id

  const createdDocument = await createDocument(readerId, publicationUrl, {
    documentPath: 'path/1',
    mediaType: 'text/html',
    url: 'http://something/123'
  })

  const documentUrl = `${publicationUrl}/${createdDocument.documentPath}`

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      { inReplyTo: documentUrl, context: publicationUrl },
      object
    )
    return await createNote(app, token, readerUrl, noteObj)
  }

  await tap.test('Get empty list of notes', async () => {
    const res = await request(app)
      .get(`${readerUrl}/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.equal(body.totalItems, 0)
    await tap.equal(body.items.length, 0)
  })

  await tap.test('Get all notes for a Reader', async () => {
    // create more notes
    await createNoteSimplified({ content: 'first' })
    await createNoteSimplified({ content: 'second' })
    await createNoteSimplified({ content: 'third' })

    const res = await request(app)
      .get(`${readerUrl}/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.equal(body.totalItems, 3)
    await tap.equal(body.items.length, 3)
    await tap.equal(body.items[0].type, 'Note')
    await tap.ok(body.items[0]['oa:hasSelector'])
    // notes should include publication information
    await tap.ok(body.items[0].publication)
    await tap.type(body.items[0].publication.name, 'string')
    await tap.ok(body.items[0].publication.author)
    await tap.type(body.items[0].publication.author[0].name, 'string')
  })

  await tap.test(
    'Try to get Notes for a reader that does not exist',
    async () => {
      const res = await request(app)
        .get(`${readerUrl}abc/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(error.details.type, 'Reader')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Get Notes')
    }
  )

  await destroyDB(app)
}

module.exports = test
