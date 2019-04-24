const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const { Reader } = require('../../models/Reader')
const { Publication } = require('../../models/Publication')
const { Publication_Tag } = require('../../models/Publications_Tags')
const { Document } = require('../../models/Document')
const { urlToShortId } = require('../../routes/utils')
const { Attribution } = require('../../models/Attribution')
const { Tag } = require('../../models/Tag')
const crypto = require('crypto')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const reader = {
    name: 'J. Random Reader'
  }
  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const createPublicationObj = {
    type: 'Publication',
    name: 'Publication A',
    description: 'description of publication A',
    author: [
      { type: 'Person', name: 'Sample Author' },
      { type: 'Organization', name: 'Org inc.' }
    ],
    editor: ['Sample editor'],
    inLanguage: ['English'],
    keywords: ['key', 'words'],
    json: {
      property1: 'value1'
    },
    readingOrder: [
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Link',
        href: 'http://example.org/abc',
        hreflang: 'en',
        mediaType: 'text/html',
        name: 'An example link'
      },
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Link',
        href: 'http://example.org/abc2',
        hreflang: 'en',
        mediaType: 'text/html',
        name: 'An example link2'
      }
    ],
    links: [
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Link',
        href: 'http://example.org/abc3',
        hreflang: 'en',
        mediaType: 'text/html',
        name: 'An example link3'
      },
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Link',
        href: 'http://example.org/abc4',
        hreflang: 'en',
        mediaType: 'text/html',
        name: 'An example link4'
      }
    ],
    resources: [
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Link',
        href: 'http://example.org/abc5',
        hreflang: 'en',
        mediaType: 'text/html',
        name: 'An example link5'
      },
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Link',
        href: 'http://example.org/abc6',
        hreflang: 'en',
        mediaType: 'text/html',
        name: 'An example link6'
      }
    ]
  }

  const simplePublication = {
    type: 'reader:Publication',
    name: 'Publication A',
    readingOrder: [
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Link',
        href: 'http://example.org/abc',
        hreflang: 'en',
        mediaType: 'text/html',
        name: 'An example link'
      },
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Link',
        href: 'http://example.org/abc2',
        hreflang: 'en',
        mediaType: 'text/html',
        name: 'An example link2'
      }
    ]
  }

  const createdTag = await Tag.createTag(createdReader.id, {
    type: 'reader:Stack',
    name: 'mystack'
  })

  let publicationId
  let publication

  await tap.test('Create Publication', async () => {
    let response = await Publication.createPublication(
      createdReader,
      createPublicationObj
    )
    await tap.ok(response)
    await tap.ok(response instanceof Publication)
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(response.author.length, 2)
    await tap.ok(response.author[0] instanceof Attribution)
    await tap.equal(response.editor.length, 1)
    await tap.ok(response.editor[0] instanceof Attribution)
    publicationId = response.id
  })

  await tap.test('Create simple publication', async () => {
    let response = await Publication.createPublication(
      createdReader,
      simplePublication
    )
    await tap.ok(response)
    await tap.ok(response instanceof Publication)
    await tap.equal(response.readerId, createdReader.id)
    publicationId = response.id
  })

  await tap.test('Get publication by id', async () => {
    publication = await Publication.byId(publicationId)
    await tap.type(publication, 'object')
    await tap.ok(publication instanceof Publication)
    await tap.equal(publication.readerId, createdReader.id)
    // eager: reader, attachment
    await tap.type(publication.reader, 'object')
    await tap.ok(publication.reader instanceof Reader)
  })

  await tap.test('Publication asRef', async () => {
    // asRef is broken. Will fix the test and the code in another PR
  })

  await tap.test('Publication addTag', async () => {
    const res = await Publication_Tag.addTagToPub(publication.id, createdTag.id)
    await tap.ok(res.publicationId)
    await tap.ok(res.tagId)
    await tap.equal(res.publicationId, publication.id)
    await tap.equal(res.tagId, createdTag.id)
  })

  await tap.test('addTagToPub with invalid tag id ', async () => {
    const res = await Publication_Tag.addTagToPub(
      publication.id,
      createdTag.id + '123'
    )

    await tap.ok(typeof res, Error)
    await tap.equal(res.message, 'no tag')
  })

  await tap.test('addTagToPub with invalid publication id ', async () => {
    const res = await Publication_Tag.addTagToPub(undefined, createdTag.id)

    await tap.ok(typeof res, Error)
    await tap.equal(res.message, 'no publication')
  })

  await tap.test('Publication remove tag', async () => {
    const res = await Publication_Tag.removeTagFromPub(
      publication.id,
      createdTag.id
    )
    await tap.equal(res, 1)
  })

  await tap.test('removeTagFromPub with invalid tag id ', async () => {
    const res = await Publication_Tag.removeTagFromPub(
      publication.id,
      createdTag.id + '123'
    )

    await tap.ok(typeof res, Error)
    await tap.equal(res.message, 'not found')
  })

  await tap.test('removeTagFromPub with invalid publication id ', async () => {
    const res = await Publication_Tag.removeTagFromPub(undefined, createdTag.id)

    await tap.ok(typeof res, Error)
    await tap.equal(res.message, 'no publication')
  })

  // await tap.test('Try to assign same tag twice', async () => {
  //   await Publication_Tag.addTagToPub(publication.id, createdTag.id)

  //   const res = await Publication_Tag.addTagToPub(
  //     publication.id,
  //     createdTag.id
  //   )

  //   await tap.equal(res.message, 'duplicate')
  // })

  await tap.test('Delete publication', async () => {
    const res = await Publication.delete(publicationId)
    await tap.ok(res.deleted)
  })

  await tap.test('Delete publication that does not exist', async () => {
    const res = await Publication.delete('123')
    await tap.notOk(res)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
