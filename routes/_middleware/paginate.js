const debug = require('debug')('ink:middleware:paginate')

const paginate = (req, res, next) => {
  debug('req.query.limit was initially: ', req.query.limit)
  debug('req.query.page was initially set to: ', req.query.page)
  let limit = req.query.limit || 10
  if (typeof limit !== 'number' && !parseInt(limit)) limit = 10 // use default if input not valid

  if (limit < 10) limit = 10
  if (limit > 100) limit = 100
  req.query.limit = limit

  req.query.page = req.query.page ? parseInt(req.query.page) : 1
  if (isNaN(req.query.page)) req.query.page = 1

  req.skip = req.query.page * req.query.limit - req.query.limit
  debug('req.query.limit set to:', req.query.limit)
  debug('req.query.page set to: ', req.query.page)
  next()
}

module.exports = paginate
