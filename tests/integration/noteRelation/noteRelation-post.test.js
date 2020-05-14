const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNote
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

  let noteRelation1, noteRelation2

  await tap.test('Create NoteRelation', async () => {
    const res = await request(app)
      .post('/noteRelations')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          from: noteId1,
          to: noteId2,
          type: 'test',
          json: { property: 'value' }
        })
      )

    await tap.equal(res.status, 201)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.from, noteId1)
    await tap.equal(body.to, noteId2)
    await tap.equal(body.type, 'test')
    await tap.equal(body.json.property, 'value')
    await tap.ok(body.published)
  })

  await tap.test(
    'Try to create a noteRelation without a from property',
    async () => {
      const res = await request(app)
        .post('/noteRelations')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            type: 'test',
            to: noteId1
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Validation Error on Create NoteRelation: from: is a required property'
      )
      await tap.equal(error.details.requestUrl, `/noteRelations`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.type, 'test')
    }
  )

  await tap.test(
    'Try to create a noteRelation without a to property',
    async () => {
      const res = await request(app)
        .post('/noteRelations')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            type: 'test',
            from: noteId2
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Validation Error on Create NoteRelation: to: is a required property'
      )
      await tap.equal(error.details.requestUrl, `/noteRelations`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.type, 'test')
    }
  )

  await tap.test(
    'Try to create a noteRelation without a type property',
    async () => {
      const res = await request(app)
        .post('/noteRelations')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            from: noteId1,
            to: noteId2
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Validation Error on Create NoteRelation: type: is a required property'
      )
      await tap.equal(error.details.requestUrl, `/noteRelations`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.from, noteId1)
    }
  )

  await tap.test(
    'Try to create a noteRelation with an invalid from noteId',
    async () => {
      const res = await request(app)
        .post('/noteRelations')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            from: noteId1 + 'abc',
            to: noteId2,
            type: 'test'
          })
        )

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `No Note found with id passed into 'from': ${noteId1}abc`
      )
      await tap.equal(error.details.requestUrl, `/noteRelations`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.type, 'test')
    }
  )

  await tap.test(
    'Try to create a noteRelation with an invalid to noteId',
    async () => {
      const res = await request(app)
        .post('/noteRelations')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            from: noteId1,
            to: noteId2 + 'abc',
            type: 'test'
          })
        )

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `No Note found with id passed into 'to': ${noteId2}abc`
      )
      await tap.equal(error.details.requestUrl, `/noteRelations`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.type, 'test')
    }
  )

  await destroyDB(app)
}

module.exports = test
