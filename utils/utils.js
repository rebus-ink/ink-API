const parseurl = require('url').parse

const checkReader = (req, reader) => {
  return req.user === reader.authId
}

const urlToId = url => {
  if (!url) return undefined
  if (!url.startsWith('http')) return url
  let path = parseurl(url).path
  if (path.endsWith('/')) path = path.substring(0, path.length - 1)
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

module.exports = { checkReader, urlToId, createActivityObject }
