const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNote
} = require('../../utils/testUtils')

const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const source = await createSource(app, token, {
    name: 'Source A'
  })
  const sourceUrl = source.id
  const sourceId = urlToId(sourceUrl)

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      { sourceId, body: [{ motivation: 'test' }, { motivation: 'test' }] },
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

  await tap.test('Get Notes - paginated by default to 10', async () => {
    const res2 = await request(app)
      .get(`/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.equal(res2.body.totalItems, 13)
    await tap.equal(res2.body.items.length, 10)
  })

  await tap.test('Get Notes - paginated with limit', async () => {
    const res = await request(app)
      .get(`/notes?limit=12`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.totalItems, 13)
    await tap.equal(res.body.items.length, 12)
  })

  await tap.test('Get Notes - paginated with page', async () => {
    const res3 = await request(app)
      .get(`/notes?page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res3.status, 200)
    await tap.equal(res3.body.totalItems, 13)
    await tap.equal(res3.body.items.length, 3)
  })

  await tap.test('Get Notes - paginated with limit and page', async () => {
    const res4 = await request(app)
      .get(`/notes?limit=11&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res4.status, 200)
    await tap.equal(res4.body.totalItems, 13)
    await tap.equal(res4.body.items.length, 2)
  })

  await tap.test(
    'Get Notes - paginate with page to an empty page',
    async () => {
      const res = await request(app)
        .get(`/notes?page=3`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.equal(res.body.totalItems, 13)
      await tap.equal(res.body.items.length, 0)
    }
  )

  await tap.test(
    'Get Notes - limit higher than the number of notes',
    async () => {
      const res = await request(app)
        .get(`/notes?limit=20`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.equal(res.body.totalItems, 13)
      await tap.equal(res.body.items.length, 13)
    }
  )

  await tap.test(
    'Get Notes - limit under 10 should default to 10',
    async () => {
      const res = await request(app)
        .get(`/notes?limit=2`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.equal(res.body.totalItems, 13)
      await tap.equal(res.body.items.length, 10)
    }
  )

  await tap.test('Get Notes - limit of 0 should default to 10', async () => {
    const res = await request(app)
      .get(`/notes?limit=0`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.totalItems, 13)
    await tap.equal(res.body.items.length, 10)
  })

  await tap.test(
    'Get Notes - limit of over 100 should default to 100',
    async () => {
      // 13 so far
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      // 20
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      // 30
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      // 40
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      // 50
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      // 60
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      // 70
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      // 80
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      // 90
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      // 100
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      await createNoteSimplified()
      // 110

      const res = await request(app)
        .get(`/notes?limit=160`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.body.items.length, 100)
    }
  )

  await destroyDB(app)
}

module.exports = test
