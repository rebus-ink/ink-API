class NoSuchReaderError extends Error {
  constructor ({ shortId, userId: readerId } = {}) {
    if (readerId) {
      super(`No reader for user ${readerId}`)
    } else if (shortId) {
      super(`No reader for shortId ${shortId}`)
    } else {
      super(`No such reader`)
    }
  }
}

module.exports = NoSuchReaderError
