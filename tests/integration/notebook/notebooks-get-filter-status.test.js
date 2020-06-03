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

  // active (by default) - 5
  await createNotebook(app, token, {
    name: 'notebook1'
  })
  await createNotebook(app, token, {
    name: 'notebook1'
  })
  await createNotebook(app, token, {
    name: 'notebook1'
  })
  await createNotebook(app, token, {
    name: 'notebook1'
  })
  await createNotebook(app, token, {
    name: 'notebook1'
  })

  // archived - 12
  await createNotebook(app, token, {
    name: 'notebook1',
    status: 'archived'
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    status: 'archived'
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    status: 'archived'
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    status: 'archived'
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    status: 'archived'
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    status: 'archived'
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    status: 'archived'
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    status: 'archived'
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    status: 'archived'
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    status: 'archived'
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    status: 'archived'
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    status: 'archived'
  })

  await tap.test('Get Notebooks - filter by status', async () => {
    const res = await request(app)
      .get('/notebooks?status=active')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 5)
    await tap.equal(res.body.totalItems, 5)
  })

  await tap.test(
    'Get Notebooks - filter by status, paginate by default',
    async () => {
      const res = await request(app)
        .get('/notebooks?status=archived')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.equal(res.body.items.length, 10)
      await tap.equal(res.body.totalItems, 12)
    }
  )

  await tap.test('Get Notebooks - filter by status, paginated', async () => {
    const res = await request(app)
      .get('/notebooks?status=archived&limit=11&page=2')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 1)
    await tap.equal(res.body.totalItems, 12)
  })

  await destroyDB(app)
}

module.exports = test
