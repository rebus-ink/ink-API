const parseurl = require('url').parse
const _ = require('lodash')

const checkReader = (req, reader) => {
  return req.user === reader.authId
}

const checkOwnership = (readerId, resourceId) => {
  readerId = urlToId(readerId)
  resourceId = urlToId(resourceId)
  if (!resourceId) return false
  return resourceId.startsWith(readerId)
}

const checkNotebookCollaborator = (readerId, notebooks) => {
  if (!notebooks) return {}
  if (!_.isArray(notebooks)) notebooks = [notebooks]

  readerId = urlToId(readerId)
  let result = {}
  notebooks.forEach(notebook => {
    const collaborator = _.find(notebook.collaborators, collab => {
      return urlToId(collab.readerId) === readerId
    })
    if (collaborator && collaborator.status === 2) {
      result = collaborator.permission
    }
  })
  return result
}

const urlToId = url => {
  if (url === null) return null
  if (!url) return undefined
  if (!url.startsWith('http')) return url
  let path = parseurl(url).path.substring(1) // remove first '/'
  if (path.endsWith('/')) path = path.substring(0, path.length - 1)
  return path.substring(path.indexOf('/') + 1)
}

module.exports = {
  checkReader,
  urlToId,
  checkOwnership,
  checkNotebookCollaborator
}
