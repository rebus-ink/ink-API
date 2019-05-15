const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl
} = require('./utils')
const { Document } = require('../../models/Document')
const { urlToId } = require('../../routes/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const userId = await createUser(app, token)
  const userUrl = urlparse(userId).path

  const resActivity = await request(app)
    .post(`${userUrl}/activity`)
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
        type: 'Create',
        object: {
          type: 'Publication',
          name: 'Publication A',
          author: ['John Smith'],
          editor: 'Jane Doe',
          description: 'this is a description!!',
          links: [{ property: 'value' }],
          readingOrder: [{ name: 'one' }, { name: 'two' }, { name: 'three' }],
          resources: [{ property: 'value' }],
          json: { property: 'value' }
        }
      })
    )

  const pubActivityUrl = resActivity.get('Location')
  const pubActivityObject = await getActivityFromUrl(app, pubActivityUrl, token)
  const publicationUrl = pubActivityObject.object.id

  const resPublication = await request(app)
    .get(urlparse(publicationUrl).path)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

  // create another publication
  const resActivity2 = await request(app)
    .post(`${userUrl}/activity`)
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
        type: 'Create',
        object: {
          type: 'Publication',
          name: 'Publication B',
          author: ['John Smith'],
          editor: 'Jane Doe',
          description: 'this is a description!!',
          links: [{ property: 'value' }],
          readingOrder: [{ name: 'one' }, { name: 'two' }, { name: 'three' }],
          resources: [{ property: 'value' }],
          json: { property: 'value' }
        }
      })
    )

  const pubActivityUrl2 = resActivity2.get('Location')
  const pubActivityObject2 = await getActivityFromUrl(
    app,
    pubActivityUrl2,
    token
  )
  const publicationUrl2 = pubActivityObject2.object.id

  const resPublication2 = await request(app)
    .get(urlparse(publicationUrl2).path)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

  // creating a document - this will not be exposed to the users. It will be done as part of the upload
  const createdDocument = await Document.createDocument(
    { id: urlToId(userId) },
    urlToId(resPublication.body.id),
    {
      documentPath: '/path/1',
      mediaType: 'text/html',
      url: 'http://something/123'
    }
  )

  // creating a second document
  const createdDocument2 = await Document.createDocument(
    { id: urlToId(userId) },
    urlToId(resPublication2.body.id),
    {
      documentPath: '/path/2',
      mediaType: 'text/html',
      url: 'http://something/124'
    }
  )

  const documentUrl = `${publicationUrl}${createdDocument.documentPath}`
  const documentUrl2 = `${publicationUrl2}${createdDocument2.documentPath}`

  const createNote = async (
    pubId = publicationUrl,
    docUrl = documentUrl,
    type = 'test'
  ) => {
    return await request(app)
      .post(`${userUrl}/activity`)
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
          type: 'Create',
          object: {
            type: 'Note',
            content: 'This is the content of note A.',
            'oa:hasSelector': { propety: 'value' },
            context: pubId,
            inReplyTo: docUrl,
            noteType: type,
            json: { property1: 'value1' }
          }
        })
      )
  }

  await tap.test('Get all notes for a reader', async () => {
    // create more notes
    await createNote()
    await createNote()
    await createNote()

    const res = await request(app)
      .get(`${userUrl}/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.equal(body.totalItems, 3)
    await tap.equal(body.items.length, 3)
    await tap.equal(body.items[0].type, 'Note')

    // should work with pagination

    await createNote() // 4
    await createNote() // 5
    await createNote() // 6
    await createNote() // 7
    await createNote() // 8
    await createNote() // 9
    await createNote() // 10
    await createNote() // 11
    await createNote() // 12
    await createNote() // 13

    const res2 = await request(app)
      .get(`${userUrl}/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.status, 200)
    await tap.equal(res2.body.totalItems, 10)
    await tap.equal(res2.body.items.length, 10)

    const res3 = await request(app)
      .get(`${userUrl}/notes?page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.status, 200)
    await tap.equal(res3.body.totalItems, 3)
    await tap.equal(res3.body.items.length, 3)

    const res4 = await request(app)
      .get(`${userUrl}/notes?limit=11&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res4.status, 200)
    await tap.equal(res4.body.totalItems, 2)
    await tap.equal(res4.body.items.length, 2)
  })

  await tap.test('Get all notes for a reader filtered by pub', async () => {
    // create more notes for another pub
    await createNote(publicationUrl2, documentUrl2)
    await createNote(publicationUrl2, documentUrl2)

    const res = await request(app)
      .get(`${userUrl}/notes?publicationId=${publicationUrl2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    const body = res.body

    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.equal(body.items[0].type, 'Note')

    // should work with pagination
    await createNote(publicationUrl2, documentUrl2) // 3
    await createNote(publicationUrl2, documentUrl2) // 4
    await createNote(publicationUrl2, documentUrl2) // 5
    await createNote(publicationUrl2, documentUrl2) // 6
    await createNote(publicationUrl2, documentUrl2) // 7
    await createNote(publicationUrl2, documentUrl2) // 8
    await createNote(publicationUrl2, documentUrl2) // 9
    await createNote(publicationUrl2, documentUrl2) // 10
    await createNote(publicationUrl2, documentUrl2) // 11
    await createNote(publicationUrl2, documentUrl2) // 12
    await createNote(publicationUrl2, documentUrl2) // 13

    const res2 = await request(app)
      .get(`${userUrl}/notes?publicationId=${urlToId(publicationUrl2)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.status, 200)
    await tap.equal(res2.body.totalItems, 10)
    await tap.equal(res2.body.items.length, 10)

    const res3 = await request(app)
      .get(`${userUrl}/notes?page=2&publicationId=${urlToId(publicationUrl2)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.status, 200)
    await tap.equal(res3.body.totalItems, 3)
    await tap.equal(res3.body.items.length, 3)

    const res4 = await request(app)
      .get(
        `${userUrl}/notes?limit=11&page=2&publicationId=${urlToId(
          publicationUrl2
        )}`
      )
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res4.status, 200)
    await tap.equal(res4.body.totalItems, 2)
    await tap.equal(res4.body.items.length, 2)
  })

  await tap.test('filter notes by documentUrl', async () => {
    const res = await request(app)
      .get(`${userUrl}/notes?document=${documentUrl2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.items.length, 10)

    const res2 = await request(app)
      .get(`${userUrl}/notes?document=${documentUrl2}&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.equal(res2.body.items.length, 3)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
