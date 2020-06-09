const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  await createNotebook(app, token, {
    name: 'notebook1',
    description: 'description1',
    settings: {
      property: 'value'
    }
  })
  await createNotebook(app, token, {
    name: 'notebook2',
    description: 'description2',
    settings: {
      property: 'value'
    }
  })
  await createNotebook(app, token, {
    name: 'notebook3',
    description: 'description2',
    settings: {
      property: 'value'
    }
  })
  await createNotebook(app, token, {
    name: 'notebook4',
    description: 'description2',
    settings: {
      property: 'value'
    }
  })
  await createNotebook(app, token, {
    name: 'notebook5',
    description: 'description2',
    settings: {
      property: 'value'
    }
  })
  await createNotebook(app, token, {
    name: 'notebook6',
    description: 'description2',
    settings: {
      property: 'value'
    }
  })
  await createNotebook(app, token, {
    name: 'notebook7',
    description: 'description2',
    settings: {
      property: 'value'
    }
  })
  await createNotebook(app, token, {
    name: 'notebook8',
    description: 'description2',
    settings: {
      property: 'value'
    }
  })
  await createNotebook(app, token, {
    name: 'notebook9',
    description: 'description2',
    settings: {
      property: 'value'
    }
  })
  await createNotebook(app, token, {
    name: 'notebook10',
    description: 'description2',
    settings: {
      property: 'value'
    }
  })
  await createNotebook(app, token, {
    name: 'notebook11',
    description: 'description2',
    settings: {
      property: 'value'
    }
  })
  await createNotebook(app, token, {
    name: 'notebook12',
    description: 'description2',
    settings: {
      property: 'value'
    }
  })
  await createNotebook(app, token, {
    name: 'notebook13',
    description: 'description2',
    settings: {
      property: 'value'
    }
  })
  await createNotebook(app, token, {
    name: 'notebook14',
    description: 'description2',
    settings: {
      property: 'value'
    }
  })

  // paginate

  await tap.test('Get Notebooks - default paginate to 10', async () => {
    const res = await request(app)
      .get('/notebooks')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 10)
    await tap.equal(res.body.totalItems, 14)
  })

  await tap.test(
    'Get Notebooks - set limit to less than 10, will still default to 10',
    async () => {
      const res = await request(app)
        .get('/notebooks?limit=3')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.equal(res.body.items.length, 10)
      await tap.equal(res.body.totalItems, 14)
    }
  )

  await tap.test('Get Notebooks - set limit', async () => {
    const res = await request(app)
      .get('/notebooks?limit=12')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 12)
    await tap.equal(res.body.totalItems, 14)
  })

  await tap.test('Get Notebooks - set page', async () => {
    const res = await request(app)
      .get('/notebooks?page=2')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 4)
    await tap.equal(res.body.totalItems, 14)
  })

  await tap.test('Get Notebooks - set page and limit', async () => {
    const res = await request(app)
      .get('/notebooks?limit=11&page=2')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 3)
    await tap.equal(res.body.totalItems, 14)
  })

  await destroyDB(app)
}

module.exports = test
