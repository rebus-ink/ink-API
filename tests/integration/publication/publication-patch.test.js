const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerId = urlToId(readerCompleteUrl)

  const now = new Date().toISOString()

  const publicationObject = {
    type: 'Book',
    name: 'Publication A',
    author: ['John Smith'],
    editor: 'Jané S. Doe',
    contributor: ['Sample Contributor'],
    creator: ['Sample Creator'],
    illustrator: ['Sample Illustrator'],
    publisher: ['Sample Publisher'],
    translator: ['Sample Translator'],
    abstract: 'this is a description!!',
    inLanguage: ['en'],
    url: 'http://www.something.com',
    dateModified: now,
    bookEdition: 'third',
    bookFormat: 'EBook',
    keywords: ['one', 'two'],
    isbn: '1234',
    copyrightYear: 1977,
    genre: 'vampire romance',
    license: 'http://www.mylicense.com',
    numberOfPages: 333,
    encodingFormat: 'epub',
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
    json: { property: 'value' }
  }

  const resCreatePub = await createPublication(readerId, publicationObject)
  const publicationUrl = resCreatePub.id
  const publicationId = urlToId(publicationUrl)

  await tap.test('Update a Publication', async () => {
    // const timestamp = new Date(2018, 01, 30).toISOString()
    const res = await request(app)
      .patch(`/publications/${publicationId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          type: 'Article',
          name: 'New name for pub A',
          // datePublished: timestamp,
          abstract: 'New description for Publication',
          numberOfPages: 444,
          encodingFormat: 'new',
          json: { property: 'New value for json property' },
          inLanguage: ['en', 'fr'],
          url: 'http://www.something2.com',
          dateModified: new Date(2012, 3, 22).toISOString(),
          bookEdition: 'fourth',
          bookFormat: 'Paperback',
          isbn: '12345',
          copyrightYear: 1978,
          genre: 'elf romance',
          license: 'http://www.mylicense2.com',
          keywords: ['newKeyWord1', 'newKeyWord2'],
          author: [
            { type: 'Person', name: 'New Sample Author' },
            { type: 'Organization', name: 'New Org inc.' }
          ],
          editor: [{ type: 'Person', name: 'New Sample Editor' }],
          contributor: ['Sample Contributor2'],
          // creator: ['Sample Creator2'], // making sure that non-updated attributions are returned too!
          illustrator: ['Sample Illustrator2'],
          publisher: ['Sample Publisher2'],
          translator: ['Sample Translator2']
        })
      )
    await tap.equal(res.status, 200)
    const body = res.body
    await tap.equal(body.name, 'New name for pub A')
    await tap.equal(body.abstract, 'New description for Publication')
    // await tap.equal(body.datePublished, timestamp)
    await tap.equal(body.json.property, 'New value for json property')
    await tap.equal(body.numberOfPages, 444)
    await tap.equal(body.encodingFormat, 'new')
    await tap.equal(body.url, 'http://www.something2.com')
    await tap.equal(body.dateModified, new Date(2012, 3, 22).toISOString())
    await tap.equal(body.bookEdition, 'fourth')
    await tap.equal(body.isbn, '12345')
    await tap.equal(body.copyrightYear, 1978)
    await tap.equal(body.genre, 'elf romance')
    await tap.equal(body.license, 'http://www.mylicense2.com')
    await tap.equal(body.inLanguage[0], 'en')
    await tap.equal(body.inLanguage[1], 'fr')
    await tap.equal(body.keywords[0], 'newkeyword1') // turned to lowercase
    await tap.equal(body.keywords[1], 'newkeyword2')
    await tap.ok(
      body.author[0].name === 'New Org inc.' ||
        body.author[0].name === 'New Sample Author'
    )
    await tap.ok(
      body.author[1].name === 'New Org inc.' ||
        body.author[1].name === 'New Sample Author'
    )
    await tap.equal(body.editor[0].name, 'New Sample Editor')
    await tap.equal(body.contributor[0].name, 'Sample Contributor2')
    await tap.equal(body.creator[0].name, 'Sample Creator')
    await tap.equal(body.illustrator[0].name, 'Sample Illustrator2')
    await tap.equal(body.publisher[0].name, 'Sample Publisher2')
    await tap.equal(body.translator[0].name, 'Sample Translator2')
  })

  await tap.test(
    'Try to update a Publication to an invalid value',
    async () => {
      const res = await request(app)
        .patch(`/publications/${publicationId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 1234
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Validation Error on Patch Publication: name: should be string'
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId}`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.name, 1234)
      await tap.type(error.details.validation, 'object')
      await tap.equal(error.details.validation.name[0].keyword, 'type')
      await tap.equal(error.details.validation.name[0].params.type, 'string')
    }
  )

  await tap.test(
    'Try to update a Publication to an invalid metadata value',
    async () => {
      const res = await request(app)
        .patch(`/publications/${publicationId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            genre: 123
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Publication validation error: genre should be a string'
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId}`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.genre, 123)
    }
  )

  await tap.test(
    'Try to update a Publication to an invalid attribution',
    async () => {
      const res = await request(app)
        .patch(`/publications/${publicationId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            illustrator: 123
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'illustrator attribution validation error: attribution should be either an attribution object or a string'
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId}`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.illustrator, 123)
    }
  )

  await tap.test(
    'Try to update a Publication to an invalid link object',
    async () => {
      const res = await request(app)
        .patch(`/publications/${publicationId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            links: [123, 456]
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Publication validation error: links items must be either a string or an object with a url property'
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId}`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.links[0], 123)
    }
  )

  await tap.test(
    'Try to update a Publication that does not exist',
    async () => {
      const res = await request(app)
        .patch(`/publications/${publicationId}1`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'New name for pub A',
            abstract: 'New description for Publication',
            json: { property: 'New value for json property' },
            inLanguage: ['en', 'fr'],
            keywords: ['newKeyWord1', 'newKeyWord2'],
            author: [
              { type: 'Person', name: 'New Sample Author' },
              { type: 'Organization', name: 'New Org inc.' }
            ],
            editor: [{ type: 'Person', name: 'New Sample Editor' }]
          })
        )

      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(
        error.message,
        `No Publication found with id ${publicationId}1`
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId}1`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.name, 'New name for pub A')
    }
  )

  await destroyDB(app)
}

module.exports = test
