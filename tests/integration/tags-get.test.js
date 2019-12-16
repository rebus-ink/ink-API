const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB, createTag } = require('../utils/utils')
const { urlToId } = require('../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path
  const readerId = urlToId(readerCompleteUrl)

  await createTag(app, token, readerUrl, { name: 'tag1' })
  await createTag(app, token, readerUrl, { name: 'tag2' })

  await tap.test('Get Tags', async () => {
    const res = await request(app)
      .get('/tags')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    console.log(res.body)
  })

  await destroyDB(app)
}

module.exports = test
