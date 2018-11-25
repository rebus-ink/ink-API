class NoSuchReaderError extends Error {
  constructor ({ shortId, userId } = {}) {
    if (userId) {
      super(`No reader for user ${userId}`)
    } else if (shortId) {
      super(`No reader for shortId ${shortId}`)
    } else {
      super(`No such reader`)
    }
  }
}

module.exports = NoSuchReaderError
