const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createReader,
  destroyDB,
  createNotebook,
  createCollaborator
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  await createReader(app, token)

  const notebook = await createNotebook(app, token)
  const notebookId = notebook.shortId

  const token2 = getToken()
  const collaborator = await createReader(app, token2)

  await createCollaborator(app, token, notebook.shortId, {
    readerId: collaborator.shortId,
    status: 'accepted',
    permission: { read: true, comment: true }
  })

  await tap.test('Create Note in Notebook as a collaborator', async () => {
    const res = await request(app)
      .post(`/notebooks/${notebookId}/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: {
            content: 'this is the content of the note',
            motivation: 'test'
          },
          json: { property1: 'value1' }
        })
      )
    await tap.equal(res.status, 201)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(urlToId(body.readerId), collaborator.shortId)
    await tap.equal(body.json.property1, 'value1')
    await tap.ok(body.published)
    await tap.ok(body.body)
    await tap.ok(body.body[0].content)
    await tap.equal(body.body[0].motivation, 'test')

    await tap.type(res.get('Location'), 'string')
    await tap.equal(res.get('Location'), body.id)
  })

  await destroyDB(app)
}

module.exports = test
