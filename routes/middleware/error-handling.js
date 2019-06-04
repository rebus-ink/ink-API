const { ValidationError } = require('objection')

const errorHandling = (err, req, res, next) => {
  // if (err instanceof ValidationError) {
  //   return res.status(err.statusCode)
  // }

  if (err) {
    if (err.data && err.output) err.output.payload.details = err.data
    if (err.output) {
      return res.status(err.output.statusCode).json(err.output.payload)
    } else if (err.statusCode) {
      return res.status(err.statusCode).json(err.data)
    }
  }
}

module.exports = errorHandling
