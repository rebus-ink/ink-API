const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createTag
} = require('../../utils/testUtils')
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

  const resCreateSource = await createSource(app, token, sourceObject)
  const sourceUrl = resCreateSource.id
  const sourceId = urlToId(sourceUrl)

  const tag1 = await createTag(app, token, { name: 'tag1', type: 'stack' })
  const tag2 = await createTag(app, token, { name: 'tag2', type: 'stack' })
  const tag3 = await createTag(app, token, { name: 'tag3', type: 'stack' })

  await tap.test('Update a Source', async () => {
    // const timestamp = new Date(2018, 01, 30).toISOString()
    const res = await request(app)
      .patch(`/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          type: 'Article',
          name: 'New name for source A',
          // datePublished: timestamp,
          abstract: 'New description for Source',
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
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(body.name, 'New name for source A')
    await tap.equal(body.abstract, 'New description for Source')
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

  await tap.test('Update a single property', async () => {
    const res = await request(app)
      .patch(`/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          abstract: 'new new!'
        })
      )
    await tap.equal(res.status, 200)
    const body = res.body
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(body.name, 'New name for source A')
    await tap.equal(body.abstract, 'new new!')
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

  await tap.test('Update a single attribution', async () => {
    const res = await request(app)
      .patch(`/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          author: 'new new author'
        })
      )
    await tap.equal(res.status, 200)
    const body = res.body
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(body.name, 'New name for source A')
    await tap.equal(body.abstract, 'new new!')
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
    await tap.ok(body.author[0].name === 'new new author')
    await tap.equal(body.author.length, 1)
    await tap.equal(body.editor[0].name, 'New Sample Editor')
    await tap.equal(body.contributor[0].name, 'Sample Contributor2')
    await tap.equal(body.creator[0].name, 'Sample Creator')
    await tap.equal(body.illustrator[0].name, 'Sample Illustrator2')
    await tap.equal(body.publisher[0].name, 'Sample Publisher2')
    await tap.equal(body.translator[0].name, 'Sample Translator2')
  })

  await tap.test('Update a single metadata property', async () => {
    // const timestamp = new Date(2018, 01, 30).toISOString()
    const res = await request(app)
      .patch(`/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          isbn: '111'
        })
      )
    await tap.equal(res.status, 200)
    const body = res.body
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(body.name, 'New name for source A')
    await tap.equal(body.abstract, 'new new!')
    // await tap.equal(body.datePublished, timestamp)
    await tap.equal(body.json.property, 'New value for json property')
    await tap.equal(body.numberOfPages, 444)
    await tap.equal(body.encodingFormat, 'new')
    await tap.equal(body.url, 'http://www.something2.com')
    await tap.equal(body.dateModified, new Date(2012, 3, 22).toISOString())
    await tap.equal(body.bookEdition, 'fourth')
    await tap.equal(body.isbn, '111')
    await tap.equal(body.copyrightYear, 1978)
    await tap.equal(body.genre, 'elf romance')
    await tap.equal(body.license, 'http://www.mylicense2.com')
    await tap.equal(body.inLanguage[0], 'en')
    await tap.equal(body.inLanguage[1], 'fr')
    await tap.equal(body.keywords[0], 'newkeyword1') // turned to lowercase
    await tap.equal(body.keywords[1], 'newkeyword2')
    await tap.ok(body.author[0].name === 'new new author')
    await tap.equal(body.author.length, 1)
    await tap.equal(body.editor[0].name, 'New Sample Editor')
    await tap.equal(body.contributor[0].name, 'Sample Contributor2')
    await tap.equal(body.creator[0].name, 'Sample Creator')
    await tap.equal(body.illustrator[0].name, 'Sample Illustrator2')
    await tap.equal(body.publisher[0].name, 'Sample Publisher2')
    await tap.equal(body.translator[0].name, 'Sample Translator2')
  })

  await tap.test(
    'Update a single metadata property by setting it to null',
    async () => {
      // const timestamp = new Date(2018, 01, 30).toISOString()
      const res = await request(app)
        .patch(`/sources/${sourceId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            genre: null
          })
        )
      await tap.equal(res.status, 200)
      const body = res.body
      await tap.equal(body.shortId, urlToId(body.id))
      await tap.equal(body.name, 'New name for source A')
      await tap.equal(body.abstract, 'new new!')
      // await tap.equal(body.datePublished, timestamp)
      await tap.equal(body.json.property, 'New value for json property')
      await tap.equal(body.numberOfPages, 444)
      await tap.equal(body.encodingFormat, 'new')
      await tap.equal(body.url, 'http://www.something2.com')
      await tap.equal(body.dateModified, new Date(2012, 3, 22).toISOString())
      await tap.equal(body.bookEdition, 'fourth')
      await tap.equal(body.isbn, '111')
      await tap.equal(body.copyrightYear, 1978)
      await tap.notOk(body.genre)
      await tap.equal(body.license, 'http://www.mylicense2.com')
      await tap.equal(body.inLanguage[0], 'en')
      await tap.equal(body.inLanguage[1], 'fr')
      await tap.equal(body.keywords[0], 'newkeyword1') // turned to lowercase
      await tap.equal(body.keywords[1], 'newkeyword2')
      await tap.ok(body.author[0].name === 'new new author')
      await tap.equal(body.author.length, 1)
      await tap.equal(body.editor[0].name, 'New Sample Editor')
      await tap.equal(body.contributor[0].name, 'Sample Contributor2')
      await tap.equal(body.creator[0].name, 'Sample Creator')
      await tap.equal(body.illustrator[0].name, 'Sample Illustrator2')
      await tap.equal(body.publisher[0].name, 'Sample Publisher2')
      await tap.equal(body.translator[0].name, 'Sample Translator2')
    }
  )

  await tap.test('Update a source by setting a value to null', async () => {
    const res = await request(app)
      .patch(`/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          abstract: null
        })
      )
    await tap.equal(res.status, 200)
    await tap.notOk(res.body.abstract)
  })

  await tap.test(
    'Update a source by setting a metadata value to null',
    async () => {
      const res = await request(app)
        .patch(`/sources/${sourceId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            url: null,
            numberOfPages: null
          })
        )
      await tap.equal(res.status, 200)
      await tap.notOk(res.body.url)
      await tap.notOk(res.body.numberOfPages)
    }
  )

  await tap.test(
    'Update a source by setting an attribution value to null',
    async () => {
      const res = await request(app)
        .patch(`/sources/${sourceId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            creator: null
          })
        )
      await tap.equal(res.status, 200)
      await tap.notOk(res.body.creator)
    }
  )

  await tap.test('Update tags for a source - add tags', async () => {
    const res = await request(app)
      .patch(`/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify({ tags: [tag1, tag2] }))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.notOk(body.tags)

    const sourceRes = await request(app)
      .get(`/sources/${body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const sourceBody = sourceRes.body
    await tap.ok(sourceBody.tags)
    await tap.equal(sourceBody.tags.length, 2)
  })

  await tap.test('Update tags for a source - replace tags', async () => {
    const res = await request(app)
      .patch(`/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({ tags: [tag2, tag3, { type: 'stack', name: 'tag4' }] })
      )

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.notOk(body.tags)

    const sourceRes = await request(app)
      .get(`/sources/${body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const sourceBody = sourceRes.body
    await tap.ok(sourceBody.tags)
    await tap.equal(sourceBody.tags.length, 3)
  })

  await tap.test('Update tags for a source - ignore invalid tags', async () => {
    const res = await request(app)
      .patch(`/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          tags: [tag2, { id: tag3.id + 'abc', type: 'stack', name: 'invalid' }]
        })
      )

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.notOk(body.tags)

    const sourceRes = await request(app)
      .get(`/sources/${body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const sourceBody = sourceRes.body
    await tap.ok(sourceBody.tags)
    await tap.equal(sourceBody.tags.length, 1)
  })

  await tap.test(
    'Update tags for a source - empty array = delete existing tags',
    async () => {
      const res = await request(app)
        .patch(`/sources/${sourceId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify({ tags: [] }))

      await tap.equal(res.statusCode, 200)
      const body = res.body
      await tap.notOk(body.tags)

      const sourceRes = await request(app)
        .get(`/sources/${body.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const sourceBody = sourceRes.body
      await tap.ok(sourceBody.tags)
      await tap.equal(sourceBody.tags.length, 0)
    }
  )

  await tap.test('Try to update a Source to an invalid value', async () => {
    const res = await request(app)
      .patch(`/sources/${sourceId}`)
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
      'Validation Error on Patch Source: name: should be string'
    )
    await tap.equal(error.details.requestUrl, `/sources/${sourceId}`)
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.name, 1234)
    await tap.type(error.details.validation, 'object')
    await tap.equal(error.details.validation.name[0].keyword, 'type')
    await tap.equal(error.details.validation.name[0].params.type, 'string')
  })

  await tap.test(
    'Try to update a Source to an invalid metadata value',
    async () => {
      const res = await request(app)
        .patch(`/sources/${sourceId}`)
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
        'Source validation error: genre should be a string'
      )
      await tap.equal(error.details.requestUrl, `/sources/${sourceId}`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.genre, 123)
    }
  )

  await tap.test(
    'Try to update a Source to an invalid attribution',
    async () => {
      const res = await request(app)
        .patch(`/sources/${sourceId}`)
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
      await tap.equal(error.details.requestUrl, `/sources/${sourceId}`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.illustrator, 123)
    }
  )

  await tap.test(
    'Try to update a Source to an invalid link object',
    async () => {
      const res = await request(app)
        .patch(`/sources/${sourceId}`)
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
        'Source validation error: links items must be either a string or an object with a url property'
      )
      await tap.equal(error.details.requestUrl, `/sources/${sourceId}`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.links[0], 123)
    }
  )

  await tap.test('Try to update a Source that does not exist', async () => {
    const res = await request(app)
      .patch(`/sources/${sourceId}1`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'New name for source A',
          abstract: 'New description for Source',
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
    await tap.equal(error.message, `No Source found with id ${sourceId}1`)
    await tap.equal(error.details.requestUrl, `/sources/${sourceId}1`)
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.name, 'New name for source A')
  })

  await destroyDB(app)
}

module.exports = test
