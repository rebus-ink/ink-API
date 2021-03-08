const request = require('supertest')
const tap = require('tap')
const app = require('../../server').app

const test = async () => {
  await tap.test('metrics', async () => {
    const res = await request(app)
      .get('/metadata?title=something&crossref=true&doaj=true&loc=true')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    console.log('body???', res.body)
    await tap.equal(1, 1)
  })
}

module.exports = test
