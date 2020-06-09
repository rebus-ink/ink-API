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
    name: 'notebook1'
  })
  const notebook3 = await createNotebook(app, token, {
    name: 'notebook3'
  })
  await createNotebook(app, token, {
    name: 'notebook2'
  })

  // updating should not change the order
  await request(app)
    .put(`/notebooks/${notebook3.shortId}`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
    .send(JSON.stringify({ name: 'notebookNew' }))

  await tap.test('Get Notebooks - orderBy created', async () => {
    const res = await request(app)
      .get('/notebooks?orderBy=created')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 3)
    await tap.equal(res.body.items[0].name, 'notebook2')
    await tap.equal(res.body.items[1].name, 'notebookNew')
    await tap.equal(res.body.items[2].name, 'notebook1')
  })

  await tap.test('Get Notebooks - orderBy name, reversed', async () => {
    const res = await request(app)
      .get('/notebooks?orderBy=created&reverse=true')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 3)
    await tap.equal(res.body.items[0].name, 'notebook1')
    await tap.equal(res.body.items[1].name, 'notebookNew')
    await tap.equal(res.body.items[2].name, 'notebook2')
  })

  await destroyDB(app)
}

module.exports = test
