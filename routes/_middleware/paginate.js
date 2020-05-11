const paginate = (req, res, next) => {
  let limit = req.query.limit || 10
  if (typeof limit !== 'number' && !parseInt(limit)) limit = 10 // use default if input not valid

  if (limit < 10) limit = 10
  if (limit > 100) limit = 100
  req.query.limit = limit

  req.query.page = req.query.page ? parseInt(req.query.page) : 1
  if (isNaN(req.query.page)) req.query.page = 1

  req.skip = req.query.page * req.query.limit - req.query.limit

  next()
}

module.exports = paginate
