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

  const createNoteActivityUrl = response.get('Location')
  const noteActivityObject = await getActivityFromUrl(
    app,
    createNoteActivityUrl,
    token
  )
  noteUrl = noteActivityObject.object.id
  let firstUpdateTime

  await tap.test('Update the content of a Note', async () => {
    const res = await request(app)
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
          type: 'Update',
          object: {
            type: 'Note',
            id: noteUrl,
            content: 'new content!!'
          }
        })
      )

    await tap.equal(res.statusCode, 201)
    await tap.type(res.get('Location'), 'string')
    activityUrl = res.get('Location')

    const activityObject = await getActivityFromUrl(app, activityUrl, token)
    noteUrl = activityObject.object.id

    const resnote = await request(app)
      .get(urlparse(noteUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(resnote.statusCode, 200)

    const body = resnote.body
    await tap.type(body, 'object')
    await tap.equal(body.type, 'Note')
    await tap.type(body.id, 'string')
    await tap.type(body.content, 'string')
    await tap.equal(body.content, 'new content!!')
    await tap.notEqual(body.published, body.updated)
    // check that old properties are still there
    await tap.type(body.inReplyTo, 'string')
    await tap.type(body.context, 'string')
    await tap.type(body['oa:hasSelector'], 'object')
    await tap.type(body['@context'], 'object')
    await tap.ok(Array.isArray(body['@context']))

    firstUpdateTime = body.updated
  })

  await tap.test('Update the selector of a note', async () => {
    const res = await request(app)
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
          type: 'Update',
          object: {
            type: 'Note',
            id: noteUrl,
            'oa:hasSelector': { property1: 'new value' }
          }
        })
      )

    await tap.equal(res.statusCode, 201)
    await tap.type(res.get('Location'), 'string')
    activityUrl = res.get('Location')

    const activityObject = await getActivityFromUrl(app, activityUrl, token)
    noteUrl = activityObject.object.id

    const resnote = await request(app)
      .get(urlparse(noteUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(resnote.statusCode, 200)

    const body = resnote.body
    await tap.type(body, 'object')
    await tap.equal(body.type, 'Note')
    await tap.type(body.id, 'string')
    await tap.type(body.content, 'string')
    await tap.equal(body.content, 'new content!!')
    await tap.notEqual(firstUpdateTime, body.updated)
    await tap.type(body.inReplyTo, 'string')
    await tap.type(body.context, 'string')
    await tap.type(body['oa:hasSelector'], 'object')
    await tap.equal(body['oa:hasSelector'].property1, 'new value')
    await tap.type(body['@context'], 'object')
    await tap.ok(Array.isArray(body['@context']))
  })

  // TODO: figure out why this returns a json error instead of a validation error.

  await tap.test(
    'Try to update the selector of a note to the wrong type',
    async () => {
      const res = await request(app)
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
            type: 'Update',
            object: {
              type: 'Note',
              id: noteUrl,
              'oa:hasSelector': 'string!!!'
            }
          })
        )
      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(error.details.type, 'Note')
      await tap.equal(error.details.activity, 'Update Note')
      await tap.type(error.details.validation, 'object')
      await tap.equal(
        error.details.validation['oa:hasSelector'][0].keyword,
        'type'
      )
      await tap.equal(
        error.details.validation['oa:hasSelector'][0].params.type,
        'object'
      )
    }
  )

  await tap.test('Try to update noteType', async () => {
    const res = await request(app)
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
          type: 'Update',
          object: {
            type: 'Note',
            id: noteUrl,
            noteType: 'something else'
          }
        })
      )

    await tap.equal(res.statusCode, 201)
    await tap.type(res.get('Location'), 'string')
    activityUrl = res.get('Location')

    const activityObject = await getActivityFromUrl(app, activityUrl, token)
    noteUrl = activityObject.object.id

    const resnote = await request(app)
      .get(urlparse(noteUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(resnote.statusCode, 200)

    const body = resnote.body
    await tap.type(body, 'object')
    await tap.equal(body.type, 'Note')
    // should not have changed!
    await tap.equal(body.noteType, 'test')
  })

  await tap.test('Try to update a Note that does not exist', async () => {
    const res = await request(app)
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
          type: 'Update',
          object: {
            type: 'Note',
            id: noteUrl + 'abc',
            content: 'new content!!'
          }
        })
      )
    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.details.type, 'Note')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Update Note')
  })

  await destroyDB(app)
}

module.exports = test
