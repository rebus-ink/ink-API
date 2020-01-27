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

  const publication = await createPublication(urlToId(readerId), {
    name: 'Publication A'
  })
  const publicationUrl = publication.id
  const publicationId = urlToId(publication.id)

  const createdDocument = await createDocument(readerId, publicationUrl, {
    documentPath: 'path/1',
    mediaType: 'text/html',
    url: 'http://something/123'
  })

  const documentUrl = `${publicationUrl}/${createdDocument.documentPath}`

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      { documentUrl, publicationId, body: { motivation: 'test' } },
      object
    )
    return await createNote(app, token, urlToId(readerId), noteObj)
  }

  await tap.test('Get empty list of notes', async () => {
    const res = await request(app)
      .get('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 200)
    const body = res.body
    await tap.equal(body.totalItems, 0)
    await tap.equal(body.items.length, 0)
  })

  await tap.test('Get all notes for a Reader', async () => {
    // create more notes
    await createNoteSimplified({
      body: { content: 'first', motivation: 'test' }
    })
    await createNoteSimplified({
      body: { content: 'second', motivation: 'test' }
    })
    await createNoteSimplified({
      body: { content: 'third', motivation: 'test' }
    })

    const res = await request(app)
      .get('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.equal(body.totalItems, 3)
    await tap.equal(body.items.length, 3)
    const firstItem = body.items[0]
    await tap.ok(firstItem.body)
    await tap.ok(firstItem.body.content)
    await tap.equal(firstItem.body.motivation, 'test')
    await tap.ok(firstItem.publicationId)
    await tap.ok(firstItem.documentUrl)
    // notes should include publication information
    await tap.ok(firstItem.publication)
    await tap.type(firstItem.publication.name, 'string')
    await tap.ok(firstItem.publication.author)
    await tap.type(firstItem.publication.author[0].name, 'string')
  })

  await tap.test(
    'Should also include notes without a publicationId',
    async () => {
      await createNote(app, token, urlToId(readerId), {
        body: { motivation: 'test' }
      })

      const res = await request(app)
        .get('/notes')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      const body = res.body
      await tap.equal(body.totalItems, 4)
      await tap.equal(body.items.length, 4)
    }
  )

  await destroyDB(app)
}

module.exports = test
