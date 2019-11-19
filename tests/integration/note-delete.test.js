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
const { Tag } = require('../../models/Tag')
const { Note_Tag } = require('../../models/Note_Tag')
const { Note } = require('../../models/Note')
const { urlToId } = require('../../utils/utils')

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

  await tap.test('Delete a Note', async () => {
    // Create a tag for testing purposes and add it to the note
    const createdTag = await Tag.createTag(readerId, {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'random stack'
    })

    await Note_Tag.addTagToNote(urlToId(noteUrl), createdTag.id)

    const pubresbefore = await request(app)
      .get(urlparse(publicationUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    // Fetch the note that now has a tag
    const noteBefore = await Note.byId(urlToId(noteUrl))

    await tap.equal(pubresbefore.body.replies.length, 1)
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
  })

  await tap.test(
    'Deleted Note should no longer be attached to publication',
    async () => {
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
    }
  )

  await tap.test(
    'Deleted Note should no longer show up in a list of the reader notes',
    async () => {
      const res = await request(app)
        .get(`${readerUrl}/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.statusCode, 200)
      await tap.equal(res.body.items.length, 0)
    }
  )

  await tap.test('Try to delete a Note that does not exist', async () => {
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

  await tap.test('Try to delete a Note that was already deleted', async () => {
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
  })

  // DELETE NOTES FOR PUB
  await tap.test('Delete all Notes for a Publication', async () => {
    // create two notes for our publication:
    const createNoteRes = await createNote(app, token, readerUrl, {
      content: 'This is the content of note B.',
      'oa:hasSelector': { propety: 'value' },
      context: publicationUrl,
      inReplyTo: documentUrl,
      noteType: 'test'
    })
    const createNoteActivityUrl1 = createNoteRes.get('Location')
    const noteActivityObject1 = await getActivityFromUrl(
      app,
      createNoteActivityUrl1,
      token
    )
    newNoteUrl = noteActivityObject1.object.id

    await createNote(app, token, readerUrl, {
      content: 'This is the content of note C.',
      'oa:hasSelector': { propety: 'value' },
      context: publicationUrl,
      inReplyTo: documentUrl,
      noteType: 'test'
    })

    // before: publication has two replies
    const pubresbefore = await request(app)
      .get(urlparse(publicationUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(pubresbefore.body.replies.length, 2)

    // now delete all notes for pub:
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
            type: 'Collection',
            name: 'Publication Notes',
            id: publicationUrl
          }
        })
      )

    await tap.equal(res.statusCode, 204)

    // notes should no longer exist
    const getres = await request(app)
      .get(urlparse(newNoteUrl).path)
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

    // publication should now have no notes
    const pubresafter = await request(app)
      .get(urlparse(publicationUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(pubresafter.body.replies.length, 0)
  })

  await tap.test(
    'Try to delete all Notes for a Publication with undefined publication id',
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
            type: 'Delete',
            object: {
              type: 'Collection',
              name: 'Publication Notes'
            }
          })
        )

      await tap.equal(res.statusCode, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(error.details.type, 'Collection')
      await tap.equal(error.details.activity, 'Delete Collection')
      await tap.equal(error.details.missingParams[0], 'object.id')
    }
  )

  await tap.test('Delete all notes for an invalid publication id', async () => {
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
            type: 'Collection',
            name: 'Publication Notes',
            id: '123'
          }
        })
      )

    // NOTE: does not return an error. It just deletes nothing.
    await tap.equal(res.statusCode, 204)
  })

  await destroyDB(app)
}

module.exports = test
