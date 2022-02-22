const jwt = require('jsonwebtoken')
const request = require('supertest')
const knexCleaner = require('knex-cleaner')
const { urlToId } = require('../../utils/utils')
require('dotenv').config()
const crypto = require('crypto')

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

const createReader = async (app, token, object = {}) => {
  const readerObject = Object.assign(
    {
      name: 'test name'
    },
    object
  )

  const response = await request(app)
    .post('/readers')
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
    .send(JSON.stringify(readerObject))

  return response.body
}

const createSource = async (app, token, object = {}) => {
  const sourceDate = new Date(2002, 12, 25).toISOString()
  const sourceObject = Object.assign(
    {
      type: 'Book',
      name: 'source name',
      author: 'generic author',
      editor: 'generic editor',
      abstract: 'this is a description!!',
      numberOfPages: 100,
      encodingFormat: 'epub',
      keywords: 'one, two',
      datePublished: sourceDate,
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

  const response = await request(app)
    .post('/sources')
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
    .send(JSON.stringify(sourceObject))

  return response.body
}

const createNote = async (app, token, object = {}) => {
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

const createReadActivity = async (app, token, sourceId, object = {}) => {
  const readActivityObject = Object.assign(
    {
      selector: {
        type: 'XPathSelector',
        value: '/html/body/p[2]/table/tr[2]/td[3]/span'
      }
    },
    object
  )
  const response = await request(app)
    .post(`/sources/${sourceId}/readActivity`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
    .send(JSON.stringify(readActivityObject))

  return response.body
}

const updateNote = async (app, token, object) => {
  const response = await request(app)
    .put(`/notes/${object.shortId}`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
    .send(JSON.stringify(object))

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

const createOutline = async (app, token, object) => {
  const contextObject = Object.assign(
    {
      type: 'outline'
    },
    object
  )
  const res = await request(app)
    .post('/outlines')
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .send(contextObject)

  return res.body
}

const addNoteToOutline = async (app, token, contextId, object) => {
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
    .post(`/outlines/${contextId}/notes`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
    .send(JSON.stringify(noteObject))
  return response.body
}

const addSourceToCollection = async (app, token, sourceId, tagId) => {
  tagId = urlToId(tagId)
  sourceId = urlToId(sourceId)
  const res = await request(app)
    .put(`/sources/${sourceId}/tags/${tagId}`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
  return res
}

const addSourceToNotebook = async (app, token, sourceId, notebookId) => {
  sourceId = urlToId(sourceId)
  notebookId = urlToId(notebookId)
  const res = await request(app)
    .put(`/notebooks/${notebookId}/sources/${sourceId}`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
  return res
}

const addNoteToNotebook = async (app, token, noteId, notebookId) => {
  noteId = urlToId(noteId)
  notebookId = urlToId(notebookId)
  const res = await request(app)
    .put(`/notebooks/${notebookId}/notes/${noteId}`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
  return res
}

const addTagToNotebook = async (app, token, tagId, notebookId) => {
  tagId = urlToId(tagId)
  notebookId = urlToId(notebookId)
  const res = await request(app)
    .put(`/notebooks/${notebookId}/tags/${tagId}`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
  return res
}

const addNoteToCollection = async (app, token, noteId, tagId) => {
  tagId = urlToId(tagId)
  const res = await request(app)
    .put(`/notes/${noteId}/tags/${tagId}`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
  return res
}

const createNotebook = async (app, token, object) => {
  const notebookObject = Object.assign(
    {
      name: 'test'
    },
    object
  )
  const res = await request(app)
    .post('/notebooks')
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .send(notebookObject)

  return res.body
}

const createCollaborator = async (app, token, notebookId, object) => {
  const res = await request(app)
    .post(`/notebooks/${notebookId}/collaborators`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .send(object)
  return res.body
}

module.exports = {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNote,
  createTag,
  addSourceToCollection,
  addNoteToCollection,
  createNoteRelation,
  createNoteContext,
  createReadActivity,
  addNoteToContext,
  updateNote,
  addNoteToOutline,
  createReader,
  createOutline,
  createNotebook,
  addSourceToNotebook,
  addNoteToNotebook,
  addTagToNotebook,
  createCollaborator
}
