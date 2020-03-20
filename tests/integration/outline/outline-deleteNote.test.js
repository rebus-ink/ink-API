const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNoteContext,
  createNote,
  addNoteToOutline
} = require('../../utils/testUtils')
const _ = require('lodash')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const outline = await createNoteContext(app, token, {
    name: 'my outline',
    type: 'outline'
  })
  const outlineId = outline.shortId

  const note1 = await addNoteToOutline(app, token, outlineId, {
    body: { motivation: 'test' },
    canonical: '1'
  })
  const note2 = await addNoteToOutline(app, token, outlineId, {
    body: { motivation: 'test' },
    canonical: '2'
  })
  const note3 = await addNoteToOutline(app, token, outlineId, {
    body: { motivation: 'test' },
    canonical: '3',
    previous: note2.shortId
  })
  const note4 = await addNoteToOutline(app, token, outlineId, {
    body: { motivation: 'test' },
    canonical: '4',
    previous: note3.shortId
  })

  const note5 = await createNote(app, token, outlineId)

  await tap.test('Delete a note from an outline', async () => {
    const resOutlineBefore = await request(app)
      .get(`/outlines/${outlineId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(resOutlineBefore.body.notes.length, 4)

    const res = await request(app)
      .delete(`/outlines/${outlineId}/notes/${note1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    const resOutline = await request(app)
      .get(`/outlines/${outlineId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(resOutline.body.notes.length, 3)
  })

  await tap.test('Delete a note in a position from an outline', async () => {
    const res = await request(app)
      .delete(`/outlines/${outlineId}/notes/${note3.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    const resOutline = await request(app)
      .get(`/outlines/${outlineId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(resOutline.body.notes.length, 2)
    await tap.equal(resOutline.body.notes[0].shortId, note2.shortId)
    await tap.equal(resOutline.body.notes[1].shortId, note4.shortId)
  })

  await tap.test(
    'Try to Delete a Note from an outline that does not exist',
    async () => {
      const res = await request(app)
        .delete(`/outlines/${outlineId}abc/notes/${note2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `No Outline found with id ${outline.shortId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/outlines/${outline.shortId}abc/notes/${note2.shortId}`
      )
    }
  )

  await tap.test(
    'Try to Delete a Note that does not exist from an outline',
    async () => {
      const res = await request(app)
        .delete(`/outlines/${outlineId}/notes/${note2.shortId}abc`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `No Note found with id: ${note2.shortId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/outlines/${outline.shortId}/notes/${note2.shortId}abc`
      )
    }
  )

  await tap.test(
    'Try to Delete a Note from an outline that does not belong to an outline',
    async () => {
      const res = await request(app)
        .delete(`/outlines/${outlineId}/notes/${note5.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Note ${note5.shortId} does not belong to outline ${outlineId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/outlines/${outline.shortId}/notes/${note5.shortId}`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
