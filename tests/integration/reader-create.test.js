const request = require('supertest')
const tap = require('tap')
const { getToken, destroyDB } = require('../utils/utils')

const test = async app => {
  const token = getToken()
  // to avoid duplicate tokens:
  await new Promise(_func => setTimeout(_func, 50))
  const token2 = getToken()
  await new Promise(_func => setTimeout(_func, 50))
  const token3 = getToken()

  await tap.test('Create Reader', async () => {
    const res = await request(app)
      .post('/readers')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(
        JSON.stringify({
          '@context': 'https://www.w3.org/ns/activitystreams',
          name: 'Jane Doe',
          profile: { property: 'value' },
          preferences: { favoriteColor: 'blueish brown' },
          json: { something: '!!!!' }
        })
      )
    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')
    readerUrl = res.get('Location')
  })

  await tap.test('Create Simple Reader', async () => {
    const res = await request(app)
      .post('/readers')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(
        JSON.stringify({
          '@context': 'https://www.w3.org/ns/activitystreams'
        })
      )
    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')
  })

  await tap.test(
    'Try to create a Reader with invalid property types',
    async () => {
      const res = await request(app)
        .post('/readers')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token3}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
        .send(
          JSON.stringify({
            '@context': 'https://www.w3.org/ns/activitystreams',
            profile: 'this should not be a string!'
          })
        )
      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(error.details.type, 'Reader')
      await tap.equal(error.details.activity, 'Create Reader')
      await tap.type(error.details.validation, 'object')
      await tap.equal(error.details.validation.profile[0].keyword, 'type')
      await tap.equal(error.details.validation.profile[0].params.type, 'object')
    }
  )

  await tap.test('Try to create Reader that already exists', async () => {
    const res = await request(app)
      .post('/readers')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(
        JSON.stringify({
          '@context': 'https://www.w3.org/ns/activitystreams',
          name: 'Jane Doe'
        })
      )
    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(error.details.type, 'Reader')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Create Reader')
  })

  // TODO: add test for incomplete reader object (once incoming json is validated)

  await destroyDB(app)
}

module.exports = test
