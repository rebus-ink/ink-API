const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNotebook,
  createNote,
  createTag
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')
const { Reader } = require('../../../models/Reader')
const { Note_Tag } = require('../../../models/Note_Tag')
const { Note } = require('../../../models/Note')
const _ = require('lodash')

const test = async app => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerId = urlToId(readerCompleteUrl)

  // Create Reader object
  const person = {
    name: 'J. Random Reader'
  }
  await Reader.createReader(readerId, person)

  const source = await createSource(app, token)

  const notebook = await createNotebook(app, token)

  // create Note for reader 1
  const note = await createNote(app, token, {
    sourceId: source.id,
    body: { motivation: 'test' }
  })
  const noteUrl = note.id

  // create Tag
  let stack = await createTag(app, token, {
    type: 'stack',
    name: 'mystack',
    json: { property: 'value' },
    notebookId: notebook.shortId
  })

  await tap.test('Update a Tag name', async () => {
    // Get the library before the modifications
    const libraryBefore = await request(app)
      .get(`/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    // Add a tag to the note
    const tagIndexBefore = _.findIndex(libraryBefore.body.tags, {
      name: 'mystack'
    })
    await Note_Tag.addTagToNote(
      urlToId(noteUrl),
      libraryBefore.body.tags[tagIndexBefore].id
    )

    // Fetch the note with the tag
    const noteWithTag = await Note.byId(urlToId(noteUrl))
    await tap.equal(noteWithTag.tags.length, 1)
    await tap.equal(
      noteWithTag.tags[0].name,
      libraryBefore.body.tags[tagIndexBefore].name
    )
    await tap.equal(libraryBefore.body.tags.length, 14) // 9 flags + 4 colours + created tag
    const tagIndex = _.findIndex(libraryBefore.body.tags, { name: stack.name })
    await tap.ok(tagIndex !== -1)

    // Update the tag
    const res = await request(app)
      .put(`/tags/${stack.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify(
          Object.assign(stack, {
            name: 'newName'
          })
        )
      )

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.equal(body.name, 'newName')
    await tap.equal(body.shortId, urlToId(body.id))
    stack = body

    // Get the library after the modifications
    const libraryAfter = await request(app)
      .get(`/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    // Get the note after the modifications
    const noteWithNewTag = await Note.byId(urlToId(noteUrl))
    await tap.equal(libraryAfter.body.tags.length, 14) // 9 flags + 4 colours + created
    const tagIndex2 = _.findIndex(libraryAfter.body.tags, { name: 'newName' })
    await tap.ok(tagIndex2 !== -1)
    await tap.equal(noteWithNewTag.tags.length, 1)
    await tap.equal(noteWithNewTag.tags[0].name, 'newName')
    await tap.equal(noteWithNewTag.tags[0].notebookId, notebook.shortId)
  })

  await tap.test('Update a Tag json', async () => {
    // Update the tag
    const res = await request(app)
      .put(`/tags/${stack.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify(
          Object.assign(stack, {
            json: { property: 'value!!' }
          })
        )
      )

    await tap.equal(res.statusCode, 200)
    await tap.equal(res.body.json.property, 'value!!')
    await tap.equal(res.body.name, 'newName')
    stack = res.body

    // Get the library after the modifications
    const libraryAfter = await request(app)
      .get(`/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    // Get the note after the modifications
    const noteWithNewTag = await Note.byId(urlToId(noteUrl))
    await tap.equal(libraryAfter.body.tags.length, 14) // 9 flags + 4 colours + 1 created
    const tagIndex = _.findIndex(libraryAfter.body.tags, { name: 'newName' })
    await tap.ok(tagIndex !== -1)
    await tap.equal(libraryAfter.body.tags[tagIndex].json.property, 'value!!')
    await tap.equal(noteWithNewTag.tags.length, 1)
    await tap.equal(noteWithNewTag.tags[0].json.property, 'value!!')
  })

  await tap.test('Update a Tag notebookId to null', async () => {
    // Update the tag
    const res = await request(app)
      .put(`/tags/${stack.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify(
          Object.assign(stack, {
            notebookId: undefined
          })
        )
      )

    await tap.equal(res.statusCode, 200)
    await tap.equal(res.body.json.property, 'value!!')
    await tap.notOk(res.body.notebookId)
    stack = res.body

    // Get the library after the modifications
    const libraryAfter = await request(app)
      .get(`/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    // Get the note after the modifications
    const noteWithNewTag = await Note.byId(urlToId(noteUrl))
    await tap.equal(libraryAfter.body.tags.length, 14) // 9 flags + 4 colours + 1 created
    const tagIndex = _.findIndex(libraryAfter.body.tags, { name: 'newName' })
    await tap.ok(tagIndex !== -1)
    await tap.equal(libraryAfter.body.tags[tagIndex].json.property, 'value!!')
    await tap.equal(noteWithNewTag.tags.length, 1)
    await tap.notOk(noteWithNewTag.tags[0].notebookId)
  })

  await tap.test('Try to update a Tag with invalid values', async () => {
    const res = await request(app)
      .put(`/tags/${stack.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify(
          Object.assign(stack, {
            name: { shouldNotBe: 'an object' }
          })
        )
      )

    await tap.equal(res.statusCode, 400)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      'Validation Error on Update Tag: name: should be string'
    )
    await tap.equal(error.details.requestUrl, `/tags/${stack.id}`)
    await tap.equal(error.details.requestBody.name.shouldNotBe, 'an object')
    await tap.type(error.details.validation, 'object')
    await tap.equal(error.details.validation.name[0].keyword, 'type')
    await tap.equal(error.details.validation.name[0].params.type, 'string')
  })

  await tap.test('Try to update a Tag with an empty body', async () => {
    const res = await request(app)
      .put(`/tags/${stack.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.message, 'Body must be a JSON object')
    await tap.equal(error.details.requestUrl, `/tags/${stack.id}`)
  })

  await tap.test('Try to update a Tag that was already deleted', async () => {
    await request(app)
      .delete(`/tags/${stack.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const res = await request(app)
      .put(`/tags/${stack.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'anotherNewName'
        })
      )

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Put Tag Error: No Tag found with id ${stack.id}`
    )
    await tap.equal(error.details.requestUrl, `/tags/${stack.id}`)
    await tap.equal(error.details.requestBody.name, 'anotherNewName')
  })

  await tap.test(
    'Try to update a Tag with a tagId that does not exist',
    async () => {
      const res = await request(app)
        .put(`/tags/${stack.id}123`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'newName'
          })
        )

      await tap.equal(res.statusCode, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Put Tag Error: No Tag found with id ${stack.id}123`
      )
      await tap.equal(error.details.requestUrl, `/tags/${stack.id}123`)
      await tap.equal(error.details.requestBody.name, 'newName')
    }
  )

  await destroyDB(app)
}

module.exports = test
