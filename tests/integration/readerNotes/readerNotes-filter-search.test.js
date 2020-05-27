const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerId = await createUser(app, token)

  const publication = await createPublication(app, token, {
    name: 'Publication A'
  })
  const publicationUrl = publication.id
  const publicationId1 = urlToId(publicationUrl)

  // create another publication
  const publication2 = await createPublication(app, token, {
    name: 'Publication B'
  })
  const publicationUrl2 = publication2.id
  const publicationId2 = urlToId(publicationUrl2)

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      {
        publicationId: publicationId1,
        body: { motivation: 'test' }
      },
      object
    )
    return await createNote(app, token, noteObj)
  }

  await createNoteSimplified({
    body: {
      motivation: 'test',
      content: 'this string contains abc and other things'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'test',
      content: 'this string contains ABCD and other things'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'test',
      content: 'this string contains XYABC and other things'
    },
    publicationId: publicationId2
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })

  await tap.test('Search Note content', async () => {
    const res = await request(app)
      .get(`/notes?search=abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 4)
    await tap.equal(res.body.items.length, 4)
  })

  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })
  await createNoteSimplified({
    body: {
      motivation: 'highlighting',
      content: 'abc'
    }
  })

  await tap.test('Search Note Content with pagination', async () => {
    const res = await request(app)
      .get(`/notes?search=abc&limit=11&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 12)
    await tap.equal(res.body.items.length, 1)
  })

  await tap.test('Search Note Content that does not exist', async () => {
    const res = await request(app)
      .get(`/notes?search=xyz`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 0)
    await tap.equal(res.body.items.length, 0)
  })

  await destroyDB(app)
}

module.exports = test
