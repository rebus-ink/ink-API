const request = require('supertest')
const tap = require('tap')
const app = require('../../server').app

const test = async () => {
  await tap.test('metrics', async () => {
    const res = await request(app)
      // .get(
      //   '/metrics?end=2020-07-13T15:33:12.800Z'
      // )
      // .get(
      //   '/metrics?start=2020-07-13T15:33:05.762Z&end=2020-07-13T15:34:12.649Z'
      // )
      .get('/metrics?groupBy=week&countOnly=true&format=csv')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    console.log(res.text)
    await tap.equal(1, 1)
  })
}

module.exports = test
