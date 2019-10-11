const tap = require('tap')
const { destroyDB } = require('../utils/utils')
const { Job } = require('../../models/Job')
const { Reader } = require('../../models/Reader')
const crypto = require('crypto')
const { urlToId } = require('../../utils/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const reader = {
    name: 'J. Random Reader'
  }
  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const jobObject = {
    type: 'epub',
    readerId: createdReader.id,
    publicationId: 'pub123'
  }

  const jobObject2 = {
    type: 'epub',
    readerId: createdReader.id,
    publicationId: 'pub1234'
  }

  let id, id2

  await tap.test('Create Job', async () => {
    let response = await Job.createJob(jobObject)

    await tap.ok(response)
    await tap.type(response, 'object')
    await tap.ok(response.id)
    await tap.type(response.type, 'string')
    await tap.equal(response.type, 'epub')
    await tap.equal(response.readerId, urlToId(createdReader.id))
    await tap.equal(response.publicationId, 'pub123')
    await tap.ok(response.published)
    await tap.notOk(response.finished)
    await tap.notOk(response.error)
    id = response.id
  })

  await tap.test('Get by id - incomplete', async () => {
    const response = await Job.byId(id)
    await tap.equal(response.status, 304)
  })

  await tap.test('Finish a job', async () => {
    const response = await Job.updateJob(id, {
      finished: new Date().toISOString()
    })
    await tap.ok(response)
    await tap.ok(response.published)
    await tap.ok(response.finished)
    await tap.notOk(response.error)
  })

  await tap.test('Get job status by id - finished', async () => {
    const response = await Job.byId(id)
    await tap.equal(response.status, 302)
  })

  await tap.test('Error on a job', async () => {
    // first create a new job
    const job2 = await Job.createJob(jobObject2)
    id2 = job2.id

    const response = await Job.updateJob(id2, {
      finished: new Date().toISOString(),
      error: 'error 123'
    })
    await tap.ok(response)
    await tap.ok(response.published)
    await tap.ok(response.finished)
    await tap.ok(response.error)
  })

  await tap.test('Get job status by id - error', async () => {
    const response = await Job.byId(id2)

    await tap.equal(response.status, 500)
    await tap.equal(response.error, 'error 123')
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
