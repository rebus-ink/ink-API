const request = require('supertest')
const tap = require('tap')
const { getToken, createUser, destroyDB } = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerUrl = await createUser(app, token)
  const readerId = urlToId(readerUrl)

  await tap.test('Create Notebook', async () => {
    const res = await request(app)
      .post('/notebooks')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'notebook1',
          description: 'this is the description of notebook1',
          status: 'test',
          settings: { property: 'value' }
        })
      )

    await tap.equal(res.status, 201)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.name, 'notebook1')
    await tap.equal(body.description, 'this is the description of notebook1')
    await tap.equal(body.status, 'test')
    await tap.equal(body.settings.property, 'value')
    await tap.ok(body.published)
  })

  await tap.test('Create Notebook with only a name', async () => {
    const res = await request(app)
      .post('/notebooks')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'notebook2'
        })
      )

    await tap.equal(res.status, 201)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.name, 'notebook2')
    await tap.equal(body.status, 'active') // defaults to 'active'
    await tap.ok(body.published)
  })

  await tap.test('Try to create Notebook without a name', async () => {
    const res = await request(app)
      .post('/notebooks')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          description: 'something'
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Validation Error on Create Notebook: name: is a required property'
    )
    await tap.equal(error.details.requestUrl, `/notebooks`)
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.description, 'something')
  })

  await tap.test('Try to create Notebook with a validation error', async () => {
    const res = await request(app)
      .post('/notebooks')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 123
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Validation Error on Create Notebook: name: should be string'
    )
    await tap.equal(error.details.requestUrl, `/notebooks`)
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.name, 123)
  })

  await destroyDB(app)
}

module.exports = test
