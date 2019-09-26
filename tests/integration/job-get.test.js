const request = require('supertest')
const tap = require('tap')
const { Job } = require('../../models/Job')
const { urlToId } = require('../../utils/utils')
const { getToken, createUser, destroyDB } = require('../utils/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerId = await createUser(app, token)

  // create job
  const job = await Job.createJob({
    type: 'epub',
    readerId: urlToId(readerId),
    publicationId: 'pub123'
  })
  await tap.test('Get Job', async () => {
    const res = await request(app)
      .get(`/job-${job.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body

    await tap.type(body, 'object')
    await tap.type(body.id, 'number')
    await tap.equal(body.type, 'epub')
    await tap.equal(body.status, 304)
    await tap.equal(body.publicationId, 'pub123')
    await tap.equal(body.readerId, urlToId(readerId))
  })

  await tap.test('Get Job that does not exist', async () => {
    const res = await request(app)
      .get(`/job-0`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)

    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.details.type, 'Job')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Get Job')
  })

  await destroyDB(app)
  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
}

module.exports = test
