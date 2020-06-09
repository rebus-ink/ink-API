const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  await createNotebook(app, token, {
    name: 'xyz'
  })
  await createNotebook(app, token, {
    name: 'abc'
  })
  await createNotebook(app, token, {
    name: 'AAAAAA'
  })

  await tap.test('Get Notebooks - orderBy name', async () => {
    const res = await request(app)
      .get('/notebooks?orderBy=name')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 3)
    await tap.equal(res.body.items[0].name, 'AAAAAA')
    await tap.equal(res.body.items[1].name, 'abc')
    await tap.equal(res.body.items[2].name, 'xyz')
  })

  await tap.test('Get Notebooks - orderBy name, reversed', async () => {
    const res = await request(app)
      .get('/notebooks?orderBy=name&reverse=true')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 3)
    await tap.equal(res.body.items[0].name, 'xyz')
    await tap.equal(res.body.items[1].name, 'abc')
    await tap.equal(res.body.items[2].name, 'AAAAAA')
  })

  await destroyDB(app)
}

module.exports = test
