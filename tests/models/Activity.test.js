const tap = require('tap')
const { destroyDB } = require('../utils/utils')
const { Activity } = require('../../models/Activity')
const { Reader } = require('../../models/Reader')
const crypto = require('crypto')
const { urlToId } = require('../../utils/utils')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }
  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const activityObject = {
    type: 'Arrive',
    readerId: urlToId(createdReader.id),
    object: {
      type: 'Document'
    },
    target: {
      type: 'Tag',
      property: 'something'
    },
    json: { property: 'value' }
  }

  const simpleActivityObject = {
    type: 'Something',
    readerId: urlToId(createdReader.id)
  }

  let id

  await tap.test('Create Activity', async () => {
    let response = await Activity.createActivity(activityObject)

    await tap.ok(response)
    await tap.type(response, 'object')
    await tap.ok(response.id.startsWith('http'))
    await tap.type(response.type, 'string')
    await tap.equal(response.type, 'Arrive')
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(response.json.property, 'value')
    await tap.equal(response.object.type, 'Document')
    await tap.equal(response.target.property, 'something')
    id = urlToId(response.id)
  })

  await tap.test('Create Simple Activity', async () => {
    let response = await Activity.createActivity(simpleActivityObject)
    await tap.ok(response)
    await tap.type(response, 'object')
    await tap.ok(response.id.startsWith('http'))
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(response.type, 'Something')
  })

  await tap.test('Get activity by id', async () => {
    const response = await Activity.byId(urlToId(id))
    await tap.type(response, 'object')
    await tap.ok(response.id.startsWith('http'))
    await tap.type(response.type, 'string')
    await tap.equal(response.type, 'Arrive')
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(response.json.property, 'value')
    await tap.equal(response.object.type, 'Document')
    await tap.equal(response.target.property, 'something')
    // eager loading reader:
    await tap.type(response.reader, 'object')
    await tap.equal(response.reader.id, createdReader.id)
    await tap.ok(response.reader.id.startsWith('http'))
    await tap.equal(response.reader.name, reader.name)
  })

  await destroyDB(app)
}

module.exports = test
