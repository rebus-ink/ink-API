const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook,
  createCanvas
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const notebook = await createNotebook(app, token, { name: 'notebook1' })

  await tap.test('Get Canvas for a reader with no canvas', async () => {
    const res = await request(app)
      .get('/canvas')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 0)
    await tap.equal(res.body.totalItems, 0)
  })

  await createCanvas(app, token, {
    name: 'outline1',
    description: 'description1',
    notebookId: notebook.shortId
  })
  await createCanvas(app, token, {
    name: 'outline2',
    description: 'description2',
    notebookId: notebook.shortId
  })

  await tap.test('Get Canvas', async () => {
    const res = await request(app)
      .get('/canvas')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 2)
    await tap.equal(res.body.totalItems, 2)

    const body = res.body.items[0]
    await tap.ok(body.id)
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.ok(body.name)
    await tap.ok(body.description)
    await tap.ok(body.published)
    await tap.ok(body.updated)
    await tap.equal(body.notebookId, notebook.shortId)
  })

  await destroyDB(app)
}

module.exports = test
