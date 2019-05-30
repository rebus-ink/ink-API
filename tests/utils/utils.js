const jwt = require('jsonwebtoken')
const request = require('supertest')
const fs = require('fs')
const urlparse = require('url').parse
const knexCleaner = require('knex-cleaner')

const getToken = () => {
  const options = {
    subject: `foo${Date.now()}`,
    expiresIn: '24h',
    issuer: process.env.ISSUER
  }

  return jwt.sign({}, process.env.SECRETORKEY, options)
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
  if (!process.env.POSTGRE_INSTANCE && process.env.NODE_ENV === 'test') {
    await fs.unlinkSync('./test.sqlite3')
  } else if (process.env.NODE_ENV === 'test') {
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

const createPublication = async (app, token, readerUrl, object = {}) => {
  const publicationDate = new Date(2002, 12, 25).toISOString()

  const pubObject = Object.assign(
    {
      type: 'Publication',
      name: 'publication name',
      author: 'generic author',
      editor: 'generic editor',
      description: 'this is a description!!',
      keywords: 'one, two',
      datePublished: publicationDate,
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
      ],
      json: { property: 'value' }
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
        object: pubObject
      })
    )
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

module.exports = {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl,
  createPublication,
  createNote
}
