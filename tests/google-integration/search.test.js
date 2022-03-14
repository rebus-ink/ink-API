const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
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
  // source1 has two documents:
  //    doc1 contains 'silly hat'
  //    doc2 contains 'hat'
  // will be in collection my_test
  const res1 = await request(app)
    .post(`${readerUrl}/file-upload-pub`)
    .set('Authorization', `Bearer ${token}`)
    .field('name', 'file')
    .attach('file', 'tests/test-files/epub1.epub')
  // source2 has two documents:
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
  // source3 has two documents:
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
  const stack = await createTag(app, token, { name: 'my_test' })

  // get jobs to get sourceIds
  const job1 = await request(app)
    .get(`/job-${res1.body.id}`)
    .set('Authorization', `Bearer ${token}`)
  const sourceId = job1.body.sourceId

  const job2 = await request(app)
    .get(`/job-${res2.body.id}`)
    .set('Authorization', `Bearer ${token}`)
  const sourceId2 = job2.body.sourceId

  const job3 = await request(app)
    .get(`/job-${res3.body.id}`)
    .set('Authorization', `Bearer ${token}`)
  const sourceId3 = job3.body.sourceId

  await addPubToCollection(app, token, sourceId, stack.id)
  await addPubToCollection(app, token, sourceId3, stack.id)

  // for testing purposes, we will compare the search results to the expected
  // results, as defined by their sourceId and their path
  // here I will concatenate them for easy comparison.

  // pub1, chapter 1, etc.
  const pub1ch1 = `${sourceId}-EPUB/text/ch001.xhtml`
  const pub1ch2 = `${sourceId}-EPUB/text/ch002.xhtml`
  const pub2ch1 = `${sourceId2}-EPUB/text/ch001.xhtml`
  const pub3ch1 = `${sourceId3}-EPUB/text/ch001.xhtml`

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

    await tap.not(
      expectedDocuments.indexOf(`${hit1.sourceId}-${hit1.documentPath}`),
      -1
    )
    await tap.not(
      expectedDocuments.indexOf(`${hit2.sourceId}-${hit2.documentPath}`),
      -1
    )
    await tap.not(
      expectedDocuments.indexOf(`${hit3.sourceId}-${hit3.documentPath}`),
      -1
    )

    await tap.not(
      expectedDocuments.indexOf(`${hit4.sourceId}-${hit4.documentPath}`),
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

    await tap.not(
      expectedDocuments.indexOf(`${hit1.sourceId}-${hit1.documentPath}`),
      -1
    )
    await tap.not(
      expectedDocuments.indexOf(`${hit2.sourceId}-${hit2.documentPath}`),
      -1
    )
    await tap.not(
      expectedDocuments.indexOf(`${hit3.sourceId}-${hit3.documentPath}`),
      -1
    )
    // doc3 should be last because it only matches 'hat' and not 'silly'
    await tap.equal(`${hit4.sourceId}-${hit4.documentPath}`, pub1ch2)

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

    await tap.not(
      expectedDocuments.indexOf(`${hit1.sourceId}-${hit1.documentPath}`),
      -1
    )

    await tap.not(
      expectedDocuments.indexOf(`${hit2.sourceId}-${hit2.documentPath}`),
      -1
    )
    await tap.not(
      expectedDocuments.indexOf(`${hit3.sourceId}-${hit3.documentPath}`),
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

  await tap.test('search by source', async () => {
    const res = await request(app).get(
      `${readerUrl}/search?search=hat&source=${sourceId}`
    )

    const body = res.body
    await tap.equal(body.hits.total.value, 2)
    // make sure the documents are those expected
    const expectedDocuments = [pub1ch1, pub1ch2]
    const hit1 = body.hits.hits[0]._source
    const hit2 = body.hits.hits[1]._source

    await tap.not(
      expectedDocuments.indexOf(`${hit1.sourceId}-${hit1.documentPath}`),
      -1
    )
    await tap.not(
      expectedDocuments.indexOf(`${hit2.sourceId}-${hit2.documentPath}`),
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

    await tap.not(
      expectedDocuments.indexOf(`${hit1.sourceId}-${hit1.documentPath}`),
      -1
    )

    await tap.not(
      expectedDocuments.indexOf(`${hit2.sourceId}-${hit2.documentPath}`),
      -1
    )
    await tap.not(
      expectedDocuments.indexOf(`${hit3.sourceId}-${hit3.documentPath}`),
      -1
    )
  })

  await tap.test('Search after source is deleted', async () => {
    // delete source2
    await request(app)
      .post(`${readerUrl}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          '@context': [{ reader: 'https://rebus.foundation/ns/reader' }],
          type: 'Delete',
          object: {
            type: 'Publication',
            id: sourceId2
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

    await tap.not(
      expectedDocuments.indexOf(`${hit1.sourceId}-${hit1.documentPath}`),
      -1
    )
    await tap.not(
      expectedDocuments.indexOf(`${hit2.sourceId}-${hit2.documentPath}`),
      -1
    )
    await tap.not(
      expectedDocuments.indexOf(`${hit3.sourceId}-${hit3.documentPath}`),
      -1
    )
  })

  // not part of the tests, deleting other sources to limit the junk stored in elasticsearch
  await request(app)
    .post(`${readerUrl}/activity`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
    .send(
      JSON.stringify({
        '@context': [{ reader: 'https://rebus.foundation/ns/reader' }],
        type: 'Delete',
        object: {
          type: 'Publication',
          id: sourceId
        }
      })
    )

  await request(app)
    .post(`${readerUrl}/activity`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
    .send(
      JSON.stringify({
        '@context': [{ reader: 'https://rebus.foundation/ns/reader' }],
        type: 'Delete',
        object: {
          type: 'Publication',
          id: sourceId3
        }
      })
    )

  await destroyDB(app)
}

module.exports = test
