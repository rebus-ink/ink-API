const jwt = require('jsonwebtoken')
const request = require('supertest')
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

const createPublication = async (readerId, object = {}) => {
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

const createNote = async (app, token, readerId, object = {}) => {
  readerId = urlToId(readerId)
  const noteObject = Object.assign(
    {
      target: { property: 'something' },
      body: {
        motivation: 'test',
        content: 'something should go here, usually.'
      }
    },
    object
  )
  const response = await request(app)
    .post('/notes')
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
    .send(JSON.stringify(noteObject))

  return response.body
}

const createTag = async (app, token, object = {}) => {
  const tagObject = Object.assign(
    {
      type: 'stack',
      name: 'mystack'
    },
    object
  )
  const res = await request(app)
    .post('/tags')
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
    .send(JSON.stringify(tagObject))
  return res.body
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

const createNoteRelation = async (app, token, object) => {
  const res = await request(app)
    .post('/noteRelations')
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .send(object)

  return res.body
}

const createNoteContext = async (app, token, object) => {
  const contextObject = Object.assign(
    {
      type: 'test'
    },
    object
  )
  const res = await request(app)
    .post('/noteContexts')
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .send(contextObject)

  return res.body
}

const addNoteToContext = async (app, token, contextId, object) => {
  const noteObject = Object.assign(
    {
      target: { property: 'something' },
      body: {
        motivation: 'test',
        content: 'something should go here, usually.'
      }
    },
    object
  )
  const response = await request(app)
    .post(`/noteContexts/${contextId}/notes`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
    .send(JSON.stringify(noteObject))
  return response.body
}

const addPubToCollection = async (app, token, pubId, tagId) => {
  tagId = urlToId(tagId)
  pubId = urlToId(pubId)
  const res = await request(app)
    .put(`/publications/${pubId}/tags/${tagId}`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
  return res
}

const addNoteToCollection = async (app, token, noteId, tagId) => {
  tagId = urlToId(tagId)
  return await request(app)
    .put(`/notes/${noteId}/tags/${tagId}`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
}

module.exports = {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote,
  createTag,
  createDocument,
  addPubToCollection,
  addNoteToCollection,
  createNoteRelation,
  createNoteContext,
  addNoteToContext
}
