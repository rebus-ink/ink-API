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
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerId = await createUser(app, token)

  const publication = await createPublication(readerId)
  const publicationUrl = publication.id
  const publicationId = urlToId(publication.id)

  const createdDocument = await createDocument(readerId, publicationUrl)

  const documentUrl = `${publicationUrl}/${createdDocument.documentPath}`

  const note = await createNote(app, token, urlToId(readerId), {
    body: { motivation: 'test', content: 'content goes here' },
    target: { property1: 'target information' },
    documentUrl,
    publicationId
  })
  const noteId = urlToId(note.id)

  await tap.test('Get Note', async () => {
    const res = await request(app)
      .get(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(body.body[0].motivation, 'test')
    await tap.equal(body.body[0].content, 'content goes here')
    await tap.equal(body.target.property1, 'target information')
    await tap.equal(body.documentUrl, documentUrl)
    await tap.equal(urlToId(body.publicationId), publicationId)
    await tap.ok(body.published)
    await tap.ok(body.updated)
  })

  await tap.test('Get Note from id url', async () => {
    const res = await request(app)
      .get(urlparse(note.id).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.body[0].motivation, 'test')
    await tap.equal(body.body[0].content, 'content goes here')
    await tap.equal(body.target.property1, 'target information')
    await tap.equal(body.documentUrl, documentUrl)
    await tap.equal(urlToId(body.publicationId), publicationId)
    await tap.ok(body.published)
    await tap.ok(body.updated)
  })

  await tap.test('Try to get Note that does not exist', async () => {
    const res = await request(app)
      .get(`/notes/${noteId}123`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `Get Note Error: No Note found with id ${noteId}123`
    )
    await tap.equal(error.details.requestUrl, `/notes/${noteId}123`)
  })

  await tap.test('Get Publication with reference to Notes', async () => {
    const res = await request(app)
      .get(`/publications/${urlToId(publicationUrl)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.ok(Array.isArray(body.replies))
    await tap.equal(body.replies.length, 1)
    await tap.type(body.replies[0], 'string')
  })

  await destroyDB(app)
}

module.exports = test
