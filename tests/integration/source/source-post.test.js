const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
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
    contributor: ['Sample Contributor'],
    creator: [{ name: 'Sample Creator' }],
    illustrator: [{ name: 'Sample Illustrator', type: 'Person' }],
    publisher: ['Sample Publisher'],
    translator: ['Sample Translator'],
    editor: 'Jane Doe',
    abstract: 'this is a description!!',
    numberOfPages: 250,
    wordCount: 2000,
    description: 'description goes here',
    status: 'test',
    encodingFormat: 'epub',
    inLanguage: 'en',
    datePublished: now,
    bookEdition: 'third',
    bookFormat: 'EBook',
    isbn: '1234',
    copyrightYear: 1977,
    genre: 'vampire romance',
    license: 'http://www.mylicense.com',
    inDirection: 'ltr',
    copyrightHolder: 'Joe Smith',
    keywords: ['one', 'TWO'],
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

  const tag1 = await createTag(app, token, { name: 'tag1' })
  const tag2 = await createTag(app, token, { name: 'tag2' })

  await tap.test('Create a Simple Source', async () => {
    const res = await request(app)
      .post(`/sources`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Source Simple',
          type: 'Book'
        })
      )

    await tap.equal(res.status, 201)

    const body = res.body
    await tap.equal(body.name, 'Source Simple')
    await tap.equal(body.type, 'Book')
  })

  await tap.test('Create a Source', async () => {
    const res = await request(app)
      .post(`/sources`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(sourceObject))

    await tap.equal(res.status, 201)
    const body = res.body
    await tap.equal(body.name, 'Source A')
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(body.type, 'Book')
    await tap.equal(body.abstract, 'this is a description!!')
    await tap.equal(body.json.property, 'value')
    await tap.equal(body.numberOfPages, 250)
    await tap.equal(body.wordCount, 2000)
    await tap.equal(body.description, 'description goes here')
    await tap.equal(body.status, 'test')
    await tap.equal(body.encodingFormat, 'epub')
    await tap.equal(body.inLanguage[0], 'en')
    await tap.equal(body.author[0].name, 'John Smith')
    await tap.equal(body.editor[0].name, 'Jane Doe')
    await tap.equal(body.links.length, 1)
    await tap.equal(body.readingOrder.length, 3)
    await tap.equal(body.resources.length, 1)
    await tap.equal(body.contributor[0].name, 'Sample Contributor')
    await tap.equal(body.creator[0].name, 'Sample Creator')
    await tap.equal(body.illustrator[0].name, 'Sample Illustrator')
    await tap.equal(body.publisher[0].name, 'Sample Publisher')
    await tap.equal(body.translator[0].name, 'Sample Translator')
    await tap.equal(body.bookEdition, 'third')
    await tap.equal(body.bookFormat, 'EBook')
    await tap.equal(body.isbn, '1234')
    await tap.equal(body.copyrightYear, 1977)
    await tap.equal(body.genre, 'vampire romance')
    await tap.equal(body.license, 'http://www.mylicense.com')
    await tap.equal(body.inDirection, 'ltr')
    await tap.equal(body.keywords[0], 'one')
    await tap.equal(body.keywords[1], 'two') // keywords converted to lowercase
    await tap.equal(body.copyrightHolder[0].name, 'Joe Smith')

    await tap.type(res.get('Location'), 'string')
    await tap.equal(res.get('Location'), body.id)
  })

  await tap.test('invalid properties should be ignored', async () => {
    const res = await request(app)
      .post(`/sources`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          type: 'Book',
          name: 'Source B',
          invalidProp: 'blah blah'
        })
      )

    await tap.equal(res.status, 201)

    const body = res.body
    await tap.equal(body.name, 'Source B')
    await tap.notOk(body.invalidProp)
  })

  await tap.test('created sources should be in the library', async () => {
    const res = await request(app)
      .get(`/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 200)
    const body = res.body

    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 3)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 3)
    await tap.equal(body.items[0].name, 'Source B')
    await tap.equal(body.items[1].name, 'Source A')
    await tap.equal(body.items[2].name, 'Source Simple')
  })

  await tap.test('Create a Source with link objects as strings', async () => {
    const res = await request(app)
      .post(`/sources`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Source Links',
          type: 'Book',
          links: ['http://www.something.com'],
          resources: [
            { url: 'http://www.somethingelse' },
            'http://www.something.com'
          ],
          readingOrder: ['http://www.something.com']
        })
      )

    await tap.equal(res.status, 201)

    const body = res.body
    // link strings put into a Link object with only a url property
    await tap.equal(body.links[0].url, 'http://www.something.com')
    await tap.equal(body.resources[1].url, 'http://www.something.com')
    await tap.equal(body.readingOrder[0].url, 'http://www.something.com')
  })

  await tap.test(
    'Link objects should only save recognized properties',
    async () => {
      const res = await request(app)
        .post(`/sources`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source Links',
            type: 'Book',
            links: [
              {
                url: 'http://www.something.com',
                encodingFormat: 'text',
                name: 'my link',
                description: 'this is a link to a thing',
                rel: 'something',
                integrity: 'unknown',
                length: 42,
                type: 'Link',
                property1: 'value' // should not be saved
              }
            ],
            resources: [
              {
                url: 'http://www.something.com',
                encodingFormat: 'text',
                name: 'my resource',
                description: 'this is a link to a resource',
                rel: 'something',
                integrity: 'unknown',
                length: 43,
                type: 'Link',
                property1: 'value' // should not be saved
              }
            ],
            readingOrder: [
              {
                url: 'http://www.something.com',
                encodingFormat: 'text',
                name: 'my reading',
                description: 'this is a link to a reading',
                rel: 'something',
                integrity: 'unknown',
                length: 44,
                type: 'Link',
                property1: 'value' // should not be saved
              }
            ]
          })
        )

      await tap.equal(res.status, 201)

      const body = res.body
      const link = body.links[0]
      await tap.equal(link.url, 'http://www.something.com')
      await tap.equal(link.encodingFormat, 'text')
      await tap.equal(link.name, 'my link')
      await tap.equal(link.description, 'this is a link to a thing')
      await tap.equal(link.rel, 'something')
      await tap.equal(link.integrity, 'unknown')
      await tap.equal(link.length, 42)
      await tap.equal(link.type, 'Link')
      await tap.notOk(link.property1)

      const resource = body.resources[0]
      await tap.equal(resource.url, 'http://www.something.com')
      await tap.equal(resource.encodingFormat, 'text')
      await tap.equal(resource.name, 'my resource')
      await tap.equal(resource.description, 'this is a link to a resource')
      await tap.equal(resource.rel, 'something')
      await tap.equal(resource.integrity, 'unknown')
      await tap.equal(resource.length, 43)
      await tap.equal(resource.type, 'Link')
      await tap.notOk(resource.property1)

      const reading = body.readingOrder[0]
      await tap.equal(reading.url, 'http://www.something.com')
      await tap.equal(reading.encodingFormat, 'text')
      await tap.equal(reading.name, 'my reading')
      await tap.equal(reading.description, 'this is a link to a reading')
      await tap.equal(reading.rel, 'something')
      await tap.equal(reading.integrity, 'unknown')
      await tap.equal(reading.length, 44)
      await tap.equal(reading.type, 'Link')
      await tap.notOk(reading.property1)
    }
  )

  await tap.test(
    'Create a Source with keywords as a single string',
    async () => {
      const res = await request(app)
        .post(`/sources`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source Keyword',
            type: 'Book',
            keywords: 'just one keyword'
          })
        )

      await tap.equal(res.status, 201)

      const body = res.body
      // keyword put into an array
      await tap.equal(body.keywords[0], 'just one keyword')
    }
  )

  await tap.test('Create a source with existing tags', async () => {
    const res = await request(app)
      .post(`/sources`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Source Keyword',
          type: 'Book',
          tags: [tag1, tag2]
        })
      )

    await tap.equal(res.status, 201)
    await tap.ok(res.body)
    await tap.ok(res.body.shortId)

    const resSource = await request(app)
      .get(`/sources/${res.body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = resSource.body
    await tap.ok(body.tags)
    await tap.equal(body.tags.length, 2)
  })

  await tap.test('Create a source with existing and new tags', async () => {
    const res = await request(app)
      .post(`/sources`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Source Keyword',
          type: 'Book',
          tags: [tag1, { name: 'tag3', type: 'stack' }]
        })
      )

    await tap.equal(res.status, 201)
    await tap.ok(res.body)
    await tap.ok(res.body.shortId)

    const resSource = await request(app)
      .get(`/sources/${res.body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = resSource.body
    await tap.ok(body.tags)
    await tap.equal(body.tags.length, 2)
  })

  await tap.test(
    'Create a source with existing and tags with invalid ids',
    async () => {
      const res = await request(app)
        .post(`/sources`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source Keyword',
            type: 'Book',
            tags: [tag1, { id: tag2.id + 'abc', name: 'tag3', type: 'stack' }]
          })
        )

      await tap.equal(res.status, 201)
      await tap.ok(res.body)
      await tap.ok(res.body.shortId)

      const resSource = await request(app)
        .get(`/sources/${res.body.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const body = resSource.body
      await tap.ok(body.tags)
      await tap.equal(body.tags.length, 1)
    }
  )

  await tap.test(
    'Try to Create a source with existing and invalid tags',
    async () => {
      const res = await request(app)
        .post(`/sources`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source Keyword',
            type: 'Book',
            tags: [tag1, { type: 'stack' }]
          })
        )

      await tap.equal(res.status, 201)
      await tap.ok(res.body)
      await tap.ok(res.body.shortId)

      const resSource = await request(app)
        .get(`/sources/${res.body.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const body = resSource.body
      await tap.ok(body.tags)
      await tap.equal(body.tags.length, 1)
    }
  )

  // ------------------------------------- ERRORS ---------------------------

  await tap.test('trying to create a Source without a name', async () => {
    const res = await request(app)
      .post(`/sources`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          type: 'Book',
          numberOfPages: 199
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Validation Error on Create Source: name: is a required property'
    )
    await tap.type(error.details.validation, 'object')
    await tap.equal(error.details.validation.name[0].keyword, 'required')
    await tap.equal(
      error.details.validation.name[0].params.missingProperty,
      'name'
    )
    await tap.equal(error.details.requestUrl, '/sources')
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.type, 'Book')
  })

  await tap.test('trying to create a Source without a type', async () => {
    const res = await request(app)
      .post(`/sources`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Source C',
          numberOfPages: 199
        })
      )

    await tap.equal(res.status, 400)

    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.type(error.details.validation, 'object')
    await tap.equal(error.details.validation.type[0].keyword, 'required')
    await tap.equal(
      error.details.validation.type[0].params.missingProperty,
      'type'
    )
    await tap.equal(
      error.message,
      'Validation Error on Create Source: type: is a required property'
    )
    await tap.equal(error.details.requestUrl, '/sources')
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.name, 'Source C')
  })

  await tap.test('Try to create a Source with an invalid json', async () => {
    const res = await request(app)
      .post(`/sources`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Source C',
          type: 'Book',
          json: 'a string'
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.type(error.details.validation, 'object')
    await tap.equal(error.details.validation.json[0].keyword, 'type')
    await tap.equal(error.details.validation.json[0].params.type, 'object,null')
    await tap.equal(
      error.message,
      'Validation Error on Create Source: json: should be object,null'
    )
    await tap.equal(error.details.requestUrl, '/sources')
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.name, 'Source C')
  })

  await tap.test(
    'Try to create a Source with an invalid language code',
    async () => {
      const res = await request(app)
        .post(`/sources`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source C',
            type: 'Book',
            inLanguage: ['not a valid code', 'another invalid thing']
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Source validation error: not a valid code,another invalid thing are not valid language codes'
      )
      await tap.equal(error.details.requestUrl, '/sources')
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.name, 'Source C')
    }
  )

  await tap.test(
    'Try to create a Source with an invalid link object',
    async () => {
      const res = await request(app)
        .post(`/sources`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source C',
            type: 'Book',
            links: [{ property: 'value' }]
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
      await tap.equal(error.details.requestUrl, '/sources')
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.name, 'Source C')

      const res2 = await request(app)
        .post(`/sources`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source C',
            type: 'Book',
            resources: 123
          })
        )

      await tap.equal(res2.status, 400)
      const error2 = JSON.parse(res2.text)
      await tap.equal(error2.statusCode, 400)
      await tap.equal(error2.error, 'Bad Request')
      await tap.equal(
        error2.message,
        `Source validation error: resources must be an array of links`
      )
      await tap.equal(error2.details.requestUrl, '/sources')
      await tap.type(error2.details.requestBody, 'object')
      await tap.equal(error2.details.requestBody.name, 'Source C')

      const res3 = await request(app)
        .post('/sources')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source C',
            type: 'Book',
            readingOrder: [123, 456]
          })
        )

      await tap.equal(res3.status, 400)
      const error3 = JSON.parse(res3.text)
      await tap.equal(error3.statusCode, 400)
      await tap.equal(error3.error, 'Bad Request')
      await tap.equal(
        error3.message,
        `Source validation error: readingOrder items must be either a string or an object with a url property`
      )
      await tap.equal(error3.details.requestUrl, '/sources')
      await tap.type(error3.details.requestBody, 'object')
      await tap.equal(error3.details.requestBody.name, 'Source C')
    }
  )

  await tap.test('Try to create a Source with an invalid type', async () => {
    const res = await request(app)
      .post(`/sources`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Source C',
          type: 'not valid'
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      `Source validation error: not valid is not a valid type.`
    )
    await tap.equal(error.details.requestUrl, '/sources')
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.name, 'Source C')

    const res2 = await request(app)
      .post('/sources')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Source C',
          type: 123
        })
      )

    await tap.equal(res2.status, 400)
    const error2 = JSON.parse(res2.text)
    await tap.equal(error2.statusCode, 400)
    await tap.equal(error2.error, 'Bad Request')
    await tap.equal(
      error2.message,
      `Source validation error: 123 is not a valid type.`
    )
    await tap.equal(error2.details.requestUrl, '/sources')
    await tap.type(error2.details.requestBody, 'object')
    await tap.equal(error2.details.requestBody.name, 'Source C')
  })

  await tap.test(
    'Try to create a Source with an invalid dateModified',
    async () => {
      const res = await request(app)
        .post(`/sources`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source C',
            type: 'Book',
            dateModified: 'not a date'
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        `Source validation error: dateModified must be a timestamp. not a date is not a valid timestamp`
      )
      await tap.equal(error.details.requestUrl, '/sources')
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.name, 'Source C')
    }
  )

  await tap.test(
    'Try to create a Source with an invalid bookEdition',
    async () => {
      const res = await request(app)
        .post('/sources')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source C',
            type: 'Book',
            bookEdition: { property: 'value' }
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Source validation error: bookEdition should be a string'
      )
      await tap.equal(error.details.requestUrl, '/sources')
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.name, 'Source C')
    }
  )

  await tap.test(
    'Try to create a Source with an invalid book format',
    async () => {
      const res = await request(app)
        .post('/sources')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source C',
            type: 'Book',
            bookFormat: 'invalid format'
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        `Source validation error: invalid format is not a valid bookFormat`
      )
      await tap.equal(error.details.requestUrl, '/sources')
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.name, 'Source C')

      const res2 = await request(app)
        .post('/sources')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source C',
            type: 'Book',
            bookFormat: 123
          })
        )

      await tap.equal(res2.status, 400)
      const error2 = JSON.parse(res2.text)
      await tap.equal(error2.statusCode, 400)
      await tap.equal(error2.error, 'Bad Request')
      await tap.equal(
        error2.message,
        `Source validation error: 123 is not a valid bookFormat`
      )
      await tap.equal(error2.details.requestUrl, '/sources')
      await tap.type(error2.details.requestBody, 'object')
      await tap.equal(error2.details.requestBody.name, 'Source C')
    }
  )

  await tap.test('Try to create a Source with an invalid isbn', async () => {
    const res = await request(app)
      .post('/sources')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Source C',
          type: 'Book',
          isbn: 1.23
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      `Source validation error: isbn should be a string`
    )
    await tap.equal(error.details.requestUrl, '/sources')
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.name, 'Source C')
  })

  await tap.test(
    'Try to create a Source with an invalid keywords',
    async () => {
      const res = await request(app)
        .post('/sources')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source C',
            type: 'Book',
            keywords: 1.23
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Source validation error: keywords should be a string or an array of strings'
      )
      await tap.equal(error.details.requestUrl, '/sources')
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.name, 'Source C')
    }
  )

  await tap.test('Try to create a Source with an invalid genre', async () => {
    const res = await request(app)
      .post('/sources')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Source C',
          type: 'Book',
          genre: ['something', 'else']
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      `Source validation error: genre should be a string`
    )
    await tap.equal(error.details.requestUrl, '/sources')
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.name, 'Source C')
  })

  await tap.test('Try to create a Source with an invalid url', async () => {
    const res = await request(app)
      .post('/sources')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'Source C',
          type: 'Book',
          url: 1.23
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      `Source validation error: url should be a string`
    )
    await tap.equal(error.details.requestUrl, '/sources')
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.name, 'Source C')
  })

  await tap.test(
    'Try to create a Source with an invalid attribution',
    async () => {
      const res = await request(app)
        .post('/sources')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source C',
            type: 'Book',
            illustrator: 123
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        `illustrator attribution validation error: attribution should be either an attribution object or a string`
      )
      await tap.equal(error.details.requestUrl, '/sources')
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.name, 'Source C')
    }
  )

  await tap.test(
    'Try to create a Source with an invalid attribution type',
    async () => {
      const res = await request(app)
        .post('/sources')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source C',
            type: 'Book',
            creator: [{ name: 'John Smith', type: 'invalid' }]
          })
        )
      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        `creator attribution Validation Error: invalid is not a valid type. Must be 'Person' or 'Organization'`
      )
      await tap.equal(error.details.requestUrl, '/sources')
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.name, 'Source C')
    }
  )

  await tap.test(
    'Try to create a Source with an invalid attribution object',
    async () => {
      const res = await request(app)
        .post('/sources')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source C',
            type: 'Book',
            creator: [{ prop: 'value' }]
          })
        )
      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        `creator attribution Validation Error: name is a required property`
      )
      await tap.equal(error.details.requestUrl, '/sources')
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.name, 'Source C')
    }
  )

  await tap.test(
    'Try to create a Source with an invalid inDirection value',
    async () => {
      const res = await request(app)
        .post('/sources')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Source C',
            type: 'Book',
            inDirection: 'invalid value'
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        `Source validation error: inDirection should be either "ltr" or "rtl"`
      )
      await tap.equal(error.details.requestUrl, '/sources')
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.name, 'Source C')
    }
  )

  await tap.test('Try to create a Source without a body', async () => {
    const res = await request(app)
      .post('/sources')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      `Create Source Error: Request body must be a JSON object`
    )
    await tap.equal(error.details.requestUrl, '/sources')
  })

  await destroyDB(app)
}

module.exports = test
