const tap = require('tap')
const { destroyDB } = require('../utils/utils')
const { Reader } = require('../../models/Reader')
const { Publication } = require('../../models/Publication')
const { Publication_Tag } = require('../../models/Publications_Tags')
const { urlToId } = require('../../utils/utils')
const { Attribution } = require('../../models/Attribution')
const { Tag } = require('../../models/Tag')
const { Document } = require('../../models/Document')
const { Note } = require('../../models/Note')
const crypto = require('crypto')
const _ = require('lodash')

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
    type: 'reader:Tag',
    tagType: 'reader:Stack',
    name: 'mystack'
  })

  let publicationId
  let publicationId2
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
    publicationId2 = response.id
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

  await tap.test(
    'Delete Publication_Tags when a Publication is deleted',
    async () => {
      // Create 2 additional tags for testing purposes
      const createdTag2 = await Tag.createTag(urlToId(createdReader.id), {
        type: 'reader:Tag',
        tagType: 'reader:Stack',
        name: 'mystack2'
      })

      const createdTag3 = await Tag.createTag(urlToId(createdReader.id), {
        type: 'reader:Tag',
        tagType: 'reader:Stack',
        name: 'mystack3'
      })

      await Publication_Tag.addTagToPub(urlToId(publication.id), createdTag2.id)

      await Publication_Tag.addTagToPub(urlToId(publication.id), createdTag3.id)

      // Get the Publication with 2 new tags
      const pub = await Publication.byId(urlToId(publication.id))

      await tap.equal(pub.tags.length, 2)
      await tap.ok(
        pub.tags[0].name === 'mystack2' || pub.tags[0].name === 'mystack3'
      )
      await tap.ok(
        pub.tags[1].name === 'mystack3' || pub.tags[1].name === 'mystack2'
      )

      // Delete the entries in Publication_Tag
      const numDeleted = await Publication_Tag.deletePubTagsOfPub(
        urlToId(publication.id)
      )

      // Get the updated Publication
      const newPub = await Publication.byId(urlToId(publication.id))

      await tap.equal(numDeleted, 2)
      await tap.equal(newPub.tags.length, 0)
    }
  )

  await tap.test(
    'Delete Publication_Tags of a Publication with an id that does not exist',
    async () => {
      const response = await Publication_Tag.deletePubTagsOfPub(
        'invalidIdOfPub'
      )

      await tap.equal(response, 0)
    }
  )

  await tap.test(
    'Delete Publication_Tags of a Publication with an invalid id',
    async () => {
      const response = await Publication_Tag.deletePubTagsOfPub(null)

      await tap.ok(typeof response, Error)
      await tap.equal(response.message, 'no publication')
    }
  )

  await tap.test('Delete publication', async () => {
    // Add a document to the publication
    const documentObject = {
      mediaType: 'txt',
      url: 'http://google-bucket/somewhere/file1234.txt',
      documentPath: '/inside/the/book.txt',
      json: { property1: 'value1' }
    }

    let document = await Document.createDocument(
      createdReader,
      publicationId,
      documentObject
    )

    // Add Tag to the publication
    const tagAdded = await Tag.createTag(urlToId(createdReader.id), {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'tagAdded'
    })

    await Publication_Tag.addTagToPub(publicationId, tagAdded.id)

    // Get the Publication with new tags
    const pub = await Publication.byId(publicationId)

    await tap.equal(pub.tags.length, 1)
    await tap.equal(pub.tags[0].name, 'tagAdded')

    const res = await Publication.delete(publicationId)

    // Fetch the document that has just been deleted
    const docDeleted = await Document.byId(urlToId(document.id))

    await tap.ok(res.deleted)
    await tap.ok(docDeleted.deleted)
    await tap.ok(!res.tags)
  })

  await tap.test('Delete publication that does not exist', async () => {
    const res = await Publication.delete('123')
    await tap.notOk(res)
  })

  await tap.test('Delete all notes for a publication', async () => {
    const createdNote1 = await Note.createNote(createdReader, {
      noteType: 'something',
      selector: { property: 'value' },
      context: publicationId
    })

    const createdNote2 = await Note.createNote(createdReader, {
      noteType: 'something',
      selector: { property: 'value' },
      context: publicationId
    })

    const res = await Publication.deleteNotes(publicationId)
    await tap.equal(res, 2)

    const note1 = await Note.byId(urlToId(createdNote1.id))
    await tap.ok(note1.deleted)

    const note2 = await Note.byId(urlToId(createdNote2.id))
    await tap.ok(note2.deleted)
  })

  await tap.test('Get PublicationIds By Collection', async () => {
    // create a third publication:
    let response = await Publication.createPublication(
      createdReader,
      simplePublication
    )
    publicationId3 = urlToId(response.id)

    // add tag to publications 2 and 3:
    await Publication_Tag.addTagToPub(urlToId(publicationId2), createdTag.id)
    await Publication_Tag.addTagToPub(urlToId(publicationId3), createdTag.id)

    // add tag2 to publication1
    const createdTag2 = await Tag.createTag(urlToId(createdReader.id), {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'mystack9'
    })

    await Publication_Tag.addTagToPub(urlToId(publicationId), createdTag2.id)
    // get publicationIds by collection:
    let pubIdsResponse = await Publication_Tag.getIdsByCollection(
      createdTag.name,
      createdReader.id
    )
    await tap.ok(_.isArray(pubIdsResponse))
    await tap.equal(pubIdsResponse.length, 2)
    await tap.notEqual(pubIdsResponse.indexOf(urlToId(publicationId2)), -1)
    await tap.notEqual(pubIdsResponse.indexOf(urlToId(publicationId3)), -1)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }

  await destroyDB(app)
}

module.exports = test
