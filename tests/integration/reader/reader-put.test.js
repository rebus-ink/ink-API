const request = require('supertest')
const tap = require('tap')
const { getToken, destroyDB, createReader } = require('../../utils/testUtils')
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

  await tap.test('Update Reader name', async () => {
    const res = await request(app)
      .put(`/readers/${reader.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(Object.assign(reader, { name: 'Joe Smith Jr.' })))
    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.shortId, urlToId(res.body.id))
    await tap.equal(res.body.name, 'Joe Smith Jr.')
    await tap.ok(res.body.profile)
    await tap.equal(res.body.profile.favoriteColor, 'blue')
    await tap.ok(res.body.preferences)
    await tap.equal(res.body.preferences.property, 'value1')
    await tap.ok(res.body.json)
    await tap.equal(res.body.json.property2, 'value2')
  })

  await tap.test('Update Reader preferences', async () => {
    const res = await request(app)
      .put(`/readers/${reader.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify(
          Object.assign(reader, { preferences: { property1: 'new value' } })
        )
      )

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.shortId, urlToId(res.body.id))
    await tap.equal(res.body.name, 'Joe Smith Jr.')
    await tap.ok(res.body.profile)
    await tap.equal(res.body.profile.favoriteColor, 'blue')
    await tap.ok(res.body.preferences)
    await tap.equal(res.body.preferences.property1, 'new value')
    await tap.ok(res.body.json)
    await tap.equal(res.body.json.property2, 'value2')
  })

  await tap.test('Update Reader preferences to null', async () => {
    const res = await request(app)
      .put(`/readers/${reader.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(Object.assign(reader, { preferences: null })))

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.shortId, urlToId(res.body.id))
    await tap.equal(res.body.name, 'Joe Smith Jr.')
    await tap.ok(res.body.profile)
    await tap.equal(res.body.profile.favoriteColor, 'blue')
    await tap.notOk(res.body.preferences)
    await tap.ok(res.body.json)
    await tap.equal(res.body.json.property2, 'value2')
  })

  await tap.test('Update Reader multiple properties', async () => {
    const res = await request(app)
      .put(`/readers/${reader.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify(
          Object.assign(reader, {
            preferences: { property1: 'newest value' },
            name: 'Joe Smith III'
          })
        )
      )

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.shortId, urlToId(res.body.id))
    await tap.equal(res.body.name, 'Joe Smith III')
    await tap.ok(res.body.profile)
    await tap.equal(res.body.profile.favoriteColor, 'blue')
    await tap.ok(res.body.preferences)
    await tap.equal(res.body.preferences.property1, 'newest value')
    await tap.ok(res.body.json)
    await tap.equal(res.body.json.property2, 'value2')
  })

  await tap.test('Update Reader - Validation error', async () => {
    const res = await request(app)
      .put(`/readers/${reader.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(Object.assign(reader, { preferences: 123 })))

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Validation error on update Reader: preferences: should be object,null'
    )
    await tap.equal(error.details.requestUrl, `/readers/${reader.shortId}`)
    await tap.equal(error.details.requestBody.preferences, 123)
    await tap.type(error.details.validation, 'object')
    await tap.equal(error.details.validation.preferences[0].keyword, 'type')
    await tap.equal(
      error.details.validation.preferences[0].params.type,
      'object,null'
    )
  })

  await tap.test('Try to update a reader that does not exist', async () => {
    const res = await request(app)
      .put(`/readers/${reader.shortId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify(
          Object.assign(reader, {
            name: 'new name',
            preferences: { property: 'value' }
          })
        )
      )

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `No Reader found with id ${reader.shortId}abc`
    )
    await tap.equal(error.details.requestUrl, `/readers/${reader.shortId}abc`)
    await tap.equal(error.details.requestBody.name, 'new name')
  })

  await destroyDB(app)
}

module.exports = test
