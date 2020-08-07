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

  function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  const time1 = new Date().toISOString()
  await sleep(50)
  const note1 = await createNoteSimplified() // 1
  const note2 = await createNoteSimplified() // 2
  const note3 = await createNoteSimplified() // 3
  const note4 = await createNoteSimplified() // 4
  await createNoteSimplified() // 5

  const time2 = new Date().toISOString()
  await sleep(50)
  await createNoteSimplified() // 6
  await createNoteSimplified() // 7
  await createNoteSimplified() // 8
  await createNoteSimplified() // 9
  await createNoteSimplified() // 10
  await createNoteSimplified() // 11
  await createNoteSimplified() // 12
  await createNoteSimplified() // 13
  await await request(app)
    .put(`/notes/${note1.shortId}`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
    .send(JSON.stringify(Object.assign(note1, { body: { content: 'new' } })))
  await await request(app)
    .put(`/notes/${note2.shortId}`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
    .send(JSON.stringify(Object.assign(note2, { body: { content: 'new' } })))

  const time3 = new Date().toISOString()
  await sleep(50)
  await createNoteSimplified()
  await createNoteSimplified()
  await createNoteSimplified()

  const time4 = new Date().toISOString()
  await sleep(50)
  await await request(app)
    .put(`/notes/${note3.shortId}`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
    .send(JSON.stringify(Object.assign(note3, { body: { content: 'new' } })))
  await await request(app)
    .put(`/notes/${note4.shortId}`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
    .send(JSON.stringify(Object.assign(note4, { body: { content: 'new' } })))

  await tap.test('Filter Notes by date range - start only', async () => {
    const res = await request(app)
      .get(`/notes?updatedStart=${time3}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 5)
    await tap.equal(res.body.items.length, 5)
  })

  await tap.test('Filter Notes by date range - end only', async () => {
    const res = await request(app)
      .get(`/notes?updatedEnd=${time2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 1)
    await tap.equal(res.body.items.length, 1)
  })

  await tap.test('Filter Notes by date range - start and end', async () => {
    const res = await request(app)
      .get(`/notes?updatedStart=${time2}&updatedEnd=${time3}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 10)
    await tap.equal(res.body.items.length, 10)
  })

  await tap.test(
    'Filter Notes by date range - start and end with pagination',
    async () => {
      const res = await request(app)
        .get(`/notes?updatedStart=${time1}&updatedEnd=${time4}&limit=11`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.ok(res.body)

      await tap.equal(res.body.totalItems, 14)
      await tap.equal(res.body.items.length, 11)
    }
  )

  await tap.test('Try to filter notes with invalid date range', async () => {
    const res = await request(app)
      .get(`/notes?updatedStart=${time3}&updatedEnd=${time1}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(
      error.message,
      `Invalid time range: end time should be larger than start time`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notes?updatedStart=${time3}&updatedEnd=${time1}`
    )
  })

  await destroyDB(app)
}

module.exports = test
