const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook,
  createReader
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const token2 = getToken()
  const reader2 = await createReader(app, token2)

  const notebook = await createNotebook(app, token, { name: 'notebook1' })
  const notebook2 = await createNotebook(app, token, { name: 'notebook2' })
  const notebook3 = await createNotebook(app, token, { name: 'notebook3' })

  await tap.test('Create a collaborator', async () => {
    const res = await request(app)
      .post(`/notebooks/${notebook.shortId}/collaborators`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          readerId: reader2.shortId,
          status: 'pending',
          permission: { read: true, comment: true }
        })
      )
    await tap.equal(res.status, 201)

    const body = res.body
    await tap.ok(body.id)
    await tap.ok(body.shortId)
    await tap.ok(body.notebookId)
    await tap.ok(body.readerId)
    await tap.equal(body.notebookId, notebook.shortId)
    await tap.equal(body.status, 'pending')
    await tap.equal(body.permission.read, true)
    await tap.equal(body.permission.comment, true)
    await tap.ok(body.published)
    await tap.ok(body.updated)
  })

  await tap.test('invalid properties should be ignored', async () => {
    const res = await request(app)
      .post(`/notebooks/${notebook2.shortId}/collaborators`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          readerId: reader2.shortId,
          status: 'pending',
          permission: { read: true, comment: true },
          invalidProp: 'jwoerijeosnco'
        })
      )

    await tap.equal(res.status, 201)

    const body = res.body
    await tap.equal(body.status, 'pending')
    await tap.notOk(body.invalidProp)
  })

  // await tap.test('Try to create a duplicate collaborator', async () => {
  //   const res = await request(app)
  //     .post(`/notebooks/${notebook.shortId}/collaborators`)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type('application/ld+json')
  //     .send(
  //       JSON.stringify({
  //         readerId: reader2.shortId,
  //         status: 'pending',
  //         permission: {read: true, comment: true}
  //       })
  //     )

  //   await tap.equal(res.status, 400)
  //   const error = JSON.parse(res.text)
  //   await tap.equal(error.statusCode, 400)
  //   await tap.equal(error.error, 'Bad Request')
  //   await tap.equal(
  //     error.message,
  //     ''
  //   )
  //   await tap.equal(error.details.requestUrl, '/collaborators')
  //   await tap.type(error.details.requestBody, 'object')
  //   await tap.equal(error.details.requestBody.status, 'pending')

  // })

  await tap.test(
    'trying to create a Collaborator without a readerId',
    async () => {
      const res = await request(app)
        .post(`/notebooks/${notebook3.shortId}/collaborators`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            // readerId: reader2.shortId,
            status: 'pending',
            permission: { read: true, comment: true }
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        "Validation Error on Create Collaborator: readerId: must have required property 'readerId'"
      )
      await tap.type(error.details.validation, 'object')
      await tap.equal(error.details.validation.readerId[0].keyword, 'required')
      await tap.equal(
        error.details.validation.readerId[0].params.missingProperty,
        'readerId'
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook3.shortId}/collaborators`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.status, 'pending')
    }
  )

  await tap.test(
    'trying to create a Collaborator without a status',
    async () => {
      const res = await request(app)
        .post(`/notebooks/${notebook3.shortId}/collaborators`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            readerId: reader2.shortId,
            // status: 'pending',
            permission: { read: true, comment: true }
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Collaborator validation error: status is a required property'
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook3.shortId}/collaborators`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.permission.read, true)
    }
  )

  await tap.test(
    'trying to create a Collaborator without a permission object',
    async () => {
      const res = await request(app)
        .post(`/notebooks/${notebook3.shortId}/collaborators`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            readerId: reader2.shortId,
            status: 'pending'
            // permission: {read: true, comment: true}
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        "Validation Error on Create Collaborator: permission: must have required property 'permission'"
      )
      await tap.type(error.details.validation, 'object')
      await tap.equal(
        error.details.validation.permission[0].keyword,
        'required'
      )
      await tap.equal(
        error.details.validation.permission[0].params.missingProperty,
        'permission'
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook3.shortId}/collaborators`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.status, 'pending')
    }
  )

  await tap.test(
    'trying to create a Collaborator with an invalid status',
    async () => {
      const res = await request(app)
        .post(`/notebooks/${notebook3.shortId}/collaborators`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            readerId: reader2.shortId,
            status: 'pending!!', // not valid
            permission: { read: true, comment: true }
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Collaborator validation error: pending!! is not a valid status'
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook3.shortId}/collaborators`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.status, 'pending!!')
    }
  )

  await tap.test(
    'trying to create a Collaborator with invalid data',
    async () => {
      const res = await request(app)
        .post(`/notebooks/${notebook3.shortId}/collaborators`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            readerId: reader2.shortId,
            status: 'pending',
            permission: 'should not be a string'
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Validation Error on Create Collaborator: permission: must be object'
      )
      await tap.type(error.details.validation, 'object')
      await tap.equal(error.details.validation.permission[0].keyword, 'type')
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook3.shortId}/collaborators`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.status, 'pending')
    }
  )

  await destroyDB(app)
}

module.exports = test
