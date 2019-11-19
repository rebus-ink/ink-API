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
  createDocument,
  createTag
} = require('../utils/utils')
const { urlToId } = require('../../utils/utils')
const { Reader } = require('../../models/Reader')
const { Note_Tag } = require('../../models/Note_Tag')
const { Note } = require('../../models/Note')

const test = async app => {
  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path

  // Create Reader object
  const person = {
    name: 'J. Random Reader'
  }
  const reader1 = await Reader.createReader(readerId, person)

  const publication = await createPublication(readerUrl)

  // Create a Document for that publication
  const documentObject = {
    mediaType: 'txt',
    url: 'http://google-bucket/somewhere/file1234.txt',
    documentPath: 'inside/the/book.txt',
    json: { property1: 'value1' }
  }
  const document = await createDocument(
    reader1.id,
    publication.id,
    documentObject
  )

  const documentUrl = `${publication.id}/${document.documentPath}`

  // create Note for reader 1
  const noteActivity = await createNote(app, token, readerUrl, {
    inReplyTo: documentUrl,
    context: publication.id
  })

  // get the urls needed for the tests
  const noteActivityUrl = noteActivity.get('Location')

  const noteActivityObject = await getActivityFromUrl(
    app,
    noteActivityUrl,
    token
  )
  const noteUrl = noteActivityObject.object.id

  // create Tag
  await createTag(app, token, readerUrl, {
    type: 'reader:Tag',
    tagType: 'reader:Stack',
    name: 'mystack',
    json: { property: 'value' }
  })

  // get tag object by fetching the library
  const libraryRes = await request(app)
    .get(`${readerUrl}/library`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

  const stack = libraryRes.body.tags[0]

  await tap.test(
    'Try to update a Tag with a tagId that does not exist',
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
              type: 'reader:Tag',
              id: stack.id + 'blah',
              name: 'newName'
            }
          })
        )

      await tap.equal(res.statusCode, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.details.type, 'reader:Tag')
      await tap.equal(error.details.activity, 'Update Tag')
    }
  )

  await tap.test('Try to update a Tag with a null tagId', async () => {
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
            type: 'reader:Tag',
            id: null,
            name: 'newName'
          }
        })
      )

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.details.type, 'reader:Tag')
    await tap.equal(error.details.activity, 'Update Tag')
  })

  await tap.test('Update a Tag name', async () => {
    // Get the library before the modifications
    const libraryBefore = await request(app)
      .get(`${readerUrl}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    // Add a tag to the note
    await Note_Tag.addTagToNote(urlToId(noteUrl), libraryBefore.body.tags[0].id)

    // Fetch the note with the tag
    const noteWithTag = await Note.byId(urlToId(noteUrl))
    await tap.equal(noteWithTag.tags.length, 1)
    await tap.equal(noteWithTag.tags[0].name, libraryBefore.body.tags[0].name)
    await tap.equal(libraryBefore.body.tags.length, 1)
    await tap.equal(libraryBefore.body.tags[0].name, stack.name)

    // Update the tag
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
            type: 'reader:Tag',
            id: stack.id,
            name: 'newName'
          }
        })
      )

    await tap.equal(res.statusCode, 201)

    // Get the library after the modifications
    const libraryAfter = await request(app)
      .get(`${readerUrl}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    // Get the note after the modifications
    const noteWithNewTag = await Note.byId(urlToId(noteUrl))
    await tap.equal(libraryAfter.body.tags.length, 1)
    await tap.equal(libraryAfter.body.tags[0].name, 'newName')
    await tap.equal(noteWithNewTag.tags.length, 1)
    await tap.equal(noteWithNewTag.tags[0].name, 'newName')
  })

  await tap.test('Update a Tag json', async () => {
    // Update the tag
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
            type: 'reader:Tag',
            id: stack.id,
            json: { property: 'value!!' }
          }
        })
      )

    await tap.equal(res.statusCode, 201)

    // Get the library after the modifications
    const libraryAfter = await request(app)
      .get(`${readerUrl}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    // Get the note after the modifications
    const noteWithNewTag = await Note.byId(urlToId(noteUrl))
    await tap.equal(libraryAfter.body.tags.length, 1)
    await tap.equal(libraryAfter.body.tags[0].json.property, 'value!!')
    await tap.equal(noteWithNewTag.tags.length, 1)
    await tap.equal(noteWithNewTag.tags[0].json.property, 'value!!')
  })

  await tap.test('Try to update a Tag with invalid values', async () => {
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
            type: 'reader:Tag',
            id: stack.id,
            name: { shouldNotBe: 'an object' }
          }
        })
      )

    await tap.equal(res.statusCode, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.details.type, 'reader:Tag')
    await tap.equal(error.details.activity, 'Update Tag')
    await tap.type(error.details.validation, 'object')
    await tap.equal(error.details.validation.name[0].keyword, 'type')
    await tap.equal(error.details.validation.name[0].params.type, 'string')
  })

  await tap.test('Try to update a Tag that was already deleted', async () => {
    await request(app)
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
            type: 'reader:Tag',
            id: stack.id
          }
        })
      )

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
            type: 'reader:Tag',
            id: stack.id,
            name: 'anotherNewName'
          }
        })
      )

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.details.type, 'reader:Tag')
    await tap.equal(error.details.activity, 'Update Tag')
  })

  await destroyDB(app)
}

module.exports = test
