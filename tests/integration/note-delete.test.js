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
const { Tag } = require('../../models/Tag')
const { Note_Tag } = require('../../models/Note_Tag')
const { Note } = require('../../models/Note')
const { urlToId } = require('../../utils/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path
  let noteUrl

  const resActivity = await createPublication(app, token, readerUrl)
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

  await tap.test('Delete a Note', async () => {
    // Create a tag for testing purposes and add it to the note
    const createdTag = await Tag.createTag(readerId, {
      type: 'reader:Stack',
      name: 'random stack'
    })

    await Note_Tag.addTagToNote(urlToId(noteUrl), createdTag.id)

    // before: there are two notes on this publication
    const pubresbefore = await request(app)
      .get(urlparse(publicationUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    // Fetch the note that now has a tag
    const noteBefore = await Note.byId(urlToId(noteUrl))

    await tap.equal(pubresbefore.body.replies.length, 1) // should be 2 if previous test is re-enabled
    await tap.equal(noteBefore.tags.length, 1)
    await tap.equal(noteBefore.tags[0].name, createdTag.name)

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
          type: 'Delete',
          object: {
            type: 'Note',
            id: noteUrl
          }
        })
      )

    await tap.equal(res.statusCode, 204)

    // note should no longer exist
    const getres = await request(app)
      .get(urlparse(noteUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(getres.statusCode, 404)
    const error = JSON.parse(getres.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.details.type, 'Note')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Get Note')

    // note should no longer be attached to publication
    const pubres = await request(app)
      .get(urlparse(publicationUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    // Fetch the note that should no longer have a tag
    const noteAfter = await Note.byId(urlToId(noteUrl))

    await tap.equal(noteAfter.tags.length, 0)
    await tap.ok(noteAfter.deleted)

    await tap.equal(pubres.statusCode, 200)

    const body = pubres.body
    await tap.ok(Array.isArray(body.replies))
    await tap.equal(body.replies.length, 0)
  })

  await tap.test('Try to delete a Note that does not exist', async () => {
    // already deleted
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
          type: 'Delete',
          object: {
            type: 'Note',
            id: noteUrl
          }
        })
      )

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.details.type, 'Note')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Delete Note')

    const res1 = await request(app)
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
          type: 'Delete',
          object: {
            type: 'Note',
            id: noteUrl + '123'
          }
        })
      )

    await tap.equal(res1.statusCode, 404)
    const error1 = JSON.parse(res1.text)
    await tap.equal(error1.statusCode, 404)
    await tap.equal(error1.error, 'Not Found')
    await tap.equal(error1.details.type, 'Note')
    await tap.type(error1.details.id, 'string')
    await tap.equal(error1.details.activity, 'Delete Note')
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
