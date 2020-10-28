const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { Source } = require('../../models/Source')
const { Source_Tag } = require('../../models/Source_Tag')
const { urlToId } = require('../../utils/utils')
const { Attribution } = require('../../models/Attribution')
const { Tag } = require('../../models/Tag')
const { Note } = require('../../models/Note')
const crypto = require('crypto')
const _ = require('lodash')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }
  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const createSourceObj = {
    name: 'Source A',
    abstract: 'description of source A',
    type: 'Book',
    author: [
      { type: 'Person', name: 'Sample Author' },
      { type: 'Organization', name: 'Org inc.' }
    ],
    editor: ['Sample editor'],
    contributor: ['Sample Contributor'],
    creator: ['Sample Creator'],
    illustrator: ['Sample Illustrator'],
    publisher: ['Sample Publisher'],
    translator: ['Sample Translator'],
    inLanguage: ['en'],
    keywords: ['key', 'words'],
    numberOfPages: 666,
    encodingFormat: 'epub',
    datePublished: new Date(2011, 3, 20).toISOString(),
    url: 'http://www.something.com',
    dateModified: new Date(2012, 4, 25).toISOString(),
    bookEdition: 'second edition',
    bookFormat: 'EBook',
    isbn: '1234',
    copyrightYear: 1923,
    genre: 'romance',
    license: 'http://www.mylicense.com',
    status: 'test',
    wordCount: 123,
    description: 'description goes here',
    inDirection: 'ltr',
    copyrightHolder: 'Person A',
    json: {
      property1: 'value1'
    },
    readingOrder: [
      {
        type: 'Link',
        url: 'http://example.org/abc',
        encodingFormat: 'text/html',
        name: 'An example link'
      },
      {
        type: 'Link',
        url: 'http://example.org/abc2',
        hreflang: 'en',
        encodingFormat: 'text/html',
        name: 'An example link2'
      }
    ],
    links: [
      {
        type: 'Link',
        url: 'http://example.org/abc3',
        hreflang: 'en',
        encodingFormat: 'text/html',
        name: 'An example link3'
      },
      {
        type: 'Link',
        url: 'http://example.org/abc4',
        hreflang: 'en',
        encodingFormat: 'text/html',
        name: 'An example link4'
      }
    ],
    resources: [
      {
        type: 'Link',
        url: 'http://example.org/abc5',
        hreflang: 'en',
        encodingFormat: 'text/html',
        name: 'An example link5'
      },
      {
        type: 'Link',
        url: 'http://example.org/abc6',
        hreflang: 'en',
        encodingFormat: 'text/html',
        name: 'An example link6'
      }
    ]
  }

  const simpleSource = {
    name: 'Source A',
    type: 'Book'
  }

  const createdTag = await Tag.createTag(urlToId(createdReader.id), {
    type: 'stack',
    name: 'mystack'
  })

  let sourceId
  let sourceId2
  let source

  await tap.test('Create Source', async () => {
    let response = await Source.createSource(createdReader, createSourceObj)
    await tap.ok(response)
    await tap.ok(response instanceof Source)
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(response.author.length, 2)
    // await tap.ok(response.author[0] instanceof Attribution)
    await tap.equal(response.editor.length, 1)
    // await tap.ok(response.editor[0] instanceof Attribution)
    sourceId2 = urlToId(response.id)
  })

  await tap.test('Create simple source', async () => {
    let response = await Source.createSource(createdReader, simpleSource)
    await tap.ok(response)
    await tap.ok(response instanceof Source)
    await tap.equal(response.readerId, createdReader.id)
    sourceId = urlToId(response.id)
  })

  await tap.test('Get source by id', async () => {
    source = await Source.byId(sourceId)
    await tap.type(source, 'object')
    await tap.ok(source instanceof Source)
    await tap.equal(source.readerId, createdReader.id)
    // eager: reader, attachment
    await tap.type(source.reader, 'object')
    await tap.ok(source.reader instanceof Reader)
  })

  await tap.test('Get source by id should return all metadata', async () => {
    source = await Source.byId(urlToId(sourceId2))
    await tap.type(source, 'object')
    await tap.ok(source instanceof Source)
    await tap.equal(source.readerId, createdReader.id)
    await tap.equal(source.type, 'Book')
    await tap.equal(source.abstract, 'description of source A')
    await tap.ok(source.datePublished)
    await tap.equal(source.name, 'Source A')
    await tap.equal(source.numberOfPages, 666)
    await tap.equal(source.encodingFormat, 'epub')
    await tap.equal(source.json.property1, 'value1')
    await tap.equal(source.readingOrder.length, 2)
    await tap.equal(source.links.length, 2)
    await tap.equal(source.resources.length, 2)
    await tap.equal(source.wordCount, 123)
    await tap.equal(source.status, 99) // not converted back to a string yet
    await tap.equal(source.description, 'description goes here')

    // attributions
    const attributions = source.attributions
    await tap.ok(attributions)
    await tap.equal(attributions.length, 9)
    // metadata
    const metadata = source.metadata
    await tap.equal(metadata.url, 'http://www.something.com')
    await tap.ok(metadata.dateModified)
    await tap.equal(metadata.bookEdition, 'second edition')
    await tap.equal(metadata.bookFormat, 'EBook')
    await tap.equal(metadata.isbn, '1234')
    await tap.equal(metadata.copyrightYear, 1923)
    await tap.equal(metadata.genre, 'romance')
    await tap.equal(metadata.license, 'http://www.mylicense.com')
    await tap.equal(metadata.inDirection, 'ltr')
  })
  await tap.test('Update source name', async () => {
    const newSourceObj = {
      name: 'New name for source A'
    }

    // Update the source
    const newSource = await Source.update(source, newSourceObj)
    await tap.notOk(newSource instanceof Error)
    // Retrieve the Source that has just been updated
    const sourceRetrieved = await Source.byId(urlToId(source.id))

    await tap.ok(newSource)
    await tap.ok(newSource instanceof Source)
    await tap.equal(newSource.name, sourceRetrieved.name)
  })

  await tap.test('Update source datePublished', async () => {
    const timestamp = new Date(2018, 1, 30).toISOString()
    const newSourceObj = {
      datePublished: timestamp
    }

    const newSource = await Source.update(source, newSourceObj)
    await tap.notOk(newSource instanceof Error)

    // Retrieve the Source that has just been updated
    const sourceRetrieved = await Source.byId(urlToId(source.id))
    await tap.ok(newSource)
    await tap.ok(newSource instanceof Source)
    await tap.equal(
      newSource.datePublished.toString(),
      sourceRetrieved.datePublished.toString()
    )
  })

  await tap.test('Update source abstract', async () => {
    const newSourceObj = {
      abstract: 'New description for Source'
    }

    const newSource = await Source.update(source, newSourceObj)
    await tap.notOk(newSource instanceof Error)
    // Retrieve the Source that has just been updated
    const sourceRetrieved = await Source.byId(urlToId(source.id))

    await tap.ok(newSource)
    await tap.ok(newSource instanceof Source)
    await tap.equal(newSource.abstract, sourceRetrieved.abstract)
  })

  await tap.test('Update source json object', async () => {
    const newSourceObj = {
      json: { property: 'New value for json property' }
    }

    const newSource = await Source.update(source, newSourceObj)
    await tap.notOk(newSource instanceof Error)

    // Retrieve the Source that has just been updated
    const sourceRetrieved = await Source.byId(urlToId(source.id))

    await tap.ok(newSource)
    await tap.ok(newSource instanceof Source)
    await tap.equal(newSource.json.property, sourceRetrieved.json.property)
  })

  await tap.test('Update source numberOfPages', async () => {
    const newSourceObj = {
      numberOfPages: 555
    }

    const newSource = await Source.update(source, newSourceObj)
    await tap.notOk(newSource instanceof Error)

    // Retrieve the Source that has just been updated
    const sourceRetrieved = await Source.byId(urlToId(source.id))

    await tap.ok(newSource)
    await tap.ok(newSource instanceof Source)
    await tap.equal(sourceRetrieved.numberOfPages, 555)
  })

  await tap.test('Update source encodingFormat', async () => {
    const newSourceObj = {
      encodingFormat: 'pdf'
    }

    const newSource = await Source.update(source, newSourceObj)
    await tap.notOk(newSource instanceof Error)

    // Retrieve the Source that has just been updated
    const sourceRetrieved = await Source.byId(urlToId(source.id))

    await tap.ok(newSource)
    await tap.ok(newSource instanceof Source)
    await tap.equal(sourceRetrieved.encodingFormat, 'pdf')
  })

  await tap.test('Update source type', async () => {
    const newSourceObj = {
      type: 'Article'
    }

    const newSource = await Source.update(source, newSourceObj)
    await tap.notOk(newSource instanceof Error)

    // Retrieve the Source that has just been updated
    const sourceRetrieved = await Source.byId(urlToId(source.id))

    await tap.ok(newSource)
    await tap.ok(newSource instanceof Source)
    await tap.equal(sourceRetrieved.type, 'Article')
  })

  await tap.test('Update source metadata', async () => {
    const newSourceObj = {
      inLanguage: ['en', 'fr'],
      keywords: ['newKeyWord1', 'newKeyWord2']
    }
    const newSource = await Source.update(source, newSourceObj)
    await tap.notOk(newSource instanceof Error)

    // Retrieve the Source that has just been updated
    const sourceRetrieved = await Source.byId(urlToId(source.id))

    await tap.ok(newSource)
    await tap.ok(newSource instanceof Source)
    await tap.equal(
      newSource.metadata.keywords[0],
      sourceRetrieved.metadata.keywords[0]
    )
    await tap.equal(
      newSource.metadata.keywords[1],
      sourceRetrieved.metadata.keywords[1]
    )
    await tap.equal(
      newSource.metadata.inLanguage[0],
      sourceRetrieved.metadata.inLanguage[0]
    )
    await tap.equal(
      newSource.metadata.inLanguage[1],
      sourceRetrieved.metadata.inLanguage[1]
    )
  })

  await tap.test('Update source attribution with objects', async () => {
    const newSourceObj = {
      author: [
        { type: 'Person', name: 'New Sample Author' },
        { type: 'Organization', name: 'New Org inc.' }
      ],
      editor: [{ type: 'Person', name: 'New Sample Editor' }]
    }

    const newSource = await Source.update(source, newSourceObj)
    await tap.notOk(newSource instanceof Error)

    const attributions = await Attribution.getAttributionBySourceId(sourceId2)

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

    await tap.ok(newSource)
    await tap.ok(newSource instanceof Source)
    await tap.ok(
      newSource.author[0].name === 'New Sample Author' ||
        newSource.author[0].name === 'New Org inc.'
    )
    await tap.ok(
      newSource.author[1].name === 'New Sample Author' ||
        newSource.author[1].name === 'New Org inc.'
    )
    await tap.equal(newSource.editor[0].name, 'New Sample Editor')
    await tap.ok(attributions[0] instanceof Attribution)
    await tap.equal(attributions.length, 9)
    await tap.ok(newAuthor1Exists)
    await tap.ok(newAuthor2Exists)
    await tap.ok(newEditorExists)
  })

  await tap.test('Update source attribution with strings', async () => {
    const newSourceObj = {
      author: ['Sample String Author1', 'Sample String Author2'],
      editor: ['Sample String Editor1', 'Sample String Editor2'],
      contributor: ['New Sample Contributor'],
      creator: ['New Sample Creator'],
      illustrator: ['New Sample Illustrator'],
      publisher: ['New Sample Publisher'],
      translator: ['New Sample Translator']
    }

    const newSource = await Source.update(source, newSourceObj)
    await tap.notOk(newSource instanceof Error)

    const attributions = await Attribution.getAttributionBySourceId(sourceId2)

    let author1Exists = false
    let author2Exists = false
    let editor1Exists = false
    let editor2Exists = false
    let contributorExists = false
    let creatorExists = false
    let illustratorExists = false
    let publisherExists = false
    let translatorExists = false

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
      if (
        attributions[i].role === 'contributor' &&
        attributions[i].name === 'New Sample Contributor'
      ) {
        contributorExists = true
      }
      if (
        attributions[i].role === 'creator' &&
        attributions[i].name === 'New Sample Creator'
      ) {
        creatorExists = true
      }
      if (
        attributions[i].role === 'illustrator' &&
        attributions[i].name === 'New Sample Illustrator'
      ) {
        illustratorExists = true
      }
      if (
        attributions[i].role === 'publisher' &&
        attributions[i].name === 'New Sample Publisher'
      ) {
        publisherExists = true
      }
      if (
        attributions[i].role === 'translator' &&
        attributions[i].name === 'New Sample Translator'
      ) {
        translatorExists = true
      }
    }

    await tap.ok(newSource)
    await tap.ok(newSource instanceof Source)
    await tap.ok(attributions[0] instanceof Attribution)
    await tap.equal(attributions.length, 10)
    await tap.ok(author1Exists)
    await tap.ok(author2Exists)
    await tap.ok(editor1Exists)
    await tap.ok(editor2Exists)
    await tap.ok(contributorExists)
    await tap.ok(creatorExists)
    await tap.ok(illustratorExists)
    await tap.ok(publisherExists)
    await tap.ok(translatorExists)
  })

  await tap.test('Delete source', async () => {
    // Add Tag to the source
    const tagAdded = await Tag.createTag(urlToId(createdReader.id), {
      type: 'stack',
      name: 'tagAdded'
    })

    await Source_Tag.addTagToSource(sourceId, tagAdded.id)

    // Get the Source with new tags
    const source1 = await Source.byId(sourceId)

    await tap.equal(source1.tags.length, 1)
    await tap.equal(source1.tags[0].name, 'tagAdded')

    const res = await Source.delete(sourceId)

    await tap.ok(res.deleted)
    await tap.ok(!res.tags)
  })

  await tap.test('Delete all notes for a source', async () => {
    const createdNote1 = await Note.createNote(createdReader, {
      body: { motivation: 'test' },
      sourceId
    })

    const createdNote2 = await Note.createNote(createdReader, {
      body: { motivation: 'test' },
      sourceId
    })

    const res = await Source.deleteNotes(sourceId)
    await tap.equal(res, 2)

    const note1 = await Note.byId(urlToId(createdNote1.id))
    await tap.notOk(note1)

    const note2 = await Note.byId(urlToId(createdNote2.id))
    await tap.notOk(note2)
  })

  await tap.test('Turn a Source into a reference', async () => {
    // before
    const source2 = await Source.byId(sourceId2)
    await tap.ok(source2.links)
    await tap.ok(source2.resources)
    await tap.ok(source2.readingOrder)

    const result = await Source.toReference(sourceId2)
    await tap.ok(result.referenced)
    // await tap.notOk(result.links)
    // await tap.notOk(result.resources)
    // await tap.notOk(result.readingOrder)
  })

  await tap.test('Get SourceIds By Collection', async () => {
    // create a third source:
    let response = await Source.createSource(createdReader, simpleSource)
    sourceId3 = urlToId(response.id)

    // add tag to sources 2 and 3:
    await Source_Tag.addTagToSource(urlToId(sourceId2), createdTag.id)
    await Source_Tag.addTagToSource(urlToId(sourceId3), createdTag.id)

    // add tag2 to source1
    const createdTag2 = await Tag.createTag(urlToId(createdReader.id), {
      type: 'stack',
      name: 'mystack9'
    })

    await Source_Tag.addTagToSource(urlToId(sourceId), createdTag2.id)
    // get sourceIds by collection:
    let sourceIdsResponse = await Source_Tag.getIdsByCollection(
      createdTag.name,
      createdReader.id
    )
    await tap.ok(_.isArray(sourceIdsResponse))
    await tap.equal(sourceIdsResponse.length, 2)
    await tap.notEqual(sourceIdsResponse.indexOf(urlToId(sourceId2)), -1)
    await tap.notEqual(sourceIdsResponse.indexOf(urlToId(sourceId3)), -1)
  })

  await destroyDB(app)
}

module.exports = test
