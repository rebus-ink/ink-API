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

  // colour: blue - 14
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'blue'
    }
  })
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'blue'
    }
  })
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'blue'
    }
  })
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'blue'
    }
  })
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'blue'
    }
  })
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'blue'
    }
  })
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'blue'
    }
  })
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'blue'
    }
  })
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'blue'
    }
  })
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'blue'
    }
  })
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'blue'
    }
  })
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'blue'
    }
  })
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'blue'
    }
  })
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'blue'
    }
  })

  // colour 'red' - 3
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'red'
    }
  })
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'red'
    }
  })
  await createNotebook(app, token, {
    name: 'abc',
    settings: {
      colour: 'red'
    }
  })

  // no settings - should not break things
  await createNotebook(app, token, {
    name: 'notebookabc'
  })

  await tap.test('Get Notebooks - filter by colour', async () => {
    const res = await request(app)
      .get('/notebooks?colour=red')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 3)
    await tap.equal(res.body.totalItems, 3)
  })

  await tap.test(
    'Get Notebooks - filter by colour with pagination',
    async () => {
      const res = await request(app)
        .get('/notebooks?colour=blue&limit=11&page=2')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.equal(res.body.items.length, 3)
      await tap.equal(res.body.totalItems, 14)
    }
  )

  await destroyDB(app)
}

module.exports = test
