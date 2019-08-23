const request = require('request')
const util = require('util')

const requestPost = util.promisify(request.post)

const createNotes = async (token, readerUrl, publicationUrl, number = 1) => {
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
            type: 'Note',
            content:
              'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce id felis dui. Ut dictum mauris nulla, ornare feugiat mi facilisis id. Vestibulum non volutpat ante. Etiam eget egestas velit. Duis eget porta leo, vitae varius sem. In fringilla cursus orci, id semper dui imperdiet sit amet. Nulla eget mi non eros pretium faucibus vel sed est. Curabitur aliquet nisl risus, at tempus turpis dictum maximus. Proin tincidunt non lacus nec pulvinar. Duis vulputate metus diam. Donec efficitur orci turpis. Cras tristique eros sed massa efficitur, gravida malesuada turpis egestas. Mauris venenatis ut orci in pharetra.',
            'oa:hasSelector': {},
            noteType: 'something',
            context: publicationUrl
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

module.exports = createNotes
