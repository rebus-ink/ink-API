const redis = require('redis')
const { urlToId } = require('./utils')

// this is to make sure that the tests work properly on pull requests:
// the cache is not used in pull requests because travis does not have access to the redis password
let libraryCacheGet = async () => Promise.resolve()
let libraryCacheUpdate = () => undefined
let notesCacheGet = async () => Promise.resolve()
let notesCacheUpdate = () => undefined
let tagsCacheGet = async () => Promise.resolve()
let tagsCacheUpdate = () => undefined
let notebooksCacheUpdate = () => undefined
let notebooksCacheGet = async () => Promise.resolve()
let quitCache = () => undefined

if (process.env.REDIS_PASSWORD) {

  let client

  connectClient = async () => {
    client = await redis.createClient({
      url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${
        process.env.REDIS_PORT
      }`
    })
    await client.connect()
  }

  libraryCacheUpdate = async readerId => {
    readerId = urlToId(readerId)
    return await client.set(
      `${readerId}-library`,
      new Date().getTime(),
      'EX',
      3600
    )
  }

  libraryCacheGet = async (readerId, check) => {
    if (!check) return undefined // so we can skip when the 'if-modified-since' header is not used'
    readerId = urlToId(readerId)
    return await client.get(`${readerId}-library`)
  }

  notesCacheUpdate = async readerId => {
    readerId = urlToId(readerId)
    return await client.set(
      `${readerId}-notes`,
      new Date().getTime(),
      'EX',
      3600
    )
  }

  notesCacheGet = async (readerId, check) => {
    if (!check) return undefined // so we can skip when the 'if-modified-since' header is not used'
    readerId = urlToId(readerId)
    return await client.get(`${readerId}-notes`)
  }

  tagsCacheUpdate = async readerId => {
    return await client.set(
      `${readerId}-tags`,
      new Date().getTime(),
      'EX',
      3600
    )
  }

  tagsCacheGet = async (readerId, check) => {
    if (!check) return undefined // so we can skip when the 'if-modified-since' header is not used'
    return await client.get(`${readerId}-tags`)
  }
  notebooksCacheUpdate = async readerId => {
    return await client.set(
      `${readerId}-notebooks`,
      new Date().getTime(),
      'EX',
      3600
    )
  }

  notebooksCacheGet = async (readerId, check) => {
    if (!check) return undefined // so we can skip when the 'if-modified-since' header is not used'
    return await client.get(`${readerId}-notebooks`)
  }

  quitCache = () => {
    client.quit()
  }
}

module.exports = {
  libraryCacheUpdate,
  libraryCacheGet,
  quitCache,
  notesCacheGet,
  notesCacheUpdate,
  tagsCacheGet,
  tagsCacheUpdate,
  notebooksCacheGet,
  notebooksCacheUpdate,
  connectClient
}
