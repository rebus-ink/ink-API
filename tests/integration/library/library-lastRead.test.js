const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createReadActivity
} = require('../../utils/testUtils')
const app = require('../../../server').app

const test = async () => {
  const token = getToken()
  await createUser(app, token)

  // source1
  await createSource(app, token)
  const source2 = await createSource(app, token)
  const source3 = await createSource(app, token)

  await createReadActivity(app, token, source2.shortId)
  await createReadActivity(app, token, source3.shortId)

  await tap.test('Get library with lastRead', async () => {
    const res = await request(app)
      .get('/library?lastRead=2')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 3)
    await tap.equal(body.items.length, 3)
    await tap.equal(body.lastRead.length, 2)
    const latest = body.lastRead[0]
    await tap.equal(latest.shortId, source3.shortId)
    await tap.ok(latest.tags)
    await tap.ok(latest.notebooks)
  })

  await tap.test(
    'Get library with lastRead number smaller than read',
    async () => {
      const res = await request(app)
        .get('/library?lastRead=1')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
      await tap.equal(res.status, 200)

      const body = res.body
      await tap.type(body, 'object')
      await tap.equal(body.totalItems, 3)
      await tap.equal(body.items.length, 3)
      await tap.equal(body.lastRead.length, 1)
      await tap.equal(body.lastRead[0].shortId, source3.shortId)
    }
  )

  await tap.test(
    'Get library with lastRead number larger than read',
    async () => {
      const res = await request(app)
        .get('/library?lastRead=10')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
      await tap.equal(res.status, 200)

      const body = res.body
      await tap.type(body, 'object')
      await tap.equal(body.totalItems, 3)
      await tap.equal(body.items.length, 3)
      await tap.equal(body.lastRead.length, 2)
      await tap.equal(body.lastRead[0].shortId, source3.shortId)
    }
  )

  await destroyDB(app)
}

module.exports = test
