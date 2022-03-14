const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNote,
  createNoteRelation
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerUrl = await createUser(app, token)
  const readerId = urlToId(readerUrl)

  const note1 = await createNote(app, token, {
    body: { motivation: 'test', content: 'note 1' }
  })
  const noteId1 = urlToId(note1.id)
  const note2 = await createNote(app, token, {
    body: { motivation: 'test', content: 'note 2' }
  })
  const noteId2 = urlToId(note2.id)
  const note3 = await createNote(app, token, {
    body: { motivation: 'test', content: 'note 3' }
  })
  const noteId3 = urlToId(note3.id)

  let noteRelation = await createNoteRelation(app, token, {
    from: noteId1,
    to: noteId2,
    type: 'test',
    json: { property: 'value' }
  })

  await tap.test('Update type of NoteRelation', async () => {
    const res = await request(app)
      .put(`/noteRelations/${noteRelation.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(Object.assign(noteRelation, { type: 'test2' })))

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.from, noteId1)
    await tap.equal(body.type, 'test2')
    await tap.ok(body.published)
    await tap.not(body.updated, body.published)
    await tap.equal(body.json.property, 'value')
    noteRelation = body
  })

  await tap.test('Update from in noteRelation', async () => {
    const res = await request(app)
      .put(`/noteRelations/${noteRelation.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(Object.assign(noteRelation, { from: noteId3 })))

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.from, noteId3)
    await tap.equal(body.to, noteId2)
    await tap.equal(body.type, 'test2')
    await tap.ok(body.published)
    await tap.not(body.updated, body.published)
    await tap.equal(body.json.property, 'value')
    noteRelation = body
  })

  await tap.test('Update json object to null', async () => {
    const res = await request(app)
      .put(`/noteRelations/${noteRelation.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(Object.assign(noteRelation, { json: null })))

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.from, noteId3)
    await tap.equal(body.type, 'test2')
    await tap.ok(body.published)
    await tap.not(body.updated, body.published)
    await tap.notOk(body.json)
    noteRelation = body
  })

  await tap.test('Try to remove the from property', async () => {
    const res = await request(app)
      .put(`/noteRelations/${noteRelation.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(Object.assign(noteRelation, { from: null })))

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Validation Error on Update NoteRelation: from: must be string'
    )
    await tap.equal(
      error.details.requestUrl,
      `/noteRelations/${noteRelation.id}`
    )
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.type, 'test2')
  })

  await tap.test('Try to remove the to property', async () => {
    const res = await request(app)
      .put(`/noteRelations/${noteRelation.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify(Object.assign(noteRelation, { to: null, from: noteId1 }))
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Validation Error on Update NoteRelation: to: must be string'
    )
    await tap.equal(
      error.details.requestUrl,
      `/noteRelations/${noteRelation.id}`
    )
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.type, 'test2')
  })

  await tap.test('Try to remove the type property', async () => {
    const res = await request(app)
      .put(`/noteRelations/${noteRelation.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify(
          Object.assign(noteRelation, {
            from: noteId1,
            to: noteId2,
            type: null
          })
        )
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Validation Error on Update NoteRelation: type: must be string'
    )
    await tap.equal(
      error.details.requestUrl,
      `/noteRelations/${noteRelation.id}`
    )
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.type, null)
  })

  await tap.test(
    'Try to update the from property to an invalid noteId',
    async () => {
      const res = await request(app)
        .put(`/noteRelations/${noteRelation.id}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify(
            Object.assign(noteRelation, {
              type: 'test',
              from: noteId1 + 'abc',
              to: noteId2
            })
          )
        )

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `No Note found with id passed into 'from': ${noteId1}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteRelations/${noteRelation.id}`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.type, 'test')
    }
  )

  await tap.test(
    'Try to update a noteRelation that does not exist',
    async () => {
      const res = await request(app)
        .put(`/noteRelations/${noteRelation.id}abc`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify(
            Object.assign(noteRelation, { from: noteId1, to: noteId2 })
          )
        )

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `No NoteRelation found with id ${noteRelation.id}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteRelations/${noteRelation.id}abc`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.type, 'test')
    }
  )

  await destroyDB(app)
}

module.exports = test
