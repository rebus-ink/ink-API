const redis = require('redis')
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
})

const { promisify } = require('util')
const getAsync = promisify(client.get).bind(client)
const setASync = promisify(client.set).bind(client)

const { urlToId } = require('./utils')

const libraryCacheUpdate = async readerId => {
  readerId = urlToId(readerId)
  return await setASync(`${readerId}-library`, new Date().getTime(), 'EX', 100)
}

const libraryCacheGet = async (readerId, check) => {
  if (!check) return undefined // so we can skip when the 'if-modified-since' header is not used'
  readerId = urlToId(readerId)
  return await getAsync(`${readerId}-library`)
}

const quitCache = () => {
  client.quit()
}

module.exports = { libraryCacheUpdate, libraryCacheGet, quitCache }
