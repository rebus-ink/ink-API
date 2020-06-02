const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNote,
  createNoteRelation
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const note1 = await createNote(app, token, {
    body: { motivation: 'test', content: 'note 1' }
  })
  const noteId1 = urlToId(note1.id)
  const note2 = await createNote(app, token, {
    body: { motivation: 'test', content: 'note 2' }
  })
  const noteId2 = urlToId(note2.id)

  let noteRelation = await createNoteRelation(app, token, {
    from: noteId1,
    to: noteId2,
    type: 'test',
    json: { property: 'value' }
  })

  await tap.test('Delete a NoteRelation', async () => {
    const res = await request(app)
      .delete(`/noteRelations/${noteRelation.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)
  })

  // TODO: test that it is really gone, once I can actually get the noteRelations

  await tap.test(
    'Try to delete a noteRelation that does not exist',
    async () => {
      const res = await request(app)
        .delete(`/noteRelations/${noteRelation.id}abc`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `No NoteRelation found with id ${noteRelation.id}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteRelations/${noteRelation.id}abc`
      )
    }
  )

  await tap.test('Try to update a noteRelation that was deleted', async () => {
    const res = await request(app)
      .put(`/noteRelations/${noteRelation.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify(
          Object.assign(noteRelation, { type: 'test2', from: noteId1 })
        )
      )

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `No NoteRelation found with id ${noteRelation.id}`
    )
    await tap.equal(
      error.details.requestUrl,
      `/noteRelations/${noteRelation.id}`
    )
  })

  await destroyDB(app)
}

module.exports = test
