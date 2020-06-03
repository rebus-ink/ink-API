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

  // contains 'abc' - 13
  await createNotebook(app, token, {
    name: 'abc'
  })
  await createNotebook(app, token, {
    name: 'notebookabc'
  })
  await createNotebook(app, token, {
    name: 'ABC'
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    description: 'descriptionabc'
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    description: 'descriptionabc'
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    description: 'descriptionabc'
  })
  await createNotebook(app, token, {
    name: 'notebookABC'
  })
  await createNotebook(app, token, {
    name: 'notebookABC'
  })
  await createNotebook(app, token, {
    name: 'notebookABC'
  })
  await createNotebook(app, token, {
    name: 'notebookABC'
  })
  await createNotebook(app, token, {
    name: 'notebookABC'
  })
  await createNotebook(app, token, {
    name: 'notebookABC'
  })
  await createNotebook(app, token, {
    name: 'notebookABC'
  })

  // contains 'xyz' - 5
  await createNotebook(app, token, {
    name: 'notebookXYZ'
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    description: 'description goes here xyz'
  })
  await createNotebook(app, token, {
    name: 'xyz',
    description: 'description goes here'
  })
  await createNotebook(app, token, {
    name: 'xyz',
    description: 'description goes here'
  })
  await createNotebook(app, token, {
    name: 'xyz',
    description: 'description goes here'
  })

  await tap.test('Get Notebooks - filter by search', async () => {
    const res = await request(app)
      .get('/notebooks?search=xyz')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 5)
    await tap.equal(res.body.totalItems, 5)
  })

  await tap.test(
    'Get Notebooks - filter by search with default pagination',
    async () => {
      const res = await request(app)
        .get('/notebooks?search=abc')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.equal(res.body.items.length, 10)
      await tap.equal(res.body.totalItems, 13)
    }
  )

  await tap.test(
    'Get Notebooks - filter by search with pagination',
    async () => {
      const res = await request(app)
        .get('/notebooks?search=abc&limit=11&page=2')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.equal(res.body.items.length, 2)
      await tap.equal(res.body.totalItems, 13)
    }
  )

  await destroyDB(app)
}

module.exports = test
