const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication
} = require('../../utils/testUtils')
const { Reader } = require('../../../models/Reader')
const { ReadActivity } = require('../../../models/ReadActivity')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerId = await createUser(app, token)

  // Create Reader object
  const person = {
    name: 'J. Random Reader'
  }
  const reader1 = await Reader.createReader(readerId, person)

  // Create Publication
  const publication = await createPublication(urlToId(readerId))
  const publicationId = urlToId(publication.id)

  await tap.test('Create Read activity with only a selector', async () => {
    const readActivity = await request(app)
      .post(`/publications/${publicationId}/readActivity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          selector: {
            type: 'XPathSelector',
            value: '/html/body/p[2]/table/tr[2]/td[3]/span'
          }
        })
      )
    await tap.equal(readActivity.statusCode, 201)
    const body = readActivity.body
    await tap.equal(body.selector.type, 'XPathSelector')
    await tap.equal(urlToId(body.publicationId), publicationId)

    // Get the latests ReadActivity
    const latestAct = await ReadActivity.getLatestReadActivity(publicationId)
    await tap.equal(latestAct.readerId, reader1.authId)
    await tap.equal(urlToId(latestAct.publicationId), publicationId)
  })

  await tap.test('Create a ReadActivity with json', async () => {
    const readActivity = await request(app)
      .post(`/publications/${publicationId}/readActivity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          selector: {
            type: 'XPathSelector',
            value: '/html/body/p[2]/table/tr[2]/td[3]/span'
          },
          json: { property: 'value' }
        })
      )

    // Get the latests ReadActivity
    const latestAct = await ReadActivity.getLatestReadActivity(publicationId)
    await tap.equal(readActivity.statusCode, 201)
    const body = readActivity.body
    await tap.equal(body.selector.type, 'XPathSelector')
    await tap.equal(urlToId(body.publicationId), publicationId)
    await tap.equal(body.json.property, 'value')
  })

  await tap.test(
    'Try to create a ReadActivity without a selector',
    async () => {
      const readActivity = await request(app)
        .post(`/publications/${publicationId}/readActivity`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify({ json: { property: 'value' } }))
      await tap.equal(readActivity.statusCode, 400)
      const error = JSON.parse(readActivity.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(error.details.type, 'Publication')
      await tap.equal(error.details.activity, 'Read')
      await tap.type(error.details.validation, 'object')
      await tap.equal(error.details.validation.selector[0].keyword, 'required')
      await tap.equal(
        error.details.validation.selector[0].params.missingProperty,
        'selector'
      )
    }
  )

  await tap.test(
    'Try to create a ReadActivity with invalid pubId',
    async () => {
      const res = await request(app)
        .post(`/publications/${publicationId}abc/readActivity`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send({
          selector: {
            type: 'XPathSelector',
            value: '/html/body/p[2]/table/tr[2]/td[3]/span'
          },
          json: { property: 'value' }
        })

      await tap.equal(res.statusCode, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(error.details.type, 'Publication')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Create Read Activity')
    }
  )

  await destroyDB(app)
}

module.exports = test
