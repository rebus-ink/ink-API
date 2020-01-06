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
  const readerUrl = urlparse(readerCompleteUrl).path
  const readerId = urlToId(readerCompleteUrl)

  // Create Reader object
  const person = {
    name: 'J. Random Reader'
  }

  await Reader.createReader(readerId, person)

  // reader2
  const token2 = getToken()
  const readerCompleteUrl2 = await createUser(app, token2)
  const readerUrl2 = urlparse(readerCompleteUrl2).path

  // create publication and tag for reader 1

  const tag = await createTag(app, token)
  const tagId = urlToId(tag.id)

  // create publication and tag for reader 2
  const publication2 = await createPublication(readerCompleteUrl2)
  publicationId2 = urlToId(publication2.id)

  // create Note for reader 1
  const noteActivity = await createNote(app, token, readerId)
  const noteActivityUrl = noteActivity.get('Location')

  await tap.test('Requests without authentication', async () => {
    // outbox
    const res1 = await request(app)
      .get(`/reader-${readerId}/activity`)
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res1.statusCode, 401)

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

    // activity
    const res6 = await request(app)
      .get(urlparse(noteActivityUrl).path)
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res6.statusCode, 401)

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
  })

  await destroyDB(app)
}

module.exports = test
