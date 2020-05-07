const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  await tap.test('Get Notebooks for a reader with no notebooks', async () => {
    const res = await request(app)
      .get('/notebooks')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.length, 0)
  })

  await createNotebook(app, token, {
    name: 'outline1',
    description: 'description1',
    settings: {
      property: 'value'
    }
  })
  await createNotebook(app, token, {
    name: 'outline2',
    description: 'description2',
    settings: {
      property: 'value'
    }
  })

  await tap.test('Get Notebooks', async () => {
    const res = await request(app)
      .get('/notebooks')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.length, 2)

    const body = res.body[0]
    await tap.ok(body.id)
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.ok(body.name)
    await tap.ok(body.description)
    await tap.ok(body.settings)
    await tap.equal(body.status, 'active')
    await tap.ok(body.published)
    await tap.ok(body.updated)
    await tap.equal(body.tags.length, 0)
  })

  await destroyDB(app)
}

module.exports = test
