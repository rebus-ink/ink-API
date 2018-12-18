const checkReader = (req, reader) => {
  return `auth0|${req.user}` === reader.userId
}

module.exports = { checkReader }
