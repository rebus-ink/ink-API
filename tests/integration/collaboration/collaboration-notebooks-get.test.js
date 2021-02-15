const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  destroyDB,
  createNotebook,
  createCollaborator,
  createReader
} = require('../../utils/testUtils')

const test = async app => {
  // owner, collab1, collab2
  const token = getToken()
  // owner
  await createReader(app, token)
  const token2 = getToken()
  const collab1 = await createReader(app, token2) // will be pending
  const token3 = getToken()
  const collab2 = await createReader(app, token3) // will be accepted

  const notebook = await createNotebook(app, token, {
    name: 'notebook123',
    status: 'archived',
    description: 'test',
    settings: {
      property: 'value'
    }
  })

  const notebook2 = await createNotebook(app, token, {
    name: 'notebook2',
    status: 'active',
    description: 'test',
    settings: {
      property: 'value'
    }
  })

  // belongs to collab
  const notebook3 = await createNotebook(app, token3, {
    name: 'notebook3',
    status: 'active',
    description: 'test',
    settings: {
      property: 'value'
    }
  })

  await createCollaborator(app, token, notebook.shortId, {
    readerId: collab1.shortId,
    status: 'pending',
    permission: { read: true }
  })

  await createCollaborator(app, token, notebook.shortId, {
    readerId: collab2.shortId,
    status: 'accepted',
    permission: { read: true }
  })

  await createCollaborator(app, token, notebook2.shortId, {
    readerId: collab2.shortId,
    status: 'accepted',
    permission: { read: true }
  })

  await tap.test(
    'Accepted collaborator should be able to get the notebook as part of the notebooks lis',
    async () => {
      const res = await request(app)
        .get(`/notebooks?collaboration=true`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token3}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      const body = res.body
      await tap.equal(body.items.length, 3)
    }
  )

  await tap.test(
    'Accepted collaborator should be able to get the notebook as part of the notebooks list, with other filters',
    async () => {
      const res = await request(app)
        .get(`/notebooks?collaboration=true&status=active`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token3}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      const body = res.body
      await tap.equal(body.items.length, 2)
    }
  )

  await tap.test(
    'Getting notebooks as a pending collaborator should not return collaboration notebook',
    async () => {
      const res = await request(app)
        .get(`/notebooks?collaboration=true`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      const body = res.body
      await tap.equal(body.items.length, 0)
    }
  )

  await destroyDB(app)
}

module.exports = test
