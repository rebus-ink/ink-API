const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote,
  createDocument
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = `/readers/${urlToId(readerId)}`
  const publication = await createPublication(urlToId(readerId), {
    name: 'Publication A'
  })
  const publicationUrl = publication.id
  const publicationId = urlToId(publicationUrl)

  const createdDocument = await createDocument(readerId, publicationUrl)

  const documentUrl = `${publicationUrl}/${createdDocument.documentPath}`

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      { documentUrl, publicationId, body: { motivation: 'test' } },
      object
    )
    return await createNote(app, token, urlToId(readerId), noteObj)
  }

  await createNoteSimplified({ body: { motivation: 'test', content: 'first' } })
  await createNoteSimplified({
    body: { motivation: 'test', content: 'second' }
  })
  await createNoteSimplified({ body: { motivation: 'test', content: 'third' } })
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

  await createNoteSimplified({
    body: { motivation: 'test', content: 'third last' }
  })
  await createNoteSimplified({
    body: { motivation: 'test', content: 'second last' }
  })
  await createNoteSimplified({ body: { motivation: 'test', content: 'last' } })

  // ------------------------------------------ DATE CREATED ----------------------------------

  await tap.test('Order Notes by date created', async () => {
    const res = await request(app)
      .get(`/notes?orderBy=created`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.body.items[0].body.content, 'last')
    await tap.equal(res.body.items[1].body.content, 'second last')
    await tap.equal(res.body.items[2].body.content, 'third last')
  })

  await tap.test('Order Notes by date created - reversed', async () => {
    const res1 = await request(app)
      .get(`/notes?orderBy=created&reverse=true`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res1.body.items[0].body.content, 'first')
    await tap.equal(res1.body.items[1].body.content, 'second')
    await tap.equal(res1.body.items[2].body.content, 'third')
  })

  // -------------------------------------- DATE UPDATED ---------------------------------------

  await tap.test('Order Notes by date updated', async () => {
    // update two older notes:
    const res = await request(app)
      .get(`/notes?orderBy=created&limit=25`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const id1 = urlToId(res.body.items[22].id)
    const id2 = urlToId(res.body.items[18].id)

    await request(app)
      .put(`/notes/${id1}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(
        JSON.stringify(
          Object.assign(res.body.items[22], {
            body: { motivation: 'test', content: 'new content1' }
          })
        )
      )

    await request(app)
      .put(`/notes/${id2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify(
          Object.assign(res.body.items[18], {
            body: { motivation: 'test', content: 'new content2' }
          })
        )
      )

    const res1 = await request(app)
      .get(`/notes?orderBy=updated`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res1.body.items[0].body.content, 'new content2')
    await tap.equal(res1.body.items[1].body.content, 'new content1')
    await tap.equal(res1.body.items[2].body.content, 'last')
  })

  await tap.test('Order Notes by date updated - reversed', async () => {
    const res2 = await request(app)
      .get(`/notes?orderBy=updated&reverse=true`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.body.items[0].body.content, 'first')
    await tap.equal(res2.body.items[1].body.content, 'second')
    await tap.equal(res2.body.items[2].body.content, 'third')
  })

  await destroyDB(app)
}

module.exports = test
