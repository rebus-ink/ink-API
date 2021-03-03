const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource
} = require('../../utils/testUtils')
const _ = require('lodash')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const now = new Date().toISOString()

  const sourceObject = {
    type: 'Book',
    name: 'Source A',
    author: ['John Smith'],
    editor: 'Jané S. Doe',
    contributor: ['Sample Contributor'],
    creator: ['Sample Creator'],
    illustrator: ['Sample Illustrator'],
    publisher: ['Sample Publisher'],
    translator: ['Sample Translator'],
    abstract: 'this is a description!!',
    numberOfPages: 250,
    encodingFormat: 'epub',
    inLanguage: 'en',
    url: 'http://www.something.com',
    dateModified: now,
    bookEdition: 'third',
    bookFormat: 'EBook',
    isbn: '1234',
    copyrightYear: 1977,
    genre: 'vampire romance',
    license: 'http://www.mylicense.com',
    datePublished: now,
    links: [
      {
        url: 'http://example.org/abc',
        encodingFormat: 'text/html',
        name: 'An example link'
      }
    ],
    readingOrder: [
      {
        url: 'http://example.org/abc',
        encodingFormat: 'text/html',
        name: 'An example reading order object1'
      },
      {
        url: 'http://example.org/abc',
        encodingFormat: 'text/html',
        name: 'An example reading order object2'
      },
      {
        url: 'http://example.org/abc',
        encodingFormat: 'text/html',
        name: 'An example reading order object3'
      }
    ],
    resources: [
      {
        url: 'http://example.org/abc',
        encodingFormat: 'text/html',
        name: 'An example resource'
      }
    ],
    json: { property: 'value' },
    citation: { default: '123' },
    pagination: '100-101',
    isPartOf: {
      title: 'journal of something',
      datePublished: now,
      issueNumber: '1',
      volumeNumber: '2'
    }
  }

  const resCreateSource = await createSource(app, token, sourceObject)
  const sourceUrl = resCreateSource.id
  const sourceId = urlToId(sourceUrl)

  await tap.test('Get Source', async () => {
    const res = await request(app)
      .get(`/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.ok(body.id.endsWith('/'))
    await tap.ok(body.id.startsWith('https://reader-api.test/sources/'))
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.ok(urlToId(body.id).startsWith(urlToId(body.readerId))) // check that id contains readerId
    await tap.equal(body.type, 'Book')
    await tap.equal(body.name, 'Source A')
    await tap.ok(_.isArray(body.author))
    await tap.equal(body.author[0].name, 'John Smith')
    await tap.equal(body.editor[0].name, 'Jané S. Doe')
    await tap.equal(body.contributor[0].name, 'Sample Contributor')
    await tap.equal(body.creator[0].name, 'Sample Creator')
    await tap.equal(body.illustrator[0].name, 'Sample Illustrator')
    await tap.equal(body.publisher[0].name, 'Sample Publisher')
    await tap.equal(body.translator[0].name, 'Sample Translator')
    await tap.equal(body.abstract, 'this is a description!!')
    await tap.ok(body.datePublished)
    await tap.equal(body.links[0].name, 'An example link')
    await tap.equal(
      body.readingOrder[1].name,
      'An example reading order object2'
    )
    await tap.equal(body.resources[0].name, 'An example resource')
    await tap.equal(body.json.property, 'value')
    await tap.ok(body.readerId)
    await tap.ok(body.published)
    await tap.ok(body.updated)
    await tap.equal(body.inLanguage[0], 'en')
    await tap.equal(body.numberOfPages, 250)
    await tap.equal(body.encodingFormat, 'epub')
    await tap.equal(body.url, 'http://www.something.com')
    await tap.ok(body.dateModified)
    await tap.equal(body.bookEdition, 'third')
    await tap.equal(body.bookFormat, 'EBook')
    await tap.equal(body.isbn, '1234')
    await tap.equal(body.copyrightYear, 1977)
    await tap.equal(body.genre, 'vampire romance')
    await tap.equal(body.license, 'http://www.mylicense.com')
    await tap.ok(body.citation)
    await tap.equal(body.citation.default, '123')
    await tap.equal(body.pagination, '100-101')
    await tap.ok(body.isPartOf)
    await tap.equal(body.isPartOf.title, 'journal of something')
    await tap.equal(body.isPartOf.issueNumber, '1')
    await tap.equal(body.isPartOf.volumeNumber, '2')
    await tap.ok(body.isPartOf.datePublished)
  })

  await tap.test('Get Source with a readActivity', async () => {
    const activity1 = await request(app)
      .post(`/sources/${sourceId}/readActivity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          selector: {
            type: 'XPathSelector',
            value: '/html/body/p[2]/table/tr[2]/td[3]/span',
            property: 'last'
          }
        })
      )

    await tap.equal(activity1.statusCode, 201)

    const activity2 = await request(app)
      .post(`/sources/${sourceId}/readActivity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          selector: {
            type: 'XPathSelector',
            value: '/html/body/p[2]/table/tr[2]/td[3]/span',
            property: 'last'
          }
        })
      )
    await tap.equal(activity1.statusCode, 201)
    const activityId2 = activity2.body.id

    // get source with readActivity:
    const res = await request(app)
      .get(`/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.type, 'Book')
    await tap.equal(body.name, 'Source A')
    await tap.ok(body.lastReadActivity)
    await tap.equal(body.lastReadActivity.id, activityId2)
  })

  await tap.test('Try to get Source that does not exist', async () => {
    const res = await request(app)
      .get(`/sources/123`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.message, `No Source found with id 123`)
    await tap.equal(error.details.requestUrl, '/sources/123')
  })

  await destroyDB(app)
}

module.exports = test
