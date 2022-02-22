const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  createReader,
  destroyDB,
  createCollaborator,
  createNotebook
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const notebook1 = await createNotebook(app, token, { name: 'notebook1' })

  const token2 = getToken()
  const reader2 = await createReader(app, token2)

  const collaborator = await createCollaborator(app, token, notebook1.shortId, {
    readerId: reader2.shortId,
    status: 'pending',
    permission: {
      read: true,
      comment: true
    }
  })

  await tap.test('Update the status of a collaborator', async () => {
    const newCollab = Object.assign(collaborator, { status: 'accepted' })

    const res = await request(app)
      .put(
        `/notebooks/${notebook1.shortId}/collaborators/${collaborator.shortId}`
      )
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type('application/ld+json')
      .send(JSON.stringify(newCollab))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(body.status, 'accepted')
    await tap.notEqual(body.published, body.updated)
    // check that old properties are still there
    await tap.type(body.notebookId, 'string')
    await tap.equal(body.permission.read, true)
    await tap.equal(urlToId(body.readerId), reader2.shortId)
  })

  await tap.test('Update the permission of a collaborator', async () => {
    const newCollab = Object.assign(collaborator, {
      permission: { read: true, comment: false }
    })

    const res = await request(app)
      .put(
        `/notebooks/${notebook1.shortId}/collaborators/${collaborator.shortId}`
      )
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type('application/ld+json')
      .send(JSON.stringify(newCollab))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.notEqual(body.published, body.updated)
    await tap.equal(body.permission.comment, false)
    // check that old properties are still there
    await tap.type(body.notebookId, 'string')
    await tap.equal(body.permission.read, true)
    await tap.equal(body.status, 'accepted')
    await tap.equal(urlToId(body.readerId), reader2.shortId)
  })

  // // ----------------------------------- VALIDATION ERRORS --------------

  await tap.test('Try to update the permission to a wrong type', async () => {
    const newCollab = Object.assign(collaborator, { permission: 'string' })

    const res = await request(app)
      .put(
        `/notebooks/${notebook1.shortId}/collaborators/${collaborator.shortId}`
      )
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type('application/ld+json')
      .send(JSON.stringify(newCollab))

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      `Validation Error on Update Collaborator: permission: should be object`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebook1.shortId}/collaborators/${collaborator.shortId}`
    )
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.permission, 'string')
  })

  await tap.test('Try to update by removing the status', async () => {
    const newCollab = Object.assign(collaborator, { status: null })

    const res = await request(app)
      .put(
        `/notebooks/${notebook1.shortId}/collaborators/${collaborator.shortId}`
      )
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type('application/ld+json')
      .send(JSON.stringify(newCollab))

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      `Collaborator validation error: status is a required property`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebook1.shortId}/collaborators/${collaborator.shortId}`
    )
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.status, null)
  })

  await tap.test(
    'Try to update by updating the status to an invalid value',
    async () => {
      const newCollab = Object.assign(collaborator, {
        status: 'invalid',
        permission: { read: true }
      })

      const res = await request(app)
        .put(
          `/notebooks/${notebook1.shortId}/collaborators/${
            collaborator.shortId
          }`
        )
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify(newCollab))

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        `Collaborator validation error: invalid is not a valid status`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook1.shortId}/collaborators/${collaborator.shortId}`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.status, 'invalid')
    }
  )

  await tap.test(
    'Try to update a Collaborator that does not exist',
    async () => {
      const newCollab = Object.assign(collaborator, { status: 'pending' })

      const res = await request(app)
        .put(
          `/notebooks/${notebook1.shortId}/collaborators/${
            collaborator.shortId
          }abc`
        )
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify(newCollab))

      await tap.equal(res.statusCode, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(
        error.message,
        `Put Collaborator Error: No Collaborator found with id ${
          collaborator.shortId
        }abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook1.shortId}/collaborators/${
          collaborator.shortId
        }abc`
      )
      await tap.type(error.details.requestBody, 'object')
    }
  )

  await destroyDB(app)
}

module.exports = test
