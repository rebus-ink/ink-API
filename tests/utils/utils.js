const jwt = require('jsonwebtoken')
const request = require('supertest')
const fs = require('fs')
const urlparse = require('url').parse
const knexCleaner = require('knex-cleaner')
const _ = require('lodash')
const { Document } = require('../../models/Document')
const { urlToId } = require('../../utils/utils')
require('dotenv').config()
const crypto = require('crypto')
const { Publication } = require('../../models/Publication')

const getToken = () => {
  const options = {
    algorithm: 'HS256',
    audience: 'REBUS_API',
    subject: `foo${Date.now()}`,
    expiresIn: '24h',
    issuer: process.env.ISSUER
  }
  return jwt.sign(
    { id: crypto.randomBytes(16).toString('hex') },
    process.env.SECRETORKEY,
    options
  )
}

const createUser = async (app, token) => {
  await request(app)
    .post('/readers')
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .send(
      JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        name: 'J. Random Reader'
      })
    )

  const res = await request(app)
    .get('/whoami')
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)

  return res.body.id
}

const destroyDB = async app => {
  if (process.env.NODE_ENV === 'test') {
    await knexCleaner.clean(app.knex)
  }
}

const getActivityFromUrl = async (app, url, token) => {
  const res = await request(app)
    .get(urlparse(url).path)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

  return res.body
}

const createPublication = async (readerUrl, object = {}) => {
  let readerId
  if (_.isString(readerUrl)) readerId = readerUrl.substring(8)

  const publicationDate = new Date(2002, 12, 25).toISOString()
  const pubObject = Object.assign(
    {
      type: 'Book',
      name: 'publication name',
      author: 'generic author',
      editor: 'generic editor',
      abstract: 'this is a description!!',
      numberOfPages: 100,
      encodingFormat: 'epub',
      keywords: 'one, two',
      datePublished: publicationDate,
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
          encodingFormat: 'text/html',
          name: 'An example link2'
        }
      ],
      links: [
        {
          type: 'Link',
          url: 'http://example.org/abc3',
          encodingFormat: 'text/html',
          name: 'An example link3'
        },
        {
          type: 'Link',
          url: 'http://example.org/abc4',
          encodingFormat: 'text/html',
          name: 'An example link4'
        }
      ],
      resources: [
        {
          type: 'Link',
          url: 'http://example.org/abc5',
          encodingFormat: 'text/html',
          name: 'An example link5'
        },
        {
          type: 'Link',
          url: 'http://example.org/abc6',
          encodingFormat: 'text/html',
          name: 'An example link6'
        }
      ],
      json: { property: 'value' }
    },
    object
  )
  return await Publication.createPublication({ id: readerId }, pubObject)
}

const createNote = async (app, token, readerUrl, object = {}) => {
  const noteObject = Object.assign(
    {
      type: 'Note',
      content: 'test content',
      'oa:hasSelector': { propety: 'value' },
      context: '',
      inReplyTo: '',
      noteType: 'test',
      json: { property1: 'value1' }
    },
    object
  )

  return await request(app)
    .post(`${readerUrl}/activity`)
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
        object: noteObject
      })
    )
}

const createActivity = async (app, token, readerUrl, object = {}) => {
  const activityObject = Object.assign(
    {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        { reader: 'https://rebus.foundation/ns/reader' }
      ],
      type: 'Create',
      object: { type: 'Publication', name: 'something' }
    },
    object
  )

  return await request(app)
    .post(`${readerUrl}/activity`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )
    .send(JSON.stringify(activityObject))
}

const createTag = async (app, token, readerUrl, object = {}) => {
  const tagObject = Object.assign(
    {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'mystack'
    },
    object
  )

  return await request(app)
    .post(`${readerUrl}/activity`)
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
        object: tagObject
      })
    )
}

const createDocument = async (readerId, publicationId, object = {}) => {
  const documentObject = Object.assign(
    {
      documentPath: 'path/1',
      mediaType: 'text/html',
      url: 'http://something/123'
    },
    object
  )

  return await Document.createDocument(
    { id: urlToId(readerId) },
    urlToId(publicationId),
    documentObject
  )
}

const addPubToCollection = async (app, token, readerUrl, pubId, tagId) => {
  return await request(app)
    .post(`${readerUrl}/activity`)
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
        type: 'Add',
        object: { id: tagId, type: 'reader:Tag' },
        target: { id: pubId, type: 'Publication' }
      })
    )
}

const addNoteToCollection = async (app, token, readerUrl, noteId, tagId) => {
  return await request(app)
    .post(`${readerUrl}/activity`)
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
        type: 'Add',
        object: { id: tagId, type: 'reader:Tag' },
        target: { id: noteId, type: 'Note' }
      })
    )
}

module.exports = {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl,
  createPublication,
  createNote,
  createActivity,
  createTag,
  createDocument,
  addPubToCollection,
  addNoteToCollection
}
