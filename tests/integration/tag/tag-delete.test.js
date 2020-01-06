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
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')
const { Reader } = require('../../../models/Reader')
const { Note_Tag } = require('../../../models/Note_Tag')
const { Note } = require('../../../models/Note')

const test = async app => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path
  const readerId = urlToId(readerCompleteUrl)

  // Create Reader object
  const person = {
    name: 'J. Random Reader'
  }
  const reader1 = await Reader.createReader(readerId, person)

  const publication = await createPublication(readerId)

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
  const noteActivity = await createNote(app, token, readerId, {
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
  const stack = await createTag(app, token, {
    type: 'reader:Tag',
    tagType: 'reader:Stack',
    name: 'mystack',
    json: { property: 'value' }
  })

  await tap.test(
    'Try to delete a Tag with a tagId that does not exist',
    async () => {
      const res = await request(app)
        .delete(`/tags/${stack.id}123`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.details.type, 'Tag')
      await tap.equal(error.details.activity, 'Delete Tag')
    }
  )

  await tap.test('Delete a Tag', async () => {
    // Get the library before the modifications
    const libraryBefore = await request(app)
      .get(`/readers/${readerId}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    // Add a tag to the note
    await Note_Tag.addTagToNote(urlToId(noteUrl), libraryBefore.body.tags[0].id)

    // Fetch the note with the tag
    const noteWithTag = await Note.byId(urlToId(noteUrl))
    await tap.equal(noteWithTag.tags.length, 1)
    await tap.equal(noteWithTag.tags[0].name, libraryBefore.body.tags[0].name)
    await tap.equal(libraryBefore.body.tags.length, 5) // 4 default modes + tag created

    // Delete the tag
    const res = await request(app)
      .delete(`/tags/${stack.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 204)

    // Get the library after the modifications
    const libraryAfter = await request(app)
      .get(`/readers/${readerId}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    // Get the note after the modifications
    const noteWithoutTag = await Note.byId(urlToId(noteUrl))

    await tap.equal(libraryAfter.body.tags.length, 4)
    await tap.equal(libraryAfter.body.items[0].tags.length, 0)
    await tap.equal(noteWithoutTag.tags.length, 0)
  })

  await tap.test('Try to delete a Tag that was already deleted', async () => {
    const res = await request(app)
      .delete(`/tags/${stack.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.details.type, 'Tag')
    await tap.equal(error.details.activity, 'Delete Tag')
  })

  await destroyDB(app)
}

module.exports = test
