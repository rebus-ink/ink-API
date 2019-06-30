const request = require('supertest')
const app = require('../../../server').app

const createNotes = async (
  token,
  readerUrl,
  publicationUrl,
  documentUrl,
  number = 1
) => {
  let promises = []

  for (let i = 0; i < number; i++) {
    promises.push(
      request(app)
        .post(`${readerUrl}/activity`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
        .send(
          JSON.stringify({
            '@context': [
              'https://www.w3.org/ns/activitystreams',
              { reader: 'https://rebus.foundation/ns/reader' }
            ],
            type: 'Create',
            object: {
              type: 'Note',
              content:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce id felis dui. Ut dictum mauris nulla, ornare feugiat mi facilisis id. Vestibulum non volutpat ante. Etiam eget egestas velit. Duis eget porta leo, vitae varius sem. In fringilla cursus orci, id semper dui imperdiet sit amet. Nulla eget mi non eros pretium faucibus vel sed est. Curabitur aliquet nisl risus, at tempus turpis dictum maximus. Proin tincidunt non lacus nec pulvinar. Duis vulputate metus diam. Donec efficitur orci turpis. Cras tristique eros sed massa efficitur, gravida malesuada turpis egestas. Mauris venenatis ut orci in pharetra.',
              'oa:hasSelector': {},
              noteType: 'something',
              context: publicationUrl,
              inReplyTo: documentUrl
            }
          })
        )
    )
  }

  await Promise.all(promises)
}

module.exports = createNotes
