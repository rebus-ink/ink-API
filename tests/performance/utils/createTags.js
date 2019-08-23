const crypto = require('crypto')
const request = require('request')
const util = require('util')

const requestPost = util.promisify(request.post)

const createTags = async (token, readerUrl, number = 1) => {
  let promises = []

  for (let i = 0; i < number; i++) {
    promises.push(
      requestPost(`${readerUrl}/activity`, {
        body: JSON.stringify({
          '@context': [
            'https://www.w3.org/ns/activitystreams',
            { reader: 'https://rebus.foundation/ns/reader' }
          ],
          type: 'Create',
          object: {
            type: 'reader:Tag',
            tagType: 'reader:Stack',
            name: crypto.randomBytes(8).toString('hex')
          }
        }),
        auth: {
          bearer: token
        },
        headers: {
          'content-type':
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        }
      })
    )
  }

  await Promise.all(promises)
}

module.exports = createTags
