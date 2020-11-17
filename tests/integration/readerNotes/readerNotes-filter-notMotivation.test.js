const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNote
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      {
        body: { motivation: 'test' }
      },
      object
    )
    return await createNote(app, token, noteObj)
  }

  await createNoteSimplified() // 1
  await createNoteSimplified() // 2
  await createNoteSimplified() // 3
  await createNoteSimplified() // 4
  await createNoteSimplified() // 5
  await createNoteSimplified() // 6
  await createNoteSimplified() // 7
  await createNoteSimplified() // 8
  await createNoteSimplified() // 9
  await createNoteSimplified() // 10
  await createNoteSimplified() // 11
  await createNoteSimplified() // 12
  await createNoteSimplified() // 13

  // create more notes with another motivation (5)
  await createNoteSimplified({
    body: { motivation: 'highlighting' }
  })
  await createNoteSimplified({
    body: { motivation: 'highlighting' }
  })
  await createNoteSimplified({
    body: { motivation: 'highlighting' }
  })
  await createNoteSimplified({
    body: { motivation: 'highlighting' }
  })
  await createNoteSimplified({
    body: { motivation: 'highlighting' }
  })

  await tap.test('Filter Notes by NOT motivation', async () => {
    const res = await request(app)
      .get(`/notes?notMotivation=test`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 5)
    await tap.equal(res.body.items.length, 5)
  })

  await tap.test('Filter Notes by NOT motivation with pagination', async () => {
    const res = await request(app)
      .get(`/notes?notMotivation=highlighting&limit=11&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 13)
    await tap.equal(res.body.items.length, 2)
  })

  await tap.test('Filter Notes by an inexistant NOT motivation', async () => {
    const res = await request(app)
      .get(`/notes?notMotivation=somethingElse`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.items.length, 10)
    await tap.equal(res.body.totalItems, 18)
  })

  await destroyDB(app)
}

module.exports = test
