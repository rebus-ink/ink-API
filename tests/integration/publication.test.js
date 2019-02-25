const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl
} = require('./utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const userId = await createUser(app, token)
  const userUrl = urlparse(userId).path
  let publicationUrl
  let activityUrl
  let documentUrl

  await tap.test('Create Publication', async () => {
    const res = await request(app)
      .post(`${userUrl}/activity`)
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
            type: 'reader:Publication',
            name: 'Publication A',
            attributedTo: [
              {
                type: 'Person',
                name: 'Sample Author'
              }
            ],
            attachment: [
              {
                type: 'Document',
                name: 'Chapter 2',
                content: 'Sample document content 2',
                position: 1
              },
              {
                type: 'Document',
                name: 'Chapter 1',
                content: 'Sample document content 1',
                position: 0
              },
              {
                type: 'Document',
                name: 'Not a Chapter',
                content: 'not a chapter: does not have a position!'
              }
            ]
          }
        })
      )

    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')
    activityUrl = res.get('Location')
  })

  await tap.test('Get Publication', async () => {
    const activityObject = await getActivityFromUrl(app, activityUrl, token)
    publicationUrl = activityObject.object.id

    const res = await request(app)
      .get(urlparse(publicationUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.type(body['@context'], 'object')
    await tap.ok(Array.isArray(body['@context']))
    await tap.ok(Array.isArray(body.attachment))
    await tap.ok(Array.isArray(body.orderedItems))
    // check the order of items
    await tap.equal(body.orderedItems[0].name, 'Chapter 1')
    await tap.notOk(body.orderedItems[2])

    documentUrl = body.orderedItems[0].id
  })

  await tap.test('Read activity should appear on the publication', async () => {
    await request(app)
      .post(`${userUrl}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(
        JSON.stringify({
          '@context': [
            'https://www.w3.org/ns/activitystreams',
            { reader: 'https://rebus.foundation/ns/reader' },
            { oa: 'http://www.w3.org/ns/oa#' }
          ],
          type: 'Read',
          object: { type: 'Document', id: documentUrl },
          context: publicationUrl,
          'oa:hasSelector': {
            type: 'XPathSelector',
            value: '/html/body/p[2]/table/tr[2]/td[3]/span'
          }
        })
      )

    await request(app)
      .post(`${userUrl}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(
        JSON.stringify({
          '@context': [
            'https://www.w3.org/ns/activitystreams',
            { reader: 'https://rebus.foundation/ns/reader' },
            { oa: 'http://www.w3.org/ns/oa#' }
          ],
          type: 'Read',
          object: { type: 'Document', id: documentUrl },
          context: publicationUrl,
          'oa:hasSelector': {
            type: 'XPathSelector',
            value: '/html/body/p[2]/table/tr[2]/td[3]/span2'
          }
        })
      )

    const activityObject = await getActivityFromUrl(app, activityUrl, token)
    publicationUrl = activityObject.object.id

    const res = await request(app)
      .get(urlparse(publicationUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.position, 'object')
    await tap.type(body.position.documentId, 'string')
    await tap.equal(body.position.documentId, documentUrl)
    await tap.type(body.position.value, 'string')
    await tap.equal(
      body.position.value,
      '/html/body/p[2]/table/tr[2]/td[3]/span2'
    )
  })

  await tap.test('Get Publication that does not exist', async () => {
    const res = await request(app)
      .get(urlparse(publicationUrl).path + 'abc')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
  })

  await tap.test('Delete Publication', async () => {
    const res = await request(app)
      .post(`${userUrl}/activity`)
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
            type: 'reader:Publication',
            id: publicationUrl
          }
        })
      )
    await tap.equal(res.statusCode, 201)

    // getting deleted publication should return 404 error
    const getres = await request(app)
      .get(urlparse(publicationUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(getres.statusCode, 404)

    // publication should no longer be in the reader library
    const libraryres = await request(app)
      .get(`${userUrl}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(libraryres.status, 200)
    const body = libraryres.body
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 0)
    await tap.equal(body.totalItems, 0)

    // TODO: should eventually delete the documents as well. And the notes.
    // const docres = await request(app)
    //   .get(urlparse(documentUrl).path)
    //   .set('Host', 'reader-api.test')
    //   .set('Authorization', `Bearer ${token}`)
    //   .type(
    //     'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    //   )

    // await tap.equal(docres.statusCode, 404)
  })

  await tap.test('delete publication that does not exist', async () => {
    // already deleted
    const res = await request(app)
      .post(`${userUrl}/activity`)
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
            type: 'reader:Publication',
            id: publicationUrl
          }
        })
      )
    await tap.equal(res.statusCode, 404)

    // never existed
    const res1 = await request(app)
      .post(`${userUrl}/activity`)
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
            type: 'reader:Publication',
            id: publicationUrl + '123'
          }
        })
      )
    await tap.equal(res1.statusCode, 404)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
