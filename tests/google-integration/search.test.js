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

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const test = async app => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path

  // upload files:
  // publication1 has two documents:
  //    doc1 contains 'silly hat'
  //    doc2 contains 'hat'
  // will be in collection my_test
  const res1 = await request(app)
    .post(`${readerUrl}/file-upload-pub`)
    .set('Authorization', `Bearer ${token}`)
    .field('name', 'file')
    .attach('file', 'tests/test-files/epub1.epub')
  // publication2 has two documents:
  //   doc1 contains 'silly hat'
  //   doc2 contains neither 'silly' nor 'hat'
  // not in any collection
  //  await sleep(5000)
  const res2 = await request(app)
    .post(`${readerUrl}/file-upload-pub`)
    .set('Authorization', `Bearer ${token}`)
    .field('name', 'file')
    .attach('file', 'tests/test-files/epub2.epub')

  //  await sleep(5000)
  // publication3 has two documents:
  //   doc1 contains 'silly hat'
  //   doc2 contains neither 'silly' nor 'hat'
  // will be in collection my_test
  const res3 = await request(app)
    .post(`${readerUrl}/file-upload-pub`)
    .set('Authorization', `Bearer ${token}`)
    .field('name', 'file')
    .attach('file', 'tests/test-files/epub2.epub')

  await sleep(20000)

  // create collection:
  const stackRes = await createTag(app, token, readerUrl, { name: 'my_test' })
  const stackActivityUrl = stackRes.get('Location')
  const stackActivityObject = await getActivityFromUrl(
    app,
    stackActivityUrl,
    token
  )
  const stack = stackActivityObject.object

  // get jobs to get publicationIds
  const job1 = await request(app)
    .get(`/job-${res1.body.id}`)
    .set('Authorization', `Bearer ${token}`)
  const publicationId = job1.body.publicationId

  const job2 = await request(app)
    .get(`/job-${res2.body.id}`)
    .set('Authorization', `Bearer ${token}`)
  const publicationId2 = job2.body.publicationId

  const job3 = await request(app)
    .get(`/job-${res3.body.id}`)
    .set('Authorization', `Bearer ${token}`)
  const publicationId3 = job3.body.publicationId

  await addPubToCollection(app, token, readerUrl, publicationId, stack.id)
  await addPubToCollection(app, token, readerUrl, publicationId3, stack.id)

  // for testing purposes, we will compare the search results to the expected
  // results, as defined by their publicationId and their path
  // here I will concatenate them for easy comparison.

  // pub1, chapter 1, etc.
  const pub1ch1 = `${publicationId}-EPUB/text/ch001.xhtml`
  const pub1ch2 = `${publicationId}-EPUB/text/ch002.xhtml`
  const pub2ch1 = `${publicationId2}-EPUB/text/ch001.xhtml`
  const pub3ch1 = `${publicationId3}-EPUB/text/ch001.xhtml`

  await sleep(6000)

  await tap.test('simple search', async () => {
    const res = await request(app).get(`${readerUrl}/search?search=hat`)
    const body = res.body
    await tap.equal(body.hits.total.value, 4)
    // make sure the documents are those expected
    const expectedDocuments = [pub1ch1, pub1ch2, pub2ch1, pub3ch1]
    const hit1 = body.hits.hits[0]._source
    const hit2 = body.hits.hits[1]._source
    const hit3 = body.hits.hits[2]._source
    const hit4 = body.hits.hits[3]._source

    await tap.notEqual(
      expectedDocuments.indexOf(`${hit1.publicationId}-${hit1.documentPath}`),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(`${hit2.publicationId}-${hit2.documentPath}`),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(`${hit3.publicationId}-${hit3.documentPath}`),
      -1
    )

    await tap.notEqual(
      expectedDocuments.indexOf(`${hit4.publicationId}-${hit4.documentPath}`),
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
    await tap.ok(
      body.hits.hits[3].highlight.content[0].includes(expectedHighlight)
    )
  })

  await tap.test('search for phrase, not exact', async () => {
    const res = await request(app).get(`${readerUrl}/search?search=silly%20hat`)

    const body = res.body
    await tap.equal(body.hits.total.value, 4)
    // make sure the documents are those expected
    const expectedDocuments = [pub1ch1, pub2ch1, pub3ch1]
    const hit1 = body.hits.hits[0]._source
    const hit2 = body.hits.hits[1]._source
    const hit3 = body.hits.hits[2]._source
    const hit4 = body.hits.hits[3]._source

    await tap.notEqual(
      expectedDocuments.indexOf(`${hit1.publicationId}-${hit1.documentPath}`),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(`${hit2.publicationId}-${hit2.documentPath}`),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(`${hit3.publicationId}-${hit3.documentPath}`),
      -1
    )
    // doc3 should be last because it only matches 'hat' and not 'silly'
    await tap.equal(`${hit4.publicationId}-${hit4.documentPath}`, pub1ch2)

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
    await tap.ok(
      body.hits.hits[3].highlight.content[0].includes(expectedHighlight)
    )
  })

  await tap.test('search for phrase, exact', async () => {
    const res = await request(app).get(
      `${readerUrl}/search?search=silly%20hat&exact=true`
    )

    const body = res.body
    await tap.equal(body.hits.total.value, 3)
    // make sure the documents are those expected
    const expectedDocuments = [pub1ch1, pub2ch1, pub3ch1]

    const hit1 = body.hits.hits[0]._source
    const hit2 = body.hits.hits[1]._source
    const hit3 = body.hits.hits[2]._source

    await tap.notEqual(
      expectedDocuments.indexOf(`${hit1.publicationId}-${hit1.documentPath}`),
      -1
    )

    await tap.notEqual(
      expectedDocuments.indexOf(`${hit2.publicationId}-${hit2.documentPath}`),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(`${hit3.publicationId}-${hit3.documentPath}`),
      -1
    )

    // make sure the highlight is working
    const expectedHighlight = '<mark>silly</mark> <mark>hat</mark>'
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

  await tap.test('search by publication', async () => {
    const res = await request(app).get(
      `${readerUrl}/search?search=hat&publication=${publicationId}`
    )

    const body = res.body
    await tap.equal(body.hits.total.value, 2)
    // make sure the documents are those expected
    const expectedDocuments = [pub1ch1, pub1ch2]
    const hit1 = body.hits.hits[0]._source
    const hit2 = body.hits.hits[1]._source

    await tap.notEqual(
      expectedDocuments.indexOf(`${hit1.publicationId}-${hit1.documentPath}`),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(`${hit2.publicationId}-${hit2.documentPath}`),
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
    // search by collection
    const res = await request(app).get(
      `${readerUrl}/search?search=hat&collection=my_test`
    )

    const body = res.body
    await tap.equal(res.body.hits.total.value, 3)

    const expectedDocuments = [pub1ch1, pub1ch2, pub3ch1]
    const hit1 = body.hits.hits[0]._source
    const hit2 = body.hits.hits[1]._source
    const hit3 = body.hits.hits[2]._source

    await tap.notEqual(
      expectedDocuments.indexOf(`${hit1.publicationId}-${hit1.documentPath}`),
      -1
    )

    await tap.notEqual(
      expectedDocuments.indexOf(`${hit2.publicationId}-${hit2.documentPath}`),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(`${hit3.publicationId}-${hit3.documentPath}`),
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
    const expectedDocuments = [pub1ch1, pub1ch2, pub3ch1]
    const hit1 = body.hits.hits[0]._source
    const hit2 = body.hits.hits[1]._source
    const hit3 = body.hits.hits[2]._source

    await tap.notEqual(
      expectedDocuments.indexOf(`${hit1.publicationId}-${hit1.documentPath}`),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(`${hit2.publicationId}-${hit2.documentPath}`),
      -1
    )
    await tap.notEqual(
      expectedDocuments.indexOf(`${hit3.publicationId}-${hit3.documentPath}`),
      -1
    )
  })

  // not part of the tests, deleting other publications to limit the junk stored in elasticsearch
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
          id: publicationId
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
        type: 'Delete',
        object: {
          type: 'Publication',
          id: publicationId3
        }
      })
    )

  await destroyDB(app)
}

module.exports = test
