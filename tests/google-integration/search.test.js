const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl,
  createTag,
  addPubToCollection
} = require('../utils/utils')

const { urlToId } = require('../../utils/utils')

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path

  // create publication
  const resActivity = await request(app)
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
  const publicationUrl = urlparse(pubActivityObject.object.id).path
  const publicationId = urlToId(pubActivityObject.object.id)
  let path = 'very/long/path/to/some/random/useless/file'

  // create second publication
  const resActivity2 = await request(app)
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
  const publicationUrl2 = urlparse(pubActivityObject2.object.id).path
  const publicationId2 = urlToId(pubActivityObject2.object.id)

  // upload files to publication 1:
  // doc1 contains 'top hat'
  const res1 = await request(app)
    .post(`${publicationUrl}/file-upload`)
    .set('Authorization', `Bearer ${token}`)
    .field('name', 'file')
    .field('documentPath', path)
    .field('mediaType', 'text/html')
    .attach('file', 'tests/test-files/file1.html')

  const docId1 = urlToId(res1.body.id)

  // doc2 contains 'hat'
  const res2 = await request(app)
    .post(`${publicationUrl}/file-upload`)
    .set('Authorization', `Bearer ${token}`)
    .field('name', 'file')
    .field('documentPath', path)
    .field('mediaType', 'text/html')
    .attach('file', 'tests/test-files/file2.html')

  const docId2 = urlToId(res2.body.id)

  // and then to publication2:

  // doc3 contains 'top hat'
  const res3 = await request(app)
    .post(`${publicationUrl2}/file-upload`)
    .set('Authorization', `Bearer ${token}`)
    .field('name', 'file')
    .field('documentPath', path)
    .field('mediaType', 'application/xhtml+xml')
    .attach('file', 'tests/test-files/file3.html')

  const docId3 = urlToId(res3.body.id)

  // doc4 does not contain the word hat
  await request(app)
    .post(`${publicationUrl2}/file-upload`)
    .set('Authorization', `Bearer ${token}`)
    .field('name', 'file')
    .field('documentPath', path)
    .field('mediaType', 'application/xhtml+xml')
    .attach('file', 'tests/test-files/file4.html')

  let docId5 // to be used later

  await sleep(6000)

  await tap.test('simple search', async () => {
    const res = await request(app).get(`${readerUrl}/search?search=hat`)
    const body = res.body

    await tap.equal(body.hits.total.value, 3)
    // make sure the documents are those expected
    const expectedDocuments = [docId1, docId2, docId3]
    await tap.notEqual(
      expectedDocuments.indexOf(body.hits.hits[0]._source.documentId),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(body.hits.hits[1]._source.documentId),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(body.hits.hits[2]._source.documentId),
      -1
    )

    // make sure the highlight is working
    const expectedHighlight = '<mark>hat</mark>'
    await tap.ok(
      body.hits.hits[0].highlight.content[0].includes(expectedHighlight)
    )
    await tap.ok(
      body.hits.hits[1].highlight.content[0].includes(expectedHighlight)
    )
    await tap.ok(
      body.hits.hits[2].highlight.content[0].includes(expectedHighlight)
    )
  })

  await tap.test('search for phrase, not exact', async () => {
    const res = await request(app).get(`${readerUrl}/search?search=top%20hat`)

    const body = res.body
    await tap.equal(body.hits.total.value, 3)
    // make sure the documents are those expected
    const expectedDocuments = [docId1, docId3]
    await tap.notEqual(
      expectedDocuments.indexOf(body.hits.hits[0]._source.documentId),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(body.hits.hits[1]._source.documentId),
      -1
    )
    // doc3 should be last because it only matches 'hat' and not 'top'
    await tap.equal(body.hits.hits[2]._source.documentId, docId2)

    // make sure the highlight is working
    const expectedHighlight = '<mark>hat</mark>'
    await tap.ok(
      body.hits.hits[0].highlight.content[0].includes(expectedHighlight)
    )
    await tap.ok(
      body.hits.hits[1].highlight.content[0].includes(expectedHighlight)
    )
    await tap.ok(
      body.hits.hits[2].highlight.content[0].includes(expectedHighlight)
    )
  })

  await tap.test('search for phrase, exact', async () => {
    const res = await request(app).get(
      `${readerUrl}/search?search=top%20hat&exact=true`
    )

    const body = res.body
    await tap.equal(body.hits.total.value, 2)
    // make sure the documents are those expected
    const expectedDocuments = [docId1, docId3]
    await tap.notEqual(
      expectedDocuments.indexOf(body.hits.hits[0]._source.documentId),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(body.hits.hits[1]._source.documentId),
      -1
    )

    // make sure the highlight is working
    const expectedHighlight = '<mark>top</mark> <mark>hat</mark>'
    await tap.ok(
      body.hits.hits[0].highlight.content[0].includes(expectedHighlight)
    )
    await tap.ok(
      body.hits.hits[1].highlight.content[0].includes(expectedHighlight)
    )
  })

  await tap.test('search by publication', async () => {
    const res = await request(app).get(
      `${readerUrl}/search?search=hat&publication=${publicationId}`
    )

    const body = res.body
    await tap.equal(body.hits.total.value, 2)
    // make sure the documents are those expected
    const expectedDocuments = [docId1, docId2]
    await tap.notEqual(
      expectedDocuments.indexOf(body.hits.hits[0]._source.documentId),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(body.hits.hits[1]._source.documentId),
      -1
    )

    // make sure the highlight is working
    const expectedHighlight = '<mark>hat</mark>'
    await tap.ok(
      body.hits.hits[0].highlight.content[0].includes(expectedHighlight)
    )
    await tap.ok(
      body.hits.hits[1].highlight.content[0].includes(expectedHighlight)
    )
  })

  await tap.test('search by collection', async () => {
    // create third publication
    const resActivity3 = await request(app)
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

    const pubActivityUrl3 = resActivity3.get('Location')
    const pubActivityObject3 = await getActivityFromUrl(
      app,
      pubActivityUrl3,
      token
    )
    const publicationUrl3 = urlparse(pubActivityObject3.object.id).path
    const publicationId3 = urlToId(pubActivityObject3.object.id)

    // upload files to publication 3:

    // doc5 contains 'top hat'
    const res5 = await request(app)
      .post(`${publicationUrl3}/file-upload`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'file')
      .field('documentPath', path)
      .field('mediaType', 'application/xhtml+xml')
      .attach('file', 'tests/test-files/file3.html')

    docId5 = urlToId(res5.body.id)

    // doc6 does not contain the word hat
    await request(app)
      .post(`${publicationUrl3}/file-upload`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'file')
      .field('documentPath', path)
      .field('mediaType', 'application/xhtml+xml')
      .attach('file', 'tests/test-files/file4.html')

    await sleep(6000)

    // create collection:
    const stackRes = await createTag(app, token, readerUrl, { name: 'my_test' })
    const stackActivityUrl = stackRes.get('Location')
    const stackActivityObject = await getActivityFromUrl(
      app,
      stackActivityUrl,
      token
    )
    stack = stackActivityObject.object

    // add publication1 and publication3 to collection:
    await addPubToCollection(app, token, readerUrl, publicationId, stack.id)
    await addPubToCollection(app, token, readerUrl, publicationId3, stack.id)

    // search by collection
    const res = await request(app).get(
      `${readerUrl}/search?search=hat&collection=my_test`
    )

    const body = res.body
    await tap.equal(res.body.hits.total.value, 3)

    const expectedDocuments = [docId1, docId2, docId5]
    await tap.notEqual(
      expectedDocuments.indexOf(body.hits.hits[0]._source.documentId),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(body.hits.hits[1]._source.documentId),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(body.hits.hits[2]._source.documentId),
      -1
    )
  })

  await tap.test('Search after publication is deleted', async () => {
    // delete publication2
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
          type: 'Delete',
          object: {
            type: 'Publication',
            id: publicationId2
          }
        })
      )

    await sleep(3000)
    const res = await request(app).get(`${readerUrl}/search?search=hat`)

    const body = res.body

    await tap.equal(body.hits.total.value, 3)
    // make sure the documents are those expected
    const expectedDocuments = [docId1, docId2, docId5]
    await tap.notEqual(
      expectedDocuments.indexOf(body.hits.hits[0]._source.documentId),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(body.hits.hits[1]._source.documentId),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(body.hits.hits[2]._source.documentId),
      -1
    )
  })

  await destroyDB(app)
  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
}

module.exports = test
