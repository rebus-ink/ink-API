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
  return path.substring(path.indexOf('-') + 1)
}

const createActivityObject = (body, result, reader) => {
  let props = Object.assign(body, {
    actor: {
      type: 'Person',
      id: urlToId(reader.id)
    },
    readerId: urlToId(reader.id)
  })
  if (result) {
    props = Object.assign(props, {
      object: {
        type: result.type,
        id: result.id
      }
    })
  }
  return props
}

module.exports = { checkReader, urlToId, createActivityObject, checkOwnership }
