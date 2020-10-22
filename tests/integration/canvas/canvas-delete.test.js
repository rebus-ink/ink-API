const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createCanvas,
  createNotebook
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const notebook = await createNotebook(app, token, { name: 'notebook' })
  const canvas = await createCanvas(app, token, {
    name: 'something',
    notebookId: notebook.shortId
  })
  await tap.test('Delete Canvas', async () => {
    const res = await request(app)
      .delete(`/canvas/${canvas.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 204)

    // getting deleted canvas should return 404 error
    // const getres = await request(app)
    //   .get(`/canvas/${canvas.shortId}`)
    //   .set('Host', 'reader-api.test')
    //   .set('Authorization', `Bearer ${token}`)
    //   .type('application/ld+json')

    // await tap.equal(getres.statusCode, 404)
    // const error = JSON.parse(getres.text)
    // await tap.equal(error.statusCode, 404)
    // await tap.equal(error.error, 'Not Found')
    // await tap.equal(
    //   error.message,
    //   `No Canvas found with id ${canvas.shortId}`
    // )
    // await tap.equal(error.details.requestUrl, `/canvas/${canvas.shortId}`)

    // canvas should no longer be in the reader list of canvas
    // const canvasres = await request(app)
    //   .get(`/canvas`)
    //   .set('Host', 'reader-api.test')
    //   .set('Authorization', `Bearer ${token}`)
    //   .type('application/ld+json')

    // await tap.equal(canvasres.status, 200)
    // const body = canvasres.body
    // await tap.ok(Array.isArray(body))
    // await tap.equal(body.items.length, 0)
  })

  await tap.test(
    'Try to delete a Canvas that was already deleted',
    async () => {
      const res = await request(app)
        .delete(`/canvas/${canvas.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(
        error.message,
        `Canvas Delete Error: No Canvas found with id ${canvas.shortId}`
      )
      await tap.equal(error.details.requestUrl, `/canvas/${canvas.shortId}`)
    }
  )

  await tap.test('Try to update Canvas that was already deleted', async () => {
    const res = await request(app)
      .put(`/canvas/${canvas.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({ name: 'new name!!', notebookId: notebook.shortId })
      )

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `Put Canvas Error: No Canvas found with id ${canvas.shortId}`
    )
    await tap.equal(error.details.requestUrl, `/canvas/${canvas.shortId}`)
  })

  await tap.test('Try to delete a Canvas that does not exist', async () => {
    const res1 = await request(app)
      .delete(`/canvas/${canvas.shortId}1234`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res1.statusCode, 404)
    const error1 = JSON.parse(res1.text)
    await tap.equal(error1.statusCode, 404)
    await tap.equal(error1.error, 'Not Found')
    await tap.equal(
      error1.message,
      `Canvas Delete Error: No Canvas found with id ${canvas.shortId}1234`
    )
    await tap.equal(error1.details.requestUrl, `/canvas/${canvas.shortId}1234`)
  })

  await destroyDB(app)
}

module.exports = test
