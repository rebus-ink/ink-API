const debug = require('debug')('ink:middleware:error handling')

// eslint-disable-next-line no-unused-vars
const errorHandling = (err, req, res, next) => {
  debug('error: ', err.message)
  if (err) {
    if (err.data && err.output) err.output.payload.details = err.data
    if (err.output) {
      return res.status(err.output.statusCode).json(err.output.payload)
    } else if (err.statusCode) {
      return res.status(err.statusCode).json(err.data)
    }
    debug('uncaught error: ', err)
    console.log('uncaught error: ', err)
    return next(err)
  }
}

module.exports = errorHandling
