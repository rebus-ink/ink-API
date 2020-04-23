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
      .put('/readers')
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
    await tap.equal(res.body.json.property, 'value2')
  })

  await destroyDB(app)
}

module.exports = test
