const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook,
  createCollaborator,
  createReader
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)
  const token2 = getToken()
  const reader2 = await createReader(app, token2)

  const notebook = await createNotebook(app, token, { name: 'notebook' })
  const collaborator = await createCollaborator(app, token, notebook.shortId, {
    readerId: reader2.shortId,
    status: 'pending',
    permission: { read: true }
  })

  await tap.test('Delete Collaborator by collaborator himself', async () => {
    const res = await request(app)
      .delete(
        `/notebooks/${notebook.shortId}/collaborators/${collaborator.shortId}`
      )
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 204)

    // TODO: will have to test that the collaborator does not exist
  })

  await tap.test(
    'Try to delete a Collaborator that was already deleted',
    async () => {
      const res = await request(app)
        .delete(
          `/notebooks/${notebook.shortId}/collaborators/${collaborator.shortId}`
        )
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(
        error.message,
        `Collaborator Delete Error: No Collaborator found with id ${
          collaborator.shortId
        }`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook.shortId}/collaborators/${collaborator.shortId}`
      )
    }
  )

  await tap.test(
    'Try to update Collaborator that was already deleted',
    async () => {
      const res = await request(app)
        .put(
          `/notebooks/${notebook.shortId}/collaborators/${collaborator.shortId}`
        )
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            readerId: reader2.shortId,
            status: 'pending',
            permission: { read: true, comment: true }
          })
        )

      await tap.equal(res.statusCode, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(
        error.message,
        `Put Collaborator Error: No Collaborator found with id ${
          collaborator.shortId
        }`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook.shortId}/collaborators/${collaborator.shortId}`
      )
    }
  )

  await tap.test(
    'Try to delete a Collaborator that does not exist',
    async () => {
      const res1 = await request(app)
        .delete(
          `/notebooks/${notebook.shortId}/collaborators/${
            collaborator.shortId
          }abc`
        )
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res1.statusCode, 404)
      const error1 = JSON.parse(res1.text)
      await tap.equal(error1.statusCode, 404)
      await tap.equal(error1.error, 'Not Found')
      await tap.equal(
        error1.message,
        `Collaborator Delete Error: No Collaborator found with id ${
          collaborator.shortId
        }abc`
      )
      await tap.equal(
        error1.details.requestUrl,
        `/notebooks/${notebook.shortId}/collaborators/${
          collaborator.shortId
        }abc`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
