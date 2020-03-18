const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNoteContext
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const outline = await createNoteContext(app, token)

  await tap.test('Delete an Outline', async () => {
    const res = await request(app)
      .delete(`/outlines/${outline.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)
  })

  await tap.test(
    'Try to delete an Outline that was already deleted',
    async () => {
      const res = await request(app)
        .delete(`/outlines/${outline.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `No Outline found with id ${outline.shortId}`
      )
      await tap.equal(error.details.requestUrl, `/outlines/${outline.shortId}`)
    }
  )

  await tap.test('Try to delete an Outline that does not exist', async () => {
    const res = await request(app)
      .delete(`/outlines/${outline.shortId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `No Outline found with id ${outline.shortId}abc`
    )
    await tap.equal(error.details.requestUrl, `/outlines/${outline.shortId}abc`)
  })

  await tap.test('Try to get an Outline that was deleted', async () => {
    const res = await request(app)
      .get(`/outlines/${outline.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Get outline Error: No Outline found with id ${outline.shortId}`
    )
    await tap.equal(error.details.requestUrl, `/outlines/${outline.shortId}`)
  })

  // await tap.test(
  //   'Try to add a note to an outline that was deleted',
  //   async () => {
  //     const res = await request(app)
  //       .post(`/outlines/${outline.shortId}/notes`)
  //       .set('Host', 'reader-api.test')
  //       .set('Authorization', `Bearer ${token}`)
  //       .type('application/ld+json')
  //       .send(
  //         JSON.stringify({
  //           body: {
  //             content: 'this is the content of the note',
  //             motivation: 'test'
  //           },
  //           json: { property1: 'value1' }
  //         })
  //       )

  //     await tap.equal(res.status, 404)
  //     const error = JSON.parse(res.text)
  //     await tap.equal(
  //       error.message,
  //       `Add Note to Outline Error: No Outline found with id: ${
  //         outline.shortId
  //       }`
  //     )
  //     await tap.equal(
  //       error.details.requestUrl,
  //       `/outlines/${outline.shortId}/notes`
  //     )
  //   }
  // )

  // await tap.test('Try to update an Outline that was deleted', async () => {
  //   const res = await request(app)
  //     .put(`/outlines/${outline.shortId}`)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type('application/ld+json')
  //     .send(JSON.stringify(Object.assign(outline, { type: 'test2' })))

  //   await tap.equal(res.status, 404)
  //   const error = JSON.parse(res.text)
  //   await tap.equal(
  //     error.message,
  //     `No Outline found with id ${outline.shortId}`
  //   )
  //   await tap.equal(
  //     error.details.requestUrl,
  //     `/outlines/${outline.shortId}`
  //   )
  // })

  await destroyDB(app)
}

module.exports = test
