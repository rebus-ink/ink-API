const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNoteContext
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerUrl = await createUser(app, token)
  const readerId = urlToId(readerUrl)

  const outline = await createNoteContext(app, token, { type: 'outline' })

  await tap.test('Update name and description of Outline', async () => {
    const res = await request(app)
      .put(`/outlines/${outline.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          type: 'outline',
          name: 'something',
          description: 'description!'
        })
      )

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.type, 'outline')
    await tap.equal(body.name, 'something')
    await tap.equal(body.description, 'description!')
    await tap.ok(body.published)
    await tap.notEqual(body.updated, body.published)
  })

  await tap.test('Update name and description to null', async () => {
    const res = await request(app)
      .put(`/outlines/${outline.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify({ type: 'outline', name: null, description: null }))

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.notOk(body.name)
    await tap.notOk(body.description)
    await tap.ok(body.published)
    await tap.notEqual(body.updated, body.published)
  })

  await tap.test(
    'Try to update an outline type to something other than outline',
    async () => {
      const res = await request(app)
        .put(`/outlines/${outline.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify({ type: 'test' }))

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.message, `Outline type must be 'outline'`)
      await tap.equal(error.details.requestUrl, `/outlines/${outline.shortId}`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.type, 'test')
    }
  )

  await tap.test('Try to update an outline that does not exist', async () => {
    const res = await request(app)
      .put(`/outlines/${outline.shortId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify({ type: 'outline', name: 'new name' }))

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `No Outline found with id ${outline.shortId}abc`
    )
    await tap.equal(error.details.requestUrl, `/outlines/${outline.shortId}abc`)
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.name, 'new name')
  })

  await destroyDB(app)
}

module.exports = test
