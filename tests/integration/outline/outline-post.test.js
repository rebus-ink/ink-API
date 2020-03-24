const request = require('supertest')
const tap = require('tap')
const { getToken, createUser, destroyDB } = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerUrl = await createUser(app, token)
  const readerId = urlToId(readerUrl)

  await tap.test('Create Outline', async () => {
    const res = await request(app)
      .post('/outlines')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'context1',
          description: 'this is the description of context1',
          json: { property: 'value' }
        })
      )

    await tap.equal(res.status, 201)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.name, 'context1')
    await tap.equal(body.description, 'this is the description of context1')
    await tap.equal(body.type, 'outline')
    await tap.equal(body.json.property, 'value')
    await tap.ok(body.published)
  })

  await tap.test('Create an empty outline', async () => {
    const res = await request(app)
      .post('/outlines')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify({}))

    await tap.equal(res.status, 201)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.type, 'outline')
    await tap.ok(body.published)
  })

  await tap.test('Try to create Outline with invalid name', async () => {
    const res = await request(app)
      .post('/outlines')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 123,
          description: 'this is the description of context1',
          json: { property: 'value' }
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Validation Error on Create Outline: name: should be string,null'
    )
    await tap.equal(error.details.requestUrl, `/outlines`)
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.name, 123)
  })

  await destroyDB(app)
}

module.exports = test
