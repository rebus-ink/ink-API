const parseurl = require('url').parse
const short = require('short-uuid')
const translator = short()

const checkReader = (req, reader) => {
  return `auth0|${req.user}` === reader.userId
}

const urlToId = url => {
  const path = parseurl(url).path
  const shortId = path.substring(path.indexOf('-') + 1)
  return translator.toUUID(shortId)
}

const urlToShortId = url => {
  const path = parseurl(url).path
  return path.substring(path.indexOf('-') + 1)
}

module.exports = { checkReader, urlToId, urlToShortId }
