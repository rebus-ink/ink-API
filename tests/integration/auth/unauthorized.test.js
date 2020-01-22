const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote,
  createTag
} = require('../../utils/testUtils')
const { Reader } = require('../../../models/Reader')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  // reader1
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerId = urlToId(readerCompleteUrl)

  // Create Reader object
  const person = {
    name: 'J. Random Reader'
  }

  await Reader.createReader(readerId, person)

  // reader2
  const token2 = getToken()
  const readerCompleteUrl2 = await createUser(app, token2)

  // create tag for reader 1

  const tag = await createTag(app, token)
  const tagId = urlToId(tag.id)

  // create publication for reader 2
  const publication2 = await createPublication(readerCompleteUrl2)
  publicationId2 = urlToId(publication2.id)

  // create Note for reader 1
  const note = await createNote(app, token, readerId)
  const noteId = urlToId(note.id)

  await tap.test('Requests without authentication', async () => {
    // reader
    const res2 = await request(app)
      .get(`/readers/${readerId}`)
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res2.statusCode, 401)

    const res3 = await request(app)
      .get('/whoami')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res3.statusCode, 401)

    // publication
    const res4 = await request(app)
      .get(`/publications/123`)
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res4.statusCode, 401)

    // file upload
    const res7 = await request(app)
      .post(`/reader-${readerId}/file-upload`)
      .set('Host', 'reader-api.test')
      .attach('files', 'tests/test-files/test-file3.txt')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res7.statusCode, 401)

    // post publication
    const res8 = await request(app)
      .post('/publications')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res8.statusCode, 401)

    // delete publication
    const res9 = await request(app)
      .delete(`/publications/123`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res9.statusCode, 401)

    // update publication
    const res10 = await request(app)
      .patch(`/publications/123`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res10.statusCode, 401)

    // add tag to publication
    const res11 = await request(app)
      .put(`/publications/123/tags/123`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res11.statusCode, 401)

    // remove tag from publication
    const res12 = await request(app)
      .delete(`/publications/123/tags/123`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res12.statusCode, 401)

    // get tags
    const res13 = await request(app)
      .get('/tags')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res13.statusCode, 401)
    // create a tag
    const res14 = await request(app)
      .post('/tags')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res14.statusCode, 401)

    // update a tag
    const res15 = await request(app)
      .patch(`/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res15.statusCode, 401)

    // delete tag
    const res16 = await request(app)
      .delete(`/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res16.statusCode, 401)

    // library
    const res17 = await request(app)
      .get(`/library`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res17.statusCode, 401)

    // readerNotes
    const res18 = await request(app)
      .get(`/notes`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res18.statusCode, 401)

    // job
    const res19 = await request(app)
      .get(`/jobs/123`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res19.statusCode, 401)

    // add tag to note
    const res20 = await request(app)
      .put(`/notes/123/tags/123`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res20.statusCode, 401)

    // remove tag from publication
    const res21 = await request(app)
      .delete(`/notes/123/tags/123`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res21.statusCode, 401)

    // readActivity
    const res22 = await request(app)
      .post('/publications/pub123/readActivity')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res22.statusCode, 401)
  })

  await destroyDB(app)
}

module.exports = test
