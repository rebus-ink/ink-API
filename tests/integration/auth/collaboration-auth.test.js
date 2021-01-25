const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createReader,
  createCollaborator,
  createSource,
  createNote,
  createTag,
  createNoteRelation,
  createNoteContext,
  createNotebook,
  createCanvas
} = require('../../utils/testUtils')
const { Reader } = require('../../../models/Reader')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  // Create owner, collaborator and stranger
  const token = getToken()
  const owner = await createReader(app, token)
  const token2 = getToken()
  const collab = await createReader(app, token2)
  const token3 = getToken()
  const stranger = await createReader(app, token3)

  // create notebook and collab
  const notebook = await createNotebook(app, token, { name: 'my notebook' })
  const collaboratorObject = await createCollaborator(
    app,
    token,
    notebook.shortId,
    {
      readerId: collab.shortId,
      status: 'accepted',
      permission: {
        read: 'true',
        comment: 'true'
      }
    }
  )

  await tap.test(
    'Try to create a collaborator in a notebook you do not own',
    async () => {
      const res = await request(app)
        .post(`/notebooks/${notebook.shortId}/collaborators`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token3}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            readerId: stranger.shortId,
            status: 'accepted',
            permission: { read: true }
          })
        )

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to notebook ${notebook.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook.shortId}/collaborators`
      )
    }
  )

  await tap.test('Try to update a collaborator by a stranger', async () => {
    const res = await request(app)
      .put(
        `/notebooks/${notebook.shortId}/collaborators/${
          collaboratorObject.shortId
        }`
      )
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token3}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          readerId: collab.shortId,
          status: 'accepted',
          permission: { read: true }
        })
      )

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(
      error.message,
      `Access to Collaborator ${collaboratorObject.shortId} disallowed`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebook.shortId}/collaborators/${
        collaboratorObject.shortId
      }`
    )
  })

  await tap.test('Try to delete a collaborator by a stranger', async () => {
    const res = await request(app)
      .delete(
        `/notebooks/${notebook.shortId}/collaborators/${
          collaboratorObject.shortId
        }`
      )
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token3}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(
      error.message,
      `Access to Collaborator ${collaboratorObject.shortId} disallowed`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebook.shortId}/collaborators/${
        collaboratorObject.shortId
      }`
    )
  })

  await destroyDB(app)
}

module.exports = test
