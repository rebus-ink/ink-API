const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNote,
  createTag,
  addSourceToCollection,
  createNotebook,
  addSourceToNotebook,
  createReadActivity
} = require('../../utils/testUtils')
const app = require('../../../server').app

const test = async () => {
  const token = getToken()
  await createUser(app, token)

  const notebook1 = await createNotebook(app, token, {
    name: 'target notebook'
  })
  const notebook2 = await createNotebook(app, token, {
    name: 'something',
    description: 'this contains the TarGeT...'
  })

  await tap.test('Search notebooks only by name', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotebooks: true,
          notebooks: {
            name: true,
            description: false
          }
        })
      )

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.notebooks)
    await tap.type(body.notebooks.totalItems, 'number')
    await tap.equal(body.notebooks.totalItems, 1)
    await tap.ok(Array.isArray(body.notebooks.items))
    await tap.equal(body.notebooks.items.length, 1)
    await tap.equal(body.notebooks.items[0].shortId, notebook1.shortId)
  })

  await tap.test('Search notebooks only by description', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotebooks: true,
          notebooks: {
            name: false,
            description: true
          }
        })
      )

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.notebooks)
    await tap.type(body.notebooks.totalItems, 'number')
    await tap.equal(body.notebooks.totalItems, 1)
    await tap.ok(Array.isArray(body.notebooks.items))
    await tap.equal(body.notebooks.items.length, 1)
    await tap.equal(body.notebooks.items[0].shortId, notebook2.shortId)
  })

  // pagination

  await createNotebook(app, token, { name: 'target' })
  await createNotebook(app, token, { name: 'target1' })
  await createNotebook(app, token, { name: 'target2' })
  await createNotebook(app, token, { name: 'target3' })
  await createNotebook(app, token, { name: 'target4' })
  await createNotebook(app, token, { name: 'target5' })
  await createNotebook(app, token, { name: 'target6' })
  await createNotebook(app, token, { name: 'target7' })
  await createNotebook(app, token, { name: 'target8' })
  await createNotebook(app, token, { name: 'target9' })
  await createNotebook(app, token, { name: 'target10' })

  await tap.test('Search notebooks with pagination', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotebooks: true,
          notebooks: {
            limit: 10
          }
        })
      )

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.notebooks)
    await tap.type(body.notebooks.totalItems, 'number')
    await tap.equal(body.notebooks.totalItems, 13)
    await tap.ok(Array.isArray(body.notebooks.items))
    await tap.equal(body.notebooks.items.length, 10)
  })

  await destroyDB(app)
}

module.exports = test
