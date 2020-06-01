const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource
} = require('../../utils/testUtils')
const app = require('../../../server').app

const test = async () => {
  const token = getToken()
  await createUser(app, token)

  const createSourceSimplified = async object => {
    return await createSource(app, token, object)
  }

  await createSourceSimplified({ name: 'Source 1' })
  await createSourceSimplified({ name: 'Source 2' })
  await createSourceSimplified({ name: 'Source 3' })
  await createSourceSimplified({ name: 'Source 4' })
  await createSourceSimplified({ name: 'Source 5' })
  await createSourceSimplified({ name: 'Source 6' })
  await createSourceSimplified({ name: 'Source 7' })
  await createSourceSimplified({ name: 'Source 8' })
  await createSourceSimplified({ name: 'Source 9' })
  await createSourceSimplified({ name: 'Source 10' })
  await createSourceSimplified({ name: 'Source 11' })
  await createSourceSimplified({ name: 'Source 12' })
  await createSourceSimplified({ name: 'Source 13' })

  await tap.test('By default, Library paginated to 10 per page', async () => {
    const res = await request(app)
      .get(`/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 13)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    await tap.equal(body.items.length, 10)
    await tap.equal(body.items[0].name, 'Source 13')
    await tap.equal(body.items[9].name, 'Source 4')
    await tap.equal(body.page, 1)
    await tap.equal(body.pageSize, 10)
  })

  await tap.test('Paginate library by setting limit', async () => {
    const res = await request(app)
      .get(`/library?limit=11`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 13)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    await tap.equal(body.items.length, 11)
    await tap.equal(body.items[0].name, 'Source 13')
    await tap.equal(body.items[9].name, 'Source 4')
    await tap.equal(body.page, 1)
    await tap.equal(body.pageSize, 11)
  })

  await tap.test('Paginate Library by setting page', async () => {
    const res = await request(app)
      .get(`/library?page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 13)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    await tap.equal(body.items.length, 3)
    await tap.equal(body.items[0].name, 'Source 3')
    await tap.equal(body.items[2].name, 'Source 1')
    await tap.equal(body.page, 2)
    await tap.equal(body.pageSize, 10)
  })

  await tap.test('Paginate Library by setting limit and page', async () => {
    const res = await request(app)
      .get(`/library?limit=11&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 13)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    await tap.equal(body.items.length, 2)
    await tap.equal(body.items[0].name, 'Source 2')
    await tap.equal(body.items[1].name, 'Source 1')
    await tap.equal(body.page, 2)
    await tap.equal(body.pageSize, 11)
  })

  await tap.test(
    'Paginate Library with limit over the number of sources',
    async () => {
      const res = await request(app)
        .get(`/library?limit=20`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 200)

      const body = res.body
      await tap.type(body, 'object')
      await tap.equal(body.totalItems, 13)
      await tap.ok(Array.isArray(body.items))
      // documents should include:
      await tap.equal(body.items.length, 13)
      await tap.equal(body.items[0].name, 'Source 13')
      await tap.equal(body.items[12].name, 'Source 1')
      await tap.equal(body.page, 1)
      await tap.equal(body.pageSize, 20)
    }
  )

  await tap.test('Get empty page of a Library', async () => {
    const res = await request(app)
      .get(`/library?page=3`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 13)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 0)
    await tap.equal(body.page, 3)
    await tap.equal(body.pageSize, 10)
  })

  await tap.test(
    'Library page size under 10 should default to 10',
    async () => {
      const res = await request(app)
        .get(`/library?limit=4`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 200)

      const body = res.body
      await tap.type(body, 'object')
      await tap.equal(body.totalItems, 13)
      await tap.ok(Array.isArray(body.items))
      await tap.equal(body.items.length, 10)
      await tap.equal(body.page, 1)
      await tap.equal(body.pageSize, 10)
    }
  )

  await tap.test('Library page size of 0 should default to 10', async () => {
    const res = await request(app)
      .get(`/library?limit=0`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 13)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 10)
    await tap.equal(body.page, 1)
    await tap.equal(body.pageSize, 10)
  })

  await tap.test(
    'Library page size of over 100 should default to 100',
    async () => {
      // create many more sources
      await createSourceSimplified({ name: 'Source 14' })
      await createSourceSimplified({ name: 'Source 15' })
      await createSourceSimplified({ name: 'Source 16' })
      await createSourceSimplified({ name: 'Source 17' })
      await createSourceSimplified({ name: 'Source 18' })
      await createSourceSimplified({ name: 'Source 19' })
      await createSourceSimplified({ name: 'Source 20' })
      // 20
      await createSourceSimplified({ name: 'Source 21' })
      await createSourceSimplified({ name: 'Source 22' })
      await createSourceSimplified({ name: 'Source 23' })
      await createSourceSimplified({ name: 'Source 24' })
      await createSourceSimplified({ name: 'Source 25' })
      await createSourceSimplified({ name: 'Source 26' })
      await createSourceSimplified({ name: 'Source 27' })
      await createSourceSimplified({ name: 'Source 28' })
      await createSourceSimplified({ name: 'Source 29' })
      await createSourceSimplified({ name: 'Source 30' })
      // 30
      await createSourceSimplified({ name: 'Source 31' })
      await createSourceSimplified({ name: 'Source 32' })
      await createSourceSimplified({ name: 'Source 33' })
      await createSourceSimplified({ name: 'Source 34' })
      await createSourceSimplified({ name: 'Source 35' })
      await createSourceSimplified({ name: 'Source 36' })
      await createSourceSimplified({ name: 'Source 37' })
      await createSourceSimplified({ name: 'Source 38' })
      await createSourceSimplified({ name: 'Source 39' })
      await createSourceSimplified({ name: 'Source 40' })
      // 40
      await createSourceSimplified({ name: 'Source 41' })
      await createSourceSimplified({ name: 'Source 42' })
      await createSourceSimplified({ name: 'Source 43' })
      await createSourceSimplified({ name: 'Source 44' })
      await createSourceSimplified({ name: 'Source 45' })
      await createSourceSimplified({ name: 'Source 46' })
      await createSourceSimplified({ name: 'Source 47' })
      await createSourceSimplified({ name: 'Source 48' })
      await createSourceSimplified({ name: 'Source 49' })
      await createSourceSimplified({ name: 'Source 50' })
      // 50
      await createSourceSimplified({ name: 'Source 51' })
      await createSourceSimplified({ name: 'Source 52' })
      await createSourceSimplified({ name: 'Source 53' })
      await createSourceSimplified({ name: 'Source 54' })
      await createSourceSimplified({ name: 'Source 55' })
      await createSourceSimplified({ name: 'Source 56' })
      await createSourceSimplified({ name: 'Source 57' })
      await createSourceSimplified({ name: 'Source 58' })
      await createSourceSimplified({ name: 'Source 59' })
      await createSourceSimplified({ name: 'Source 60' })
      // 60
      await createSourceSimplified({ name: 'Source 61' })
      await createSourceSimplified({ name: 'Source 62' })
      await createSourceSimplified({ name: 'Source 63' })
      await createSourceSimplified({ name: 'Source 64' })
      await createSourceSimplified({ name: 'Source 65' })
      await createSourceSimplified({ name: 'Source 66' })
      await createSourceSimplified({ name: 'Source 67' })
      await createSourceSimplified({ name: 'Source 68' })
      await createSourceSimplified({ name: 'Source 69' })
      await createSourceSimplified({ name: 'Source 70' })
      // 70
      await createSourceSimplified({ name: 'Source 71' })
      await createSourceSimplified({ name: 'Source 72' })
      await createSourceSimplified({ name: 'Source 73' })
      await createSourceSimplified({ name: 'Source 74' })
      await createSourceSimplified({ name: 'Source 75' })
      await createSourceSimplified({ name: 'Source 76' })
      await createSourceSimplified({ name: 'Source 77' })
      await createSourceSimplified({ name: 'Source 78' })
      await createSourceSimplified({ name: 'Source 79' })
      await createSourceSimplified({ name: 'Source 80' })
      // 80
      await createSourceSimplified({ name: 'Source 81' })
      await createSourceSimplified({ name: 'Source 82' })
      await createSourceSimplified({ name: 'Source 83' })
      await createSourceSimplified({ name: 'Source 84' })
      await createSourceSimplified({ name: 'Source 85' })
      await createSourceSimplified({ name: 'Source 86' })
      await createSourceSimplified({ name: 'Source 87' })
      await createSourceSimplified({ name: 'Source 88' })
      await createSourceSimplified({ name: 'Source 89' })
      await createSourceSimplified({ name: 'Source 90' })
      // 90
      await createSourceSimplified({ name: 'Source 91' })
      await createSourceSimplified({ name: 'Source 92' })
      await createSourceSimplified({ name: 'Source 93' })
      await createSourceSimplified({ name: 'Source 94' })
      await createSourceSimplified({ name: 'Source 95' })
      await createSourceSimplified({ name: 'Source 96' })
      await createSourceSimplified({ name: 'Source 97' })
      await createSourceSimplified({ name: 'Source 98' })
      await createSourceSimplified({ name: 'Source 99' })
      await createSourceSimplified({ name: 'Source 100' })
      // 100
      await createSourceSimplified({ name: 'Source 101' })
      await createSourceSimplified({ name: 'Source 102' })
      await createSourceSimplified({ name: 'Source 103' })
      await createSourceSimplified({ name: 'Source 104' })
      await createSourceSimplified({ name: 'Source 105' })
      await createSourceSimplified({ name: 'Source 106' })
      await createSourceSimplified({ name: 'Source 107' })
      await createSourceSimplified({ name: 'Source 108' })
      await createSourceSimplified({ name: 'Source 109' })
      await createSourceSimplified({ name: 'Source 110' })
      // 110

      const res = await request(app)
        .get(`/library?limit=120`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 200)

      const body = res.body
      await tap.type(body, 'object')
      await tap.equal(body.totalItems, 110)
      await tap.ok(Array.isArray(body.items))
      await tap.equal(body.items.length, 100)
      await tap.equal(body.page, 1)
      await tap.equal(body.pageSize, 100)
    }
  )

  await tap.test(
    'Trying to paginate library with invalid limit (string)',
    async () => {
      const res = await request(app)
        .get(`/library?limit=notANumber`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 200)

      const body = res.body
      await tap.type(body, 'object')
      await tap.equal(body.totalItems, 110)
      await tap.ok(Array.isArray(body.items))
      await tap.equal(body.items.length, 10)
      await tap.equal(body.page, 1)
      await tap.equal(body.pageSize, 10)
    }
  )

  await tap.test(
    'Trying to paginate library with invalid page (string)',
    async () => {
      const res = await request(app)
        .get(`/library?page=notANumber`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 200)

      const body = res.body
      await tap.type(body, 'object')
      await tap.equal(body.totalItems, 110)
      await tap.ok(Array.isArray(body.items))
      await tap.equal(body.items.length, 10)
      await tap.equal(body.page, 1)
      await tap.equal(body.pageSize, 10)
    }
  )

  await destroyDB(app)
}

module.exports = test
