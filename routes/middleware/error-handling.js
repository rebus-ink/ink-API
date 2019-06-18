// eslint-disable-next-line no-unused-vars
const errorHandling = (err, req, res, next) => {
  if (err) {
    if (err.data && err.output) err.output.payload.details = err.data
    if (err.output) {
      return res.status(err.output.statusCode).json(err.output.payload)
    } else if (err.statusCode) {
      return res.status(err.statusCode).json(err.data)
    }
    console.log(err)
    return res.status(500).send(err)
  }
}

module.exports = errorHandling
