const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl,
  createPublication,
  createNote,
  createDocument
} = require('../utils/utils')

const test = async app => {
  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path
  let noteUrl

  const publication = await createPublication(readerUrl)
  const publicationUrl = publication.id

  const createdDocument = await createDocument(readerId, publicationUrl)

  const documentUrl = `${publicationUrl}/${createdDocument.documentPath}`

  const response = await createNote(app, token, readerUrl, {
    content: 'This is the content of note A.',
    'oa:hasSelector': { propety: 'value' },
    context: publicationUrl,
    inReplyTo: documentUrl,
    noteType: 'test',
    json: { property1: 'value1' }
  })

  const activityUrl = response.get('Location')

  await tap.test('Get Note', async () => {
    const activityObject = await getActivityFromUrl(app, activityUrl, token)
    noteUrl = activityObject.object.id

    const res = await request(app)
      .get(urlparse(noteUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.type, 'Note')
    await tap.type(body.id, 'string')
    await tap.type(body.content, 'string')
    await tap.type(body.inReplyTo, 'string')
    await tap.type(body.context, 'string')
    await tap.type(body['oa:hasSelector'], 'object')
    await tap.type(body['@context'], 'object')
    await tap.type(body.json, 'object')
    await tap.ok(body.published)
    await tap.ok(body.updated)
    await tap.ok(Array.isArray(body['@context']))
  })

  await tap.test('Try to get Note that does not exist', async () => {
    const res = await request(app)
      .get(urlparse(noteUrl).path + 'abc')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.details.type, 'Note')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Get Note')
  })

  await tap.test('Get Publication with reference to Notes', async () => {
    const res = await request(app)
      .get(urlparse(publicationUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.ok(Array.isArray(body.replies))
    await tap.equal(body.replies.length, 1)
    await tap.type(body.replies[0], 'string')
  })

  await destroyDB(app)
}

module.exports = test
