const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote,
  createTag
} = require('../../utils/testUtils')
const { Reader } = require('../../../models/Reader')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  // reader1
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerId = urlToId(readerCompleteUrl)

  // Create Reader object
  const person = {
    name: 'J. Random Reader'
  }

  await Reader.createReader(readerId, person)

  // reader2
  const token2 = getToken()
  const readerCompleteUrl2 = await createUser(app, token2)

  // create tag for reader 1

  const tag = await createTag(app, token)
  const tagId = urlToId(tag.id)

  // create publication for reader 2
  const publication2 = await createPublication(app, token2)
  publicationId2 = urlToId(publication2.id)

  // --------------------------------------- READER ----------------------------------------
  await tap.test('Get Reader without Authentication', async () => {
    const res2 = await request(app)
      .get(`/readers/${readerId}`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res2.statusCode, 401)
  })

  await tap.test('Whoami without Authentication', async () => {
    const res3 = await request(app)
      .get('/whoami')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res3.statusCode, 401)
  })

  await tap.test('Create Reader without authentication', async () => {
    const res = await request(app)
      .post(`/readers`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res.statusCode, 401)
  })

  await tap.test('Update Reader without authentication', async () => {
    const res = await request(app)
      .put(`/readers/123`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res.statusCode, 401)
  })

  // ------------------------------------ PUBLICATION --------------------------------------

  await tap.test('Get publication without Authentication', async () => {
    const res4 = await request(app)
      .get(`/publications/123`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res4.statusCode, 401)
  })

  await tap.test('Post publication without Authentication', async () => {
    const res8 = await request(app)
      .post('/publications')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res8.statusCode, 401)
  })

  await tap.test('Delete Publicatoin without Authentication', async () => {
    const res9 = await request(app)
      .delete(`/publications/123`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res9.statusCode, 401)
  })

  await tap.test('Patch Publication without Authentication', async () => {
    const res10 = await request(app)
      .patch(`/publications/123`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res10.statusCode, 401)
  })

  await tap.test(
    'Batch update Publication without Authentication',
    async () => {
      const res10 = await request(app)
        .patch(`/publications/batchUpdate`)
        .set('Host', 'reader-api.test')
        .type('application/ld+json')
      await tap.equal(res10.statusCode, 401)
    }
  )

  // ------------------------------------------- TAG ---------------------------------------

  await tap.test('Get Tags without Authentication', async () => {
    const res13 = await request(app)
      .get('/tags')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res13.statusCode, 401)
  })

  await tap.test('Post Tags without Authentication', async () => {
    const res14 = await request(app)
      .post('/tags')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res14.statusCode, 401)
  })

  await tap.test('Delete Tag without Authentication', async () => {
    const res16 = await request(app)
      .delete(`/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res16.statusCode, 401)
  })

  await tap.test('Update Tag without Authentication', async () => {
    const res15 = await request(app)
      .put(`/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res15.statusCode, 401)
  })

  // ---------------------------------------- TAG - PUBLICATION ------------------------

  await tap.test('Add Tag to Publication without Authentication', async () => {
    const res11 = await request(app)
      .put(`/publications/123/tags/123`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res11.statusCode, 401)
  })

  await tap.test(
    'Remove Tag from Publication without Authentication',
    async () => {
      const res12 = await request(app)
        .delete(`/publications/123/tags/123`)
        .set('Host', 'reader-api.test')
        .type('application/ld+json')

      await tap.equal(res12.statusCode, 401)
    }
  )

  // ----------------------------------------- LIBRARY -------------------------

  await tap.test('Get library without authentication', async () => {
    const res17 = await request(app)
      .get(`/library`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res17.statusCode, 401)
  })

  // ------------------------------------------READER NOTES -----------------------

  await tap.test('Get readerNotes without Authentication', async () => {
    const res18 = await request(app)
      .get(`/notes`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res18.statusCode, 401)
  })

  // -------------------------------------------- TAG-NOTE -------------------------------

  await tap.test('Add Tag to Note without authentication', async () => {
    const res20 = await request(app)
      .put(`/notes/123/tags/123`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res20.statusCode, 401)
  })

  await tap.test('Remove Tag from Note without authentication', async () => {
    const res21 = await request(app)
      .delete(`/notes/123/tags/123`)
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res21.statusCode, 401)
  })

  // ----------------------------------- READACTIVITY ----------------------------

  await tap.test('Create ReadActivity without Authentication', async () => {
    const res22 = await request(app)
      .post('/publications/pub123/readActivity')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res22.statusCode, 401)
  })

  // ----------------------------------------- NOTE ----------------------------------

  await tap.test('Create Note without authentication', async () => {
    const res = await request(app)
      .post('/notes')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res.statusCode, 401)
  })

  await tap.test('Get Note without authentication', async () => {
    const res = await request(app)
      .get('/notes/note123')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')

    await tap.equal(res.statusCode, 401)
  })

  await tap.test('Delete Note without authentication', async () => {
    const res23 = await request(app)
      .delete('/notes/note123')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res23.statusCode, 401)
  })

  await tap.test('Put Note without authentication', async () => {
    const res24 = await request(app)
      .put('/notes/note123')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res24.statusCode, 401)
  })

  // -----------------------------------NOTERELATION --------------------------

  await tap.test('Post NoteRelation without authentication', async () => {
    const res24 = await request(app)
      .post('/noteRelations')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res24.statusCode, 401)
  })

  await tap.test('Put NoteRelation without authentication', async () => {
    const res24 = await request(app)
      .put('/noteRelations/123')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res24.statusCode, 401)
  })

  await tap.test('Delete NoteRelation without authentication', async () => {
    const res24 = await request(app)
      .delete('/noteRelations/123')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res24.statusCode, 401)
  })

  // -------------------------------------NOTECONTEXT --------------------------------

  await tap.test('POST NoteContext without authentication', async () => {
    const res = await request(app)
      .post('/noteContexts')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.statusCode, 401)
  })

  await tap.test('PUT NoteContext without authentication', async () => {
    const res = await request(app)
      .put('/noteContexts/123')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.statusCode, 401)
  })

  await tap.test('Delete NoteContext without authentication', async () => {
    const res = await request(app)
      .delete('/noteContexts/123')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.statusCode, 401)
  })

  await tap.test(
    'Add a Note to a NoteContext without authentication',
    async () => {
      const res = await request(app)
        .post('/noteContexts/123/notes')
        .set('Host', 'reader-api.test')
        .type('application/ld+json')
      await tap.equal(res.statusCode, 401)
    }
  )

  await tap.test('Get a NoteContext without authentication', async () => {
    const res = await request(app)
      .get('/noteContexts/123')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.statusCode, 401)
  })

  // -------------------------------------OUTLINE --------------------------------

  await tap.test('POST Outline without authentication', async () => {
    const res = await request(app)
      .post('/outlines')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.statusCode, 401)
  })

  await tap.test('PUT Outline without authentication', async () => {
    const res = await request(app)
      .put('/outlines/123')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.statusCode, 401)
  })

  await tap.test('Delete Outline without authentication', async () => {
    const res = await request(app)
      .delete('/outlines/123')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.statusCode, 401)
  })

  await tap.test(
    'Add a Note to an Outline without authentication',
    async () => {
      const res = await request(app)
        .post('/outlines/123/notes')
        .set('Host', 'reader-api.test')
        .type('application/ld+json')
      await tap.equal(res.statusCode, 401)
    }
  )

  await tap.test(
    'Delete a Note from an Outline without authentication',
    async () => {
      const res = await request(app)
        .delete('/outlines/123/notes/123')
        .set('Host', 'reader-api.test')
        .type('application/ld+json')
      await tap.equal(res.statusCode, 401)
    }
  )

  await tap.test(
    'Update a Note in an Outline without authentication',
    async () => {
      const res = await request(app)
        .patch('/outlines/123/notes/123')
        .set('Host', 'reader-api.test')
        .type('application/ld+json')
      await tap.equal(res.statusCode, 401)
    }
  )

  await tap.test('Get a Outline without authentication', async () => {
    const res = await request(app)
      .get('/outlines/123')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.statusCode, 401)
  })

  // ------------------------------------- NOTEBOOK ------------------------

  await tap.test('POST notebook without authentication', async () => {
    const res = await request(app)
      .post('/notebooks')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.statusCode, 401)
  })

  await tap.test('GET notebook without authentication', async () => {
    const res = await request(app)
      .get('/notebooks/abc')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.statusCode, 401)
  })

  await tap.test('GET notebooks list without authentication', async () => {
    const res = await request(app)
      .get('/notebooks')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.statusCode, 401)
  })

  await tap.test('PUT notebook without authentication', async () => {
    const res = await request(app)
      .put('/notebooks/abc')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.statusCode, 401)
  })

  await tap.test('DELETE notebook without authentication', async () => {
    const res = await request(app)
      .delete('/notebooks/abc')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.statusCode, 401)
  })

  await tap.test(
    'PUT publication to notebook without authentication',
    async () => {
      const res = await request(app)
        .put('/notebooks/abc/publications/abc')
        .set('Host', 'reader-api.test')
        .type('application/ld+json')
      await tap.equal(res.statusCode, 401)
    }
  )

  await tap.test(
    'DELETE publication from notebook without authentication',
    async () => {
      const res = await request(app)
        .delete('/notebooks/abc/publications/abc')
        .set('Host', 'reader-api.test')
        .type('application/ld+json')
      await tap.equal(res.statusCode, 401)
    }
  )

  await tap.test(
    'DELETE publication to notebook without authentication',
    async () => {
      const res = await request(app)
        .delete('/notebooks/abc/publications/abc')
        .set('Host', 'reader-api.test')
        .type('application/ld+json')
      await tap.equal(res.statusCode, 401)
    }
  )

  await tap.test('PUT note to notebook without authentication', async () => {
    const res = await request(app)
      .put('/notebooks/abc/notes/abc')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.statusCode, 401)
  })

  await tap.test(
    'DELETE note from notebook without authentication',
    async () => {
      const res = await request(app)
        .delete('/notebooks/abc/notes/abc')
        .set('Host', 'reader-api.test')
        .type('application/ld+json')
      await tap.equal(res.statusCode, 401)
    }
  )

  await tap.test(
    'POST new note to notebook without authentication',
    async () => {
      const res = await request(app)
        .post('/notebooks/abc/notes')
        .set('Host', 'reader-api.test')
        .type('application/ld+json')
      await tap.equal(res.statusCode, 401)
    }
  )

  await tap.test('PUT tag to notebook without authentication', async () => {
    const res = await request(app)
      .put('/notebooks/abc/tags/abc')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.statusCode, 401)
  })

  await tap.test(
    'DELETE tag from notebook without authentication',
    async () => {
      const res = await request(app)
        .delete('/notebooks/abc/tags/abc')
        .set('Host', 'reader-api.test')
        .type('application/ld+json')
      await tap.equal(res.statusCode, 401)
    }
  )

  await destroyDB(app)
}

module.exports = test
