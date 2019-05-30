const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl,
  createPublication,
  createNote
} = require('../utils/utils')
const { Document } = require('../../models/Document')
const { urlToId } = require('../../utils/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path

  const resActivity = await createPublication(app, token, readerUrl, {
    name: 'Publication A'
  })

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
  const resActivity2 = await createPublication(app, token, readerUrl, {
    name: 'Publication B'
  })

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

  // creating a document - this will not be exposed to the readers. It will be done as part of the upload
  const createdDocument = await Document.createDocument(
    { id: urlToId(readerId) },
    urlToId(resPublication.body.id),
    {
      documentPath: '/path/1',
      mediaType: 'text/html',
      url: 'http://something/123'
    }
  )

  // creating a second document
  const createdDocument2 = await Document.createDocument(
    { id: urlToId(readerId) },
    urlToId(resPublication2.body.id),
    {
      documentPath: '/path/2',
      mediaType: 'text/html',
      url: 'http://something/124'
    }
  )

  const documentUrl = `${publicationUrl}${createdDocument.documentPath}`
  const documentUrl2 = `${publicationUrl2}${createdDocument2.documentPath}`

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

  await tap.test('Get all notes for a reader filtered by pub', async () => {
    // create more notes for another pub
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2
    })
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2
    })

    const res = await request(app)
      .get(`${readerUrl}/notes?publication=${publicationUrl2}`)
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
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2
    }) // 3
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2
    })
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2
    })
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2
    })
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2
    })
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2
    })
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2
    })
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2
    }) // 10
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2
    })
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2
    })
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2
    }) // 13

    const res2 = await request(app)
      .get(`${readerUrl}/notes?publication=${urlToId(publicationUrl2)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.status, 200)
    await tap.equal(res2.body.totalItems, 10)
    await tap.equal(res2.body.items.length, 10)

    const res3 = await request(app)
      .get(`${readerUrl}/notes?page=2&publication=${urlToId(publicationUrl2)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.status, 200)
    await tap.equal(res3.body.totalItems, 3)
    await tap.equal(res3.body.items.length, 3)

    const res4 = await request(app)
      .get(`${readerUrl}/notes?limit=11&page=2&publication=${publicationUrl2}`)
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
      .get(`${readerUrl}/notes?document=${documentUrl2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.items.length, 10)

    const res2 = await request(app)
      .get(`${readerUrl}/notes?document=${documentUrl2}&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.equal(res2.body.items.length, 3)
  })

  await tap.test('filter notes by noteType', async () => {
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2,
      noteType: 'new'
    })
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2,
      noteType: 'new'
    })

    const res = await request(app)
      .get(`${readerUrl}/notes?type=new`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.items.length, 2)

    // combine with pubid filter
    await createNoteSimplified({ noteType: 'new' })

    const res2 = await request(app)
      .get(`${readerUrl}/notes?type=new&publication=${publicationUrl2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.equal(res2.body.items.length, 2)
  })

  await tap.test('search note content', async () => {
    await createNoteSimplified({
      noteType: 'test',
      content: 'this string contains abc and other things'
    })
    await createNoteSimplified({
      noteType: 'test',
      content: 'this string contains ABCD and other things'
    })
    await createNoteSimplified({
      noteType: 'test2',
      content: 'this string contains XYABC and other things'
    })
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2,
      noteType: 'test',
      content: 'abc'
    })

    const res = await request(app)
      .get(`${readerUrl}/notes?search=abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.items.length, 4)

    // should combine with other filters:
    const res2 = await request(app)
      .get(`${readerUrl}/notes?search=abc&type=test2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.equal(res2.body.items.length, 1)

    const res3 = await request(app)
      .get(`${readerUrl}/notes?search=abc&document=${documentUrl}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.status, 200)
    await tap.ok(res3.body)
    await tap.equal(res3.body.items.length, 3)
  })
  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
