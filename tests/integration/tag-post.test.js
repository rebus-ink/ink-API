const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../utils/utils')
const { urlToId } = require('../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path
  const readerId = urlToId(readerCompleteUrl)

  await tap.test('Create Tag', async () => {
    const res = await request(app)
      .post('/tags')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          tagType: 'reader:Stack',
          name: 'mystack',
          json: { property: 'value' }
        })
      )

    await tap.equal(res.status, 201)
    await tap.equal(res.body.tagType, 'reader:Stack')
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
          tagType: 'newTagType!',
          name: 'mystack',
          json: { property: 'value' }
        })
      )
    await tap.equal(res.status, 201)
    await tap.equal(res.body.tagType, 'newTagType!')
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
          tagType: 'reader:Stack',
          json: { property: 'value' }
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(error.details.activity, 'Create Tag')
    await tap.type(error.details.validation, 'object')
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
          tagType: 'reader:Stack',
          name: 'mystack'
        })
      )
    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.details.type, 'Tag')
    await tap.equal(error.details.activity, 'Create Tag')
  })

  // TODO: also test with GET /tags endpoint when available
  await tap.test('Get tag when fetching library', async () => {
    const res = await request(app)
      .get(`/readers/${readerId}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(Array.isArray(body.tags))
    await tap.type(body.tags[0].name, 'string')
    await tap.ok(
      urlToId(body.tags[0].id).startsWith(urlToId(body.tags[0].readerId))
    ) // check that id contains readerId
    await tap.equal(body.tags[0].tagType, 'newTagType!')
    await tap.type(body.tags[0].json, 'object')
    stack = body.tags[0]
  })

  await destroyDB(app)
}

module.exports = test
