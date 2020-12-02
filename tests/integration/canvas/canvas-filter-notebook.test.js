const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNote,
  createCanvas,
  createNotebook,
  addNoteToNotebook
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const notebook1 = await createNotebook(app, token, { name: 'notebook1' })
  const notebook2 = await createNotebook(app, token, { name: 'notebook2' })

  // notebook1
  await createCanvas(app, token, {
    name: 'canvas1',
    notebookId: notebook1.shortId
  })
  await createCanvas(app, token, {
    name: 'canvas2',
    notebookId: notebook1.shortId
  })
  await createCanvas(app, token, {
    name: 'canvas3',
    notebookId: notebook1.shortId
  })

  // notebook2
  await createCanvas(app, token, {
    name: 'canvas4',
    notebookId: notebook2.shortId
  })
  await createCanvas(app, token, {
    name: 'canvas5',
    notebookId: notebook2.shortId
  })

  await tap.test('Get Canvas by notebook', async () => {
    const res = await request(app)
      .get(`/canvas?notebook=${notebook1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 3)
    await tap.equal(res.body.items.length, 3)
    await tap.ok(res.body.items[0].notebook)
  })

  await destroyDB(app)
}

module.exports = test
