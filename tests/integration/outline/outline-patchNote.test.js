const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  createNote,
  destroyDB,
  createNoteContext,
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

  // linked list: 1 - 2 - 3 - 4 - 5
  const note1 = await addNoteToOutline(app, token, outlineId, {
    canonical: '1'
  })
  const note2 = await addNoteToOutline(app, token, outlineId, {
    canonical: '2',
    previous: note1.shortId
  })
  const note3 = await addNoteToOutline(app, token, outlineId, {
    canonical: '3',
    previous: note2.shortId
  })
  const note4 = await addNoteToOutline(app, token, outlineId, {
    canonical: '4',
    previous: note3.shortId
  })
  const note5 = await addNoteToOutline(app, token, outlineId, {
    canonical: '5',
    previous: note4.shortId
  })

  // children of note 3:
  const note6 = await addNoteToOutline(app, token, outlineId, {
    canonical: '6',
    parentId: note3.shortId
  })
  // note7
  await addNoteToOutline(app, token, outlineId, {
    canonical: '7',
    parentId: note3.shortId,
    previous: note6.shortId
  })

  // notes not in list:
  const note8 = await addNoteToOutline(app, token, outlineId, {
    canonical: '8',
    body: { motivation: 'test', content: 'original content' },
    json: { property: 'value' }
  })
  // note9
  await addNoteToOutline(app, token, outlineId, {
    canonical: '9'
  })

  /*
  1
  2
  3
    6
    7
  4
  5

  unsorted: 8, 9
   */

  const note10 = await createNote(app, token)

  await tap.test('Update the content of a note', async () => {
    const res = await request(app)
      .patch(`/outlines/${outlineId}/notes/${note8.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: {
            content: 'new content',
            motivation: 'test'
          }
        })
      )

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.equal(body.body[0].content, 'new content')
    // old properties stay the same
    await tap.equal(body.json.property, 'value')
  })

  await tap.test(
    'Update the content of a note that is in a specific position',
    async () => {
      const res = await request(app)
        .patch(`/outlines/${outlineId}/notes/${note2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            body: {
              content: 'new content',
              motivation: 'test'
            }
          })
        )

      await tap.equal(res.status, 200)
      const body = res.body
      await tap.equal(body.body[0].content, 'new content')
      await tap.equal(body.previous, note1.shortId)
      await tap.equal(body.next, note3.shortId)

      // previous and next notes should remain the same
      const resOutline = await request(app)
        .get(`/outlines/${outlineId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const notes = resOutline.body.notes
      const previousNote = _.find(notes, { shortId: note1.shortId })
      await tap.equal(previousNote.next, note2.shortId)
      const nextNote = _.find(notes, { shortId: note3.shortId })
      await tap.equal(nextNote.previous, note2.shortId)
    }
  )

  /*
  1
  2
  3
    6
    7
  4
  **8**
  5

  unsorted:  9
   */

  await tap.test('Move an unsorted note to a position', async () => {
    const res = await request(app)
      .patch(`/outlines/${outlineId}/notes/${note8.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          previous: note4.shortId,
          next: note5.shortId
        })
      )

    await tap.equal(res.status, 200)
    await tap.equal(res.body.previous, note4.shortId)
    await tap.equal(res.body.next, note5.shortId)

    const resOutline = await request(app)
      .get(`/outlines/${outlineId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(resOutline.status, 200)
    const notes = resOutline.body.notes
    await tap.equal(notes[1].shortId, note1.shortId)
    await tap.equal(notes[2].shortId, note2.shortId)
    await tap.equal(notes[3].shortId, note3.shortId)
    await tap.equal(notes[4].shortId, note4.shortId)
    await tap.equal(notes[5].shortId, note8.shortId)
    await tap.equal(notes[6].shortId, note5.shortId)
  })

  /*
  1
  **4**
  2
  3
    6
    7
  8
  5

  unsorted:  9
   */

  await tap.test('Move a sorted note to a new position', async () => {
    const res = await request(app)
      .patch(`/outlines/${outlineId}/notes/${note4.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          previous: note1.shortId,
          next: note2.shortId
        })
      )

    await tap.equal(res.status, 200)
    await tap.equal(res.body.previous, note1.shortId)
    await tap.equal(res.body.next, note2.shortId)

    const resOutline = await request(app)
      .get(`/outlines/${outlineId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(resOutline.status, 200)
    const notes = resOutline.body.notes
    await tap.equal(notes[1].shortId, note1.shortId)
    await tap.equal(notes[2].shortId, note4.shortId)
    await tap.equal(notes[3].shortId, note2.shortId)
    await tap.equal(notes[4].shortId, note3.shortId)
    await tap.equal(notes[5].shortId, note8.shortId)
    await tap.equal(notes[6].shortId, note5.shortId)
  })

  /*
  1
    **2**
  4
  3
    6
    7
  8
  5

  unsorted:  9
   */
  await tap.test('Move a sorted note to a new nested position', async () => {
    const res = await request(app)
      .patch(`/outlines/${outlineId}/notes/${note2.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          parentId: note1.shortId,
          previous: null,
          next: null
        })
      )

    await tap.equal(res.status, 200)
    await tap.notOk(res.body.previous)
    await tap.notOk(res.body.next)
    await tap.equal(res.body.parentId, note1.shortId)

    const resOutline = await request(app)
      .get(`/outlines/${outlineId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(resOutline.status, 200)
    const notes = resOutline.body.notes
    await tap.equal(notes[1].shortId, note1.shortId)
    await tap.equal(notes[2].shortId, note4.shortId)
    await tap.equal(notes[3].shortId, note3.shortId)
    await tap.equal(notes[4].shortId, note8.shortId)
    await tap.equal(notes[5].shortId, note5.shortId)

    await tap.equal(notes[1].children[0].shortId, note2.shortId)
  })

  /*
  1
    2
    **5**
  4
  3
    6
    7
  8

  unsorted:  9
   */
  await tap.test(
    'Move a sorted note to a new nested position with order',
    async () => {
      const res = await request(app)
        .patch(`/outlines/${outlineId}/notes/${note5.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            parentId: note1.shortId,
            previous: note2.shortId,
            next: null
          })
        )

      await tap.equal(res.status, 200)
      await tap.notOk(res.body.next)
      await tap.equal(res.body.parentId, note1.shortId)
      await tap.equal(res.body.previous, note2.shortId)

      const resOutline = await request(app)
        .get(`/outlines/${outlineId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resOutline.status, 200)
      const notes = resOutline.body.notes
      await tap.equal(notes[1].shortId, note1.shortId)
      await tap.equal(notes[2].shortId, note4.shortId)
      await tap.equal(notes[3].shortId, note3.shortId)
      await tap.equal(notes[4].shortId, note8.shortId)

      await tap.equal(notes[1].children[0].shortId, note2.shortId)
      await tap.equal(notes[1].children[1].shortId, note5.shortId)
    }
  )

  await tap.test('Try to update a note that does not exist', async () => {
    const res = await request(app)
      .patch(`/outlines/${outlineId}/notes/${note8.shortId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: {
            content: 'new content',
            motivation: 'test'
          }
        })
      )

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.message, `No Note found with id: ${note8.shortId}abc`)
    await tap.equal(
      error.details.requestUrl,
      `/outlines/${outline.shortId}/notes/${note8.shortId}abc`
    )
    await tap.equal(error.details.requestBody.body.content, 'new content')
  })

  await tap.test(
    'Try to update a note that does not belong to the outline',
    async () => {
      const res = await request(app)
        .patch(`/outlines/${outlineId}/notes/${note10.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            body: {
              content: 'new content',
              motivation: 'test'
            }
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Note ${note10.shortId} does not belong to outline ${outlineId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/outlines/${outline.shortId}/notes/${note10.shortId}`
      )
      await tap.equal(error.details.requestBody.body.content, 'new content')
    }
  )

  await tap.test('Try to update a note with invalid data', async () => {
    const res = await request(app)
      .patch(`/outlines/${outlineId}/notes/${note8.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: {
            content: 123,
            motivation: 'test'
          }
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      'Validation Error on Update Note in Outline: content: should be string,null'
    )
    await tap.equal(
      error.details.requestUrl,
      `/outlines/${outline.shortId}/notes/${note8.shortId}`
    )
    await tap.equal(error.details.requestBody.body.content, 123)
  })

  await destroyDB(app)
}

module.exports = test
