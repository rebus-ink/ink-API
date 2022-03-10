const request = require('supertest')
const tap = require('tap')
const { getToken, destroyDB } = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

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
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Jane Doe',
          profile: { property: 'value' }, // deprecated
          preferences: { favoriteColor: 'blueish brown' },
          username: 'user123',
          profilePicture: 'picture/something.jpg',
          role: 'admin',
          json: { something: '!!!!' }
        })
      )
    await tap.equal(res.status, 201)
    await tap.ok(res.body)
    await tap.equal(res.body.shortId, urlToId(res.body.id))
    await tap.equal(res.body.name, 'Jane Doe')
    await tap.ok(res.body.profile)
    await tap.equal(res.body.profile.property, 'value')
    await tap.ok(res.body.preferences)
    await tap.equal(res.body.preferences.favoriteColor, 'blueish brown')
    await tap.ok(res.body.json)
    await tap.equal(res.body.json.something, '!!!!')
    await tap.equal(res.body.username, 'user123')
    await tap.equal(res.body.profilePicture, 'picture/something.jpg')
    await tap.equal(res.body.status, 'active')
    await tap.equal(res.body.role, 'admin')
    await tap.type(res.get('Location'), 'string')
    await tap.equal(res.get('Location'), res.body.id)
    readerUrl = res.get('Location')
  })

  await tap.test('Created Reader should have default modes', async () => {
    const res = await request(app)
      .get('/tags')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.body.length, 13)
    const flags = res.body.filter(item => item.type === 'flag')
    await tap.equal(flags.length, 9)
    const colours = res.body.filter(item => item.type === 'colour')
    await tap.equal(colours.length, 4)
  })

  await tap.test('Create Simple Reader', async () => {
    const res = await request(app)
      .post('/readers')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type('application/ld+json')
      .send(JSON.stringify({}))
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
        .type('application/ld+json')
        .send(
          JSON.stringify({
            profile: 'this should not be a string!'
          })
        )
      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Validation error on create Reader: profile: must be object,null'
      )
      await tap.equal(error.details.requestUrl, '/readers')
      await tap.equal(
        error.details.requestBody.profile,
        'this should not be a string!'
      )
      await tap.type(error.details.validation, 'object')
      await tap.equal(error.details.validation.profile[0].keyword, 'type')
      // await tap.equal(
      //   error.details.validation.profile[0].params.type,
      //   ['object','null']
      // )
    }
  )

  await tap.test('Try to create a Reader with invalid role', async () => {
    const res = await request(app)
      .post('/readers')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token3}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          role: 'something else'
        })
      )
    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Reader Validation Error: something else is not a valid value for role'
    )
    await tap.equal(error.details.requestUrl, '/readers')
    await tap.equal(error.details.requestBody.role, 'something else')
  })

  await tap.test('Try to create Reader that already exists', async () => {
    const res = await request(app)
      .post('/readers')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Jane Doe'
        })
      )
    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.ok(error.message.startsWith('Reader already exists with id'))
    await tap.equal(error.details.requestUrl, '/readers')
    await tap.equal(error.details.requestBody.name, 'Jane Doe')
  })

  // TODO: add test for incomplete reader object (once incoming json is validated)

  await destroyDB(app)
}

module.exports = test
