const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const { Activity } = require('../../models/Activity')
const { Reader } = require('../../models/Reader')
const parseurl = require('url').parse

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const newActivity = Object.assign(new Activity(), {
    type: 'Activity',
    json: {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        { reader: 'https://rebus.foundation/ns/reader' }
      ],
      type: 'Arrive',
      location: {
        id: 'https://places.test/rebus-foundation-office',
        type: 'Place',
        nameMap: {
          en: 'Rebus Foundation Office'
        }
      },
      summaryMap: { en: 'neutral activity' }
    },
    documentId: null,
    noteId: null,
    published: '2018-12-18T14:56:53.173Z',
    updated: '2018-12-18 14:56:53',
    publication: null,
    document: null,
    note: null
  })

  const reader = {
    name: 'J. Random Reader',
    userId: 'auth0|foo1545149868961'
  }

  const createdReader = await Reader.createReader(
    'auth0|foo1545149868961',
    reader
  )

  newActivity.reader = createdReader
  newActivity.readerId = createdReader.id

  let id

  await tap.test('Create Activity', async () => {
    let response = await Activity.createActivity(newActivity)
    await tap.ok(response)
    await tap.type(response, 'object')
    await tap.equal(response.type, 'Activity')
    id = parseurl(response.url).path.substr(10)
  })

  await tap.test('Get activity by short id', async () => {
    const activity = await Activity.byShortId(id)
    await tap.type(activity, 'object')
    await tap.equal(activity.type, 'Activity')
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
