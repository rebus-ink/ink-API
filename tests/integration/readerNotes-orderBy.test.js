const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote,
  createDocument
} = require('../utils/utils')

const test = async app => {
  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path

  const publication = await createPublication(readerUrl, {
    name: 'Publication A'
  })
  const publicationUrl = publication.id

  const createdDocument = await createDocument(readerId, publicationUrl)

  const documentUrl = `${publicationUrl}/${createdDocument.documentPath}`

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      { inReplyTo: documentUrl, context: publicationUrl },
      object
    )
    return await createNote(app, token, readerUrl, noteObj)
  }

  await createNoteSimplified({ content: 'first' })
  await createNoteSimplified({ content: 'second' })
  await createNoteSimplified({ content: 'third' })
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

  await createNoteSimplified({ content: 'third last' })
  await createNoteSimplified({ content: 'second last' })
  await createNoteSimplified({ content: 'last' })

  // ------------------------------------------ DATE CREATED ----------------------------------

  await tap.test('Order Notes by date created', async () => {
    const res = await request(app)
      .get(`${readerUrl}/notes?orderBy=created`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.body.items[0].content, 'last')
    await tap.equal(res.body.items[1].content, 'second last')
    await tap.equal(res.body.items[2].content, 'third last')
  })

  await tap.test('Order Notes by date created - reversed', async () => {
    const res1 = await request(app)
      .get(`${readerUrl}/notes?orderBy=created&reverse=true`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res1.body.items[0].content, 'first')
    await tap.equal(res1.body.items[1].content, 'second')
    await tap.equal(res1.body.items[2].content, 'third')
  })

  // -------------------------------------- DATE UPDATED ---------------------------------------

  await tap.test('Order Notes by date updated', async () => {
    // update two older notes:
    const res = await request(app)
      .get(`${readerUrl}/notes?orderBy=created&limit=25`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    const id1 = res.body.items[22].id
    const id2 = res.body.items[18].id

    await request(app)
      .post(`${readerUrl}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(
        JSON.stringify({
          '@context': [
            'https://www.w3.org/ns/activitystreams',
            { reader: 'https://rebus.foundation/ns/reader' }
          ],
          type: 'Update',
          object: {
            type: 'Note',
            id: id1,
            content: 'new content1'
          }
        })
      )
    await request(app)
      .post(`${readerUrl}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(
        JSON.stringify({
          '@context': [
            'https://www.w3.org/ns/activitystreams',
            { reader: 'https://rebus.foundation/ns/reader' }
          ],
          type: 'Update',
          object: {
            type: 'Note',
            id: id2,
            content: 'new content2'
          }
        })
      )

    const res1 = await request(app)
      .get(`${readerUrl}/notes?orderBy=updated`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res1.body.items[0].content, 'new content2')
    await tap.equal(res1.body.items[1].content, 'new content1')
    await tap.equal(res1.body.items[2].content, 'last')
  })

  await tap.test('Order Notes by date updated - reversed', async () => {
    const res2 = await request(app)
      .get(`${readerUrl}/notes?orderBy=updated&reverse=true`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.body.items[0].content, 'first')
    await tap.equal(res2.body.items[1].content, 'second')
    await tap.equal(res2.body.items[2].content, 'third')
  })

  await destroyDB(app)
}

module.exports = test
