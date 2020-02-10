const request = require('supertest')
const tap = require('tap')
const { getToken, createUser, destroyDB } = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)

  await tap.test('Create Tag', async () => {
    const res = await request(app)
      .post('/tags')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          type: 'stack',
          name: 'mystack',
          json: { property: 'value' }
        })
      )

    await tap.equal(res.status, 201)
    await tap.type(res.body.id, 'string')
    await tap.equal(res.body.shortId, urlToId(res.body.id))
    await tap.equal(res.body.type, 'stack')
    await tap.equal(res.body.name, 'mystack')
    await tap.equal(res.body.json.property, 'value')
    await tap.equal(res.body.readerId, readerCompleteUrl)
  })

  await tap.test('Create Tag with new type', async () => {
    const res = await request(app)
      .post('/tags')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          type: 'newTagType!',
          name: 'mystack',
          json: { property: 'value' }
        })
      )
    await tap.equal(res.status, 201)
    await tap.equal(res.body.type, 'newTagType!')
    await tap.equal(res.body.name, 'mystack')
    await tap.equal(res.body.json.property, 'value')
    await tap.equal(res.body.readerId, readerCompleteUrl)
  })

  await tap.test('Try to create Tag without a name', async () => {
    const res = await request(app)
      .post('/tags')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          type: 'stack',
          json: { property: 'value' }
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      'Validation Error on Create Tag: name: is a required property'
    )
    await tap.equal(error.details.requestUrl, '/tags')
    await tap.equal(error.details.requestBody.json.property, 'value')
    await tap.equal(error.details.validation.name[0].keyword, 'required')
    await tap.equal(
      error.details.validation.name[0].params.missingProperty,
      'name'
    )
  })

  await tap.test('Try to create a duplicate Tag', async () => {
    const res = await request(app)
      .post('/tags')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          type: 'stack',
          name: 'mystack'
        })
      )
    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      'Create Tag Error: Tag mystack already exists'
    )
    await tap.equal(error.details.requestUrl, '/tags')
    await tap.equal(error.details.requestBody.name, 'mystack')
  })

  await tap.test('Get tag that was created', async () => {
    // in library
    const res = await request(app)
      .get(`/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(Array.isArray(body.tags))
    await tap.type(body.tags[0].name, 'string')
    await tap.ok(
      urlToId(body.tags[0].id).startsWith(urlToId(body.tags[0].readerId))
    ) // check that id contains readerId
    await tap.equal(body.tags[0].type, 'newTagType!')
    await tap.type(body.tags[0].json, 'object')

    // in GET tags endpoint
    const res2 = await request(app)
      .get('/tags')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    const body2 = res2.body
    await tap.ok(Array.isArray(body2))
    await tap.type(body2[0].name, 'string')
    await tap.ok(urlToId(body2[0].id).startsWith(urlToId(body2[0].readerId))) // check that id contains readerId
    await tap.equal(body2[0].type, 'newTagType!')
    await tap.type(body2[0].json, 'object')
  })

  await destroyDB(app)
}

module.exports = test
