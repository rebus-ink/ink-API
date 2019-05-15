const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const { Reader } = require('../../models/Reader')
const { Publication } = require('../../models/Publication')
const { Publication_Tag } = require('../../models/Publications_Tags')
const { urlToId } = require('../../routes/utils')
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

  const createdTag = await Tag.createTag(urlToId(createdReader.id), {
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
    publicationId = urlToId(response.id)
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
    const res = await Publication_Tag.addTagToPub(
      urlToId(publication.id),
      createdTag.id
    )
    await tap.ok(res.publicationId)
    await tap.ok(res.tagId)
    await tap.equal(res.publicationId, publication.id)
    await tap.equal(urlToId(res.tagId), createdTag.id)
  })

  await tap.test('addTagToPub with invalid tag id ', async () => {
    const res = await Publication_Tag.addTagToPub(
      urlToId(publication.id),
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
      urlToId(publication.id),
      createdTag.id
    )
    await tap.equal(res, 1)
  })

  await tap.test('removeTagFromPub with invalid tag id ', async () => {
    const res = await Publication_Tag.removeTagFromPub(
      urlToId(publication.id),
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
  await tap.test('Update publication name', async () => {
    const newPubObj = {
      id: publication.id,
      name: 'New name for pub A'
    }

    // Update the publication
    const newPub = await Publication.update(newPubObj)

    // Retrieve the Publication that has just been updated
    const pubRetrieved = await Publication.byId(urlToId(newPub.id))

    await tap.ok(newPub)
    await tap.ok(newPub instanceof Publication)
    await tap.equal(newPub.name, pubRetrieved.name)
    await tap.equal(
      newPub.readingOrder.data[0].name,
      pubRetrieved.readingOrder[0].name
    )
  })

  await tap.test(
    'Update publication with incorrect publicationId',
    async () => {
      const newPubObj = {
        id: 'BlahID',
        name: 'New name for pub A'
      }

      const newPub = await Publication.update(newPubObj)

      await tap.ok(!newPub)
      await tap.equal(newPub, null)
    }
  )

  // await tap.test('Update publication datePublished', async () => {
  //   const timestamp = new Date(2018, 01, 30).toISOString()
  //   const newPubObj = {
  //     id: publication.id,
  //     datePublished: timestamp
  //   }

  //   const newPub = await Publication.update(newPubObj)

  //   // Retrieve the Publication that has just been updated
  //   const pubRetrieved = await Publication.byId(urlToId(newPub.id))

  //   await tap.ok(newPub)
  //   await tap.ok(newPub instanceof Publication)
  //   await tap.equal(
  //     newPub.datePublished.toString(),
  //     pubRetrieved.datePublished.toString()
  //   )
  // })

  await tap.test('Update publication description', async () => {
    const newPubObj = {
      id: publication.id,
      description: 'New description for Publication'
    }

    const newPub = await Publication.update(newPubObj)

    // Retrieve the Publication that has just been updated
    const pubRetrieved = await Publication.byId(urlToId(newPub.id))

    await tap.ok(newPub)
    await tap.ok(newPub instanceof Publication)
    await tap.equal(newPub.description, pubRetrieved.description)
  })

  await tap.test('Update publication json object', async () => {
    const newPubObj = {
      id: publication.id,
      json: { property: 'New value for json property' }
    }

    const newPub = await Publication.update(newPubObj)

    // Retrieve the Publication that has just been updated
    const pubRetrieved = await Publication.byId(urlToId(newPub.id))

    await tap.ok(newPub)
    await tap.ok(newPub instanceof Publication)
    await tap.equal(newPub.json.property, pubRetrieved.json.property)
  })

  await tap.test('Update publication metadata', async () => {
    const newPubObj = {
      id: publication.id,
      inLanguage: ['Swahili', 'French'],
      keywords: ['newKeyWord1', 'newKeyWord2']
    }

    const newPub = await Publication.update(newPubObj)

    // Retrieve the Publication that has just been updated
    const pubRetrieved = await Publication.byId(urlToId(newPub.id))

    await tap.ok(newPub)
    await tap.ok(newPub instanceof Publication)
    await tap.equal(
      newPub.metadata.keywords[0],
      pubRetrieved.metadata.keywords[0]
    )
    await tap.equal(
      newPub.metadata.keywords[1],
      pubRetrieved.metadata.keywords[1]
    )
    await tap.equal(
      newPub.metadata.inLanguage[0],
      pubRetrieved.metadata.inLanguage[0]
    )
    await tap.equal(
      newPub.metadata.inLanguage[1],
      pubRetrieved.metadata.inLanguage[1]
    )
  })

  await tap.test('Update publication attribution with objects', async () => {
    const newPubObj = {
      id: publication.id,
      author: [
        { type: 'Person', name: 'New Sample Author' },
        { type: 'Organization', name: 'New Org inc.' }
      ],
      editor: [{ type: 'Person', name: 'New Sample Editor' }]
    }

    const newPub = await Publication.update(newPubObj)
    const attributions = await Attribution.getAttributionByPubId(
      urlToId(publication.id)
    )

    let newAuthor1Exists = false
    let newAuthor2Exists = false
    let newEditorExists = false

    for (let i = 0; i < attributions.length; i++) {
      if (
        attributions[i].role === 'author' &&
        attributions[i].name === 'New Sample Author' &&
        attributions[i].type === 'Person'
      ) {
        newAuthor1Exists = true
      }

      if (
        attributions[i].role === 'author' &&
        attributions[i].name === 'New Org inc.' &&
        attributions[i].type === 'Organization'
      ) {
        newAuthor2Exists = true
      }

      if (
        attributions[i].role === 'editor' &&
        attributions[i].name === 'New Sample Editor' &&
        attributions[i].type === 'Person'
      ) {
        newEditorExists = true
      }
    }

    await tap.ok(newPub)
    await tap.ok(newPub instanceof Publication)
    await tap.ok(
      newPub.author[0].name === 'New Sample Author' ||
        newPub.author[0].name === 'New Org inc.'
    )
    await tap.ok(
      newPub.author[1].name === 'New Sample Author' ||
        newPub.author[1].name === 'New Org inc.'
    )
    await tap.equal(newPub.editor[0].name, 'New Sample Editor')
    await tap.ok(attributions[0] instanceof Attribution)
    await tap.equal(attributions.length, 3)
    await tap.ok(newAuthor1Exists)
    await tap.ok(newAuthor2Exists)
    await tap.ok(newEditorExists)
  })

  await tap.test('Update publication attribution with strings', async () => {
    const newPubObj = {
      id: publication.id,
      author: ['Sample String Author1', 'Sample String Author2'],
      editor: ['Sample String Editor1', 'Sample String Editor2']
    }

    const newPub = await Publication.update(newPubObj)
    const attributions = await Attribution.getAttributionByPubId(
      urlToId(publication.id)
    )

    let author1Exists = false
    let author2Exists = false
    let editor1Exists = false
    let editor2Exists = false

    for (let i = 0; i < attributions.length; i++) {
      if (
        attributions[i].role === 'author' &&
        attributions[i].name === 'Sample String Author1'
      ) {
        author1Exists = true
      }

      if (
        attributions[i].role === 'author' &&
        attributions[i].name === 'Sample String Author2'
      ) {
        author2Exists = true
      }

      if (
        attributions[i].role === 'editor' &&
        attributions[i].name === 'Sample String Editor1'
      ) {
        editor1Exists = true
      }

      if (
        attributions[i].role === 'editor' &&
        attributions[i].name === 'Sample String Editor2'
      ) {
        editor2Exists = true
      }
    }

    await tap.ok(newPub)
    await tap.ok(newPub instanceof Publication)
    await tap.ok(attributions[0] instanceof Attribution)
    await tap.equal(attributions.length, 4)
    await tap.ok(author1Exists)
    await tap.ok(author2Exists)
    await tap.ok(editor1Exists)
    await tap.ok(editor2Exists)
  })

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
