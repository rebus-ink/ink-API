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
  const client = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  })

  const { promisify } = require('util')
  const getAsync = promisify(client.get).bind(client)
  const setASync = promisify(client.set).bind(client)

  libraryCacheUpdate = async readerId => {
    readerId = urlToId(readerId)
    return await setASync(
      `${readerId}-library`,
      new Date().getTime(),
      'EX',
      3600
    )
  }

  libraryCacheGet = async (readerId, check) => {
    if (!check) return undefined // so we can skip when the 'if-modified-since' header is not used'
    readerId = urlToId(readerId)
    return await getAsync(`${readerId}-library`)
  }

  notesCacheUpdate = async readerId => {
    readerId = urlToId(readerId)
    return await setASync(`${readerId}-notes`, new Date().getTime(), 'EX', 3600)
  }

  notesCacheGet = async (readerId, check) => {
    if (!check) return undefined // so we can skip when the 'if-modified-since' header is not used'
    readerId = urlToId(readerId)
    return await getAsync(`${readerId}-notes`)
  }

  tagsCacheUpdate = async readerId => {
    return await setASync(`${readerId}-tags`, new Date().getTime(), 'EX', 3600)
  }

  tagsCacheGet = async (readerId, check) => {
    if (!check) return undefined // so we can skip when the 'if-modified-since' header is not used'
    return await getAsync(`${readerId}-tags`)
  }
  notebooksCacheUpdate = async readerId => {
    return await setASync(
      `${readerId}-notebooks`,
      new Date().getTime(),
      'EX',
      3600
    )
  }

  notebooksCacheGet = async (readerId, check) => {
    if (!check) return undefined // so we can skip when the 'if-modified-since' header is not used'
    return await getAsync(`${readerId}-notebooks`)
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
  notebooksCacheUpdate
}
