const request = require('supertest')
const tap = require('tap')
const app = require('../../server').app

const _ = require('lodash')

const test = async () => {
  await tap.test('metrics', async () => {
    console.log('test??')
    const res = await request(app)
      .get(
        '/metrics?start=2020-07-13T15:33:05.762Z&end=2020-07-13T15:33:04.727Z'
      )
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    console.log(res.body)
    await tap.equal(1, 1)
  })
}

module.exports = test
