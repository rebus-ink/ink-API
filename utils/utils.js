const parseurl = require('url').parse

const checkReader = (req, reader) => {
  return req.user === reader.authId
}

const checkOwnership = (readerId, resourceId) => {
  readerId = urlToId(readerId)
  resourceId = urlToId(resourceId)
  return resourceId.startsWith(readerId)
}

const urlToId = url => {
  if (!url) return undefined
  if (!url.startsWith('http')) return url
  let path = parseurl(url).path
  if (path.endsWith('/')) path = path.substring(0, path.length - 1)
  if (path.startsWith('/publications/')) {
    return path.substring(14) // 14 is '/publications/'.length
  }
  if (path.startsWith('/readers/')) {
    return path.substring(9)
  }
  if (path.startsWith('/notes/')) {
    return path.substring(7)
  }
  return path.substring(path.indexOf('-') + 1)
}

module.exports = { checkReader, urlToId, checkOwnership }
