const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  destroyDB,
  createReader,
  createPublication,
  createNote,
  createNoteContext,
  createTag
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()

  const reader = await createReader(app, token, {
    name: 'Joe Smith',
    profile: {
      favoriteColor: 'blue'
    },
    preferences: {
      property: 'value1'
    },
    json: {
      property2: 'value2'
    }
  })

  // add stuff for reader
  const pub = await createPublication(app, token)
  const note1 = await createNote(app, token, reader.shortId)
  const context = await createNoteContext(app, token, {
    type: 'test',
    name: 'my context'
  })
  await createTag(app, token)

  await tap.test('Delete reader', async () => {
    const res = await request(app)
      .delete(`/readers/${reader.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)
  })

  await tap.test('Cannot get deleted reader', async () => {
    const res = await request(app)
      .get(`/readers/${reader.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `Get Reader Error: No Reader found with id ${reader.shortId}`
    )
    await tap.equal(error.details.requestUrl, `/readers/${reader.shortId}`)

    const res1 = await request(app)
      .get(`/whoami`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res1.status, 404)
    const error1 = JSON.parse(res1.text)
    await tap.equal(error1.statusCode, 404)
    await tap.equal(error1.error, 'Not Found')
    await tap.equal(error1.message, `No reader found with this token`)
    await tap.equal(error1.details.requestUrl, `/whoami`)
  })

  await tap.test(
    'Cannot get deleted publication, note, noteContext, tag... belonging to deleted reader',
    async () => {
      const resPub = await request(app)
        .get(`/publications/${pub.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resPub.status, 404)
      const errorPub = JSON.parse(resPub.text)
      await tap.equal(errorPub.statusCode, 404)
      await tap.equal(errorPub.error, 'Not Found')
      await tap.equal(
        errorPub.message,
        `No Publication found with id ${pub.shortId}`
      )
      await tap.equal(
        errorPub.details.requestUrl,
        `/publications/${pub.shortId}`
      )

      const resNote = await request(app)
        .get(`/notes/${note1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resNote.status, 404)
      const errorNote = JSON.parse(resNote.text)
      await tap.equal(errorNote.statusCode, 404)
      await tap.equal(errorNote.error, 'Not Found')
      await tap.equal(
        errorNote.message,
        `Get Note Error: No Note found with id ${note1.shortId}`
      )
      await tap.equal(errorNote.details.requestUrl, `/notes/${note1.shortId}`)

      const resNoteContext = await request(app)
        .get(`/noteContexts/${context.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resNoteContext.status, 404)
      const errorContext = JSON.parse(resNoteContext.text)
      await tap.equal(errorContext.statusCode, 404)
      await tap.equal(errorContext.error, 'Not Found')
      await tap.equal(
        errorContext.message,
        `Get NoteContext Error: No NoteContext found with id ${context.shortId}`
      )
      await tap.equal(
        errorContext.details.requestUrl,
        `/noteContexts/${context.shortId}`
      )

      const resTags = await request(app)
        .get(`/tags`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resTags.status, 404)
      const errorTags = JSON.parse(resTags.text)
      await tap.equal(errorTags.statusCode, 404)
      await tap.equal(errorTags.error, 'Not Found')
      await tap.equal(errorTags.message, `No reader found with this token`)
      await tap.equal(errorTags.details.requestUrl, `/tags`)

      const resLibrary = await request(app)
        .get(`/library`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resLibrary.status, 404)
      const errorLibrary = JSON.parse(resLibrary.text)
      await tap.equal(errorLibrary.statusCode, 404)
      await tap.equal(errorLibrary.error, 'Not Found')
      await tap.equal(errorLibrary.message, `No reader found with this token`)
      await tap.equal(errorLibrary.details.requestUrl, `/library`)

      const resNotes = await request(app)
        .get(`/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resNotes.status, 404)
      const errorNotes = JSON.parse(resNotes.text)
      await tap.equal(errorNotes.statusCode, 404)
      await tap.equal(errorNotes.error, 'Not Found')
      await tap.equal(errorNotes.message, `No reader found with this token`)
      await tap.equal(errorNotes.details.requestUrl, `/notes`)
    }
  )

  await tap.test('Try to delete reader that does not exist', async () => {
    const res = await request(app)
      .delete(`/readers/${reader.shortId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `No Reader found with id ${reader.shortId}abc`
    )
    await tap.equal(error.details.requestUrl, `/readers/${reader.shortId}abc`)
  })

  await tap.test('Try to delete reader that was already deleted', async () => {
    const res = await request(app)
      .delete(`/readers/${reader.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.message, `No Reader found with id ${reader.shortId}`)
    await tap.equal(error.details.requestUrl, `/readers/${reader.shortId}`)
  })

  await destroyDB(app)
}

module.exports = test
