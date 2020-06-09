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

  // serach 'abc' + colour 'blue' - 11

  // contains 'abc' - 18
  await createNotebook(app, token, {
    name: 'abc',
    settings: { colour: 'blue' }
  })
  await createNotebook(app, token, {
    name: 'notebookabc',
    settings: { colour: 'blue' }
  })
  await createNotebook(app, token, {
    name: 'ABC',
    settings: { colour: 'blue' }
  })
  await createNotebook(app, token, {
    name: 'notebook1abc',
    description: 'descriptionabc',
    settings: { colour: 'blue' }
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    description: 'descriptionabc',
    settings: { colour: 'blue' }
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    description: 'descriptionabc',
    settings: { colour: 'blue' }
  })
  await createNotebook(app, token, {
    name: 'notebookABC',
    settings: { colour: 'blue' }
  })
  await createNotebook(app, token, {
    name: 'notebookABC',
    settings: { colour: 'blue' }
  })
  await createNotebook(app, token, {
    name: 'notebookABC',
    settings: { colour: 'blue' }
  })
  await createNotebook(app, token, {
    name: 'notebookABC',
    settings: { colour: 'blue' }
  })
  await createNotebook(app, token, {
    name: 'notebookABC',
    settings: { colour: 'blue' }
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
    name: 'notebookXYZ',
    settings: { colour: 'blue' }
  })
  await createNotebook(app, token, {
    name: 'notebook1',
    description: 'description goes here xyz',
    settings: { colour: 'blue' }
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

  await createNotebook(app, token, {
    name: 'xyz',
    description: 'description goes here',
    status: 'archived',
    settings: {
      colour: 'blue'
    }
  })

  // contains 'abc' but is archived - 3

  await createNotebook(app, token, {
    name: 'notebookABC',
    status: 'archived',
    settings: {
      colour: 'blue'
    }
  })
  await createNotebook(app, token, {
    name: 'notebookABCD',
    status: 'archived'
  })
  await createNotebook(app, token, {
    name: 'notebookABCDEF',
    status: 'archived'
  })

  await tap.test('Get Notebooks - filter by search & status', async () => {
    const res = await request(app)
      .get('/notebooks?search=abc&status=archived')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 3)
    await tap.equal(res.body.totalItems, 3)
  })

  await tap.test(
    'Get Notebooks - filter by search & status with pagination',
    async () => {
      const res = await request(app)
        .get('/notebooks?search=abc&status=active&limit=11&page=2')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.equal(res.body.items.length, 7)
      await tap.equal(res.body.totalItems, 18)
    }
  )

  // SEARCH + COLOUR
  await tap.test('Get Notebooks - filter by search & colour', async () => {
    const res = await request(app)
      .get('/notebooks?search=xyz&colour=blue')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 3)
    await tap.equal(res.body.totalItems, 3)
  })

  await tap.test(
    'Get Notebooks - filter by search & colour with pagination',
    async () => {
      const res = await request(app)
        .get('/notebooks?search=abc&colour=blue')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.equal(res.body.items.length, 10)
      await tap.equal(res.body.totalItems, 12)
    }
  )

  // STATUS + COLOUR
  await tap.test('Get Notebooks - filter by status & colour', async () => {
    const res = await request(app)
      .get('/notebooks?status=archived&colour=blue')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 2)
    await tap.equal(res.body.totalItems, 2)
  })

  await tap.test(
    'Get Notebooks - filter by status & colour with pagination',
    async () => {
      const res = await request(app)
        .get('/notebooks?status=active&colour=blue')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.equal(res.body.items.length, 10)
      await tap.equal(res.body.totalItems, 13)
    }
  )

  // STATUS + SEARCH + COLOUR

  await tap.test('Get Notebooks - filter by status & colour', async () => {
    const res = await request(app)
      .get('/notebooks?status=active&search=xyz&colour=blue')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 2)
    await tap.equal(res.body.totalItems, 2)
  })

  await destroyDB(app)
}

module.exports = test
