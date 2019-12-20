const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { Tag } = require('../../models/Tag')
const { Publication_Tag } = require('../../models/Publications_Tags')
const { Publication } = require('../../models/Publication')
const crypto = require('crypto')
const { urlToId } = require('../../utils/utils')
const { ValidationError } = require('objection')

const test = async app => {
  const random = crypto.randomBytes(13).toString('hex')

  const reader = {
    name: 'J. Random Reader'
  }

  const tagObject = {
    type: 'reader:Tag',
    tagType: 'reader:Stack',
    name: 'mystack',
    json: { property: 1 }
  }

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const simplePublication = {
    name: 'Publication A',
    type: 'Book',
    readingOrder: [
      {
        type: 'Link',
        url: 'http://example.org/abc',
        encodingFormat: 'text/html',
        name: 'An example link'
      },
      {
        type: 'Link',
        url: 'http://example.org/abc2',
        encodingFormat: 'text/html',
        name: 'An example link2'
      }
    ]
  }

  let response = await Publication.createPublication(
    createdReader,
    simplePublication
  )

  const publication = await Publication.byId(urlToId(response.id))

  await tap.test('Create Stack', async () => {
    let responseCreate = await Tag.createTag(createdReader.id, tagObject)

    await tap.ok(responseCreate)
    await tap.ok(responseCreate instanceof Tag)
    await tap.equal(responseCreate.readerId, createdReader.id)
    await tap.equal(responseCreate.name, 'mystack')
    await tap.type(responseCreate.id, 'string')
    await tap.type(responseCreate.json, 'object')
    await tap.equal(responseCreate.json.property, 1)
    await tap.ok(responseCreate.published)
    tagId = responseCreate.id
  })

  await tap.test('Create Multiple Tags', async () => {
    let responseCreate = await Tag.createMultipleTags(createdReader.id, [
      {
        name: 'tag1',
        tagType: 'something'
      },
      {
        name: 'tag2',
        tagType: 'something'
      }
    ])

    await tap.ok(responseCreate)
    await tap.ok(Array.isArray(responseCreate))
    await tap.equal(responseCreate.length, 2)
    await tap.ok(responseCreate[0] instanceof Tag)
    await tap.equal(responseCreate[0].readerId, createdReader.id)
    await tap.equal(responseCreate[0].name, 'tag1')
    await tap.type(responseCreate[0].id, 'string')
    await tap.ok(responseCreate[0].published)
  })

  await tap.test('Get tag by id', async () => {
    let responseGet = await Tag.byId(tagId)
    await tap.ok(responseGet)
    await tap.ok(responseGet instanceof Tag)
  })

  await tap.test('Get tags by readerId', async () => {
    await Tag.createTag(createdReader.id, {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'tag2'
    })
    let responseGet = await Tag.byReaderId(urlToId(createdReader.id))

    await tap.equal(responseGet.length, 4)
    await tap.ok(responseGet[0] instanceof Tag)
    await tap.ok(responseGet[1] instanceof Tag)
    await tap.ok(responseGet[2] instanceof Tag)
    await tap.ok(responseGet[3] instanceof Tag)
  })

  await tap.test('Delete Publication_Tags of a Tag', async () => {
    // Create 2 additional tags for testing purposes
    const createdTag2 = await Tag.createTag(urlToId(createdReader.id), {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'mystack2'
    })

    const createdTag3 = await Tag.createTag(urlToId(createdReader.id), {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'mystack3'
    })

    await Publication_Tag.addTagToPub(urlToId(publication.id), createdTag2.id)

    await Publication_Tag.addTagToPub(urlToId(publication.id), createdTag3.id)

    // Get the Publication with 2 new tags
    const pub = await Publication.byId(urlToId(publication.id))

    await tap.equal(pub.tags.length, 2)
    await tap.ok(
      pub.tags[0].name === 'mystack2' || pub.tags[0].name === 'mystack3'
    )
    await tap.ok(
      pub.tags[1].name === 'mystack3' || pub.tags[1].name === 'mystack2'
    )

    // Delete the entries in Publication_Tag of createdTag2
    const numDeleted = await Publication_Tag.deletePubTagsOfTag(
      urlToId(createdTag2.id)
    )

    // Get the updated Publication
    const newPub = await Publication.byId(urlToId(publication.id))

    await tap.equal(numDeleted, 1)
    await tap.equal(newPub.tags.length, 1)
    await tap.equal(newPub.tags[0].name, createdTag3.name)

    await Publication_Tag.deletePubTagsOfTag(urlToId(createdTag3.id))
  })

  await tap.test(
    'Delete Publication_Tags of a Tag with a tagId that does not exist',
    async () => {
      // Create 2 additional tags for testing purposes
      const createdTag4 = await Tag.createTag(urlToId(createdReader.id), {
        type: 'reader:Tag',
        tagType: 'reader:Stack',
        name: 'mystack4'
      })

      await Publication_Tag.addTagToPub(urlToId(publication.id), createdTag4.id)

      // Get the Publication with 2 new tags
      const pub = await Publication.byId(urlToId(publication.id))

      await tap.equal(pub.tags.length, 1)
      await tap.equal(pub.tags[0].name, 'mystack4')

      // Delete the entries in Publication_Tag of createdTag2
      const numDeleted = await Publication_Tag.deletePubTagsOfTag(
        urlToId(createdTag4.id) + 'randomString'
      )

      await tap.equal(numDeleted, 0)

      await Publication_Tag.deletePubTagsOfTag(urlToId(createdTag4.id))
    }
  )

  await tap.test(
    'Delete Publication_Tags of a Tag with a tagId that is invalid',
    async () => {
      // Create 2 additional tags for testing purposes
      const createdTag5 = await Tag.createTag(urlToId(createdReader.id), {
        type: 'reader:Tag',
        tagType: 'reader:Stack',
        name: 'mystack5'
      })

      await Publication_Tag.addTagToPub(urlToId(publication.id), createdTag5.id)

      // Get the Publication with 2 new tags
      const pub = await Publication.byId(urlToId(publication.id))

      await tap.equal(pub.tags.length, 1)
      await tap.equal(pub.tags[0].name, 'mystack5')

      // Delete the entries in Publication_Tag of createdTag2
      const responseDelete = await Publication_Tag.deletePubTagsOfTag(null)

      await tap.ok(typeof responseDelete, Error)
      await tap.equal(responseDelete.message, 'no tag')

      await Publication_Tag.deletePubTagsOfTag(urlToId(createdTag5.id))
    }
  )

  await tap.test('Delete tag', async () => {
    const newTagObject = {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'random stack name',
      json: { property: 1 }
    }

    const tagCreated = await Tag.createTag(createdReader.id, newTagObject)

    // Add tag to a publiction
    await Publication_Tag.addTagToPub(urlToId(publication.id), tagCreated.id)

    // Fetch the publication to make sure there is a tag
    const pubBefore = await Publication.byId(urlToId(publication.id))

    await tap.equal(pubBefore.tags.length, 1)
    await tap.equal(pubBefore.tags[0].name, tagCreated.name)

    // Delete the tag
    const numDeleted = await tagCreated.delete()

    // Try to fetch the deleted tag from library
    const tagDeleted = await Tag.byId(tagCreated.id)

    // Fetch the publication to make sure there there is no tag
    const pubAfter = await Publication.byId(urlToId(publication.id))

    await tap.equal(numDeleted, 1)
    await tap.ok(!tagDeleted)
    await tap.equal(pubAfter.tags.length, 0)
  })

  await tap.test('Update tag', async () => {
    const newTagObject = {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'random stack name',
      json: { property: 1 }
    }

    const tagCreated = await Tag.createTag(createdReader.id, newTagObject)

    // Add tag to a publiction
    await Publication_Tag.addTagToPub(urlToId(publication.id), tagCreated.id)

    // Fetch the publication to make sure there is a tag
    const pubBefore = await Publication.byId(urlToId(publication.id))

    await tap.equal(pubBefore.tags.length, 1)
    await tap.equal(pubBefore.tags[0].name, tagCreated.name)

    // Update the tag - name and json should be updated, invalid should be ignored
    const updatedTag = await tagCreated.update({
      name: 'new name',
      json: { property2: 2 },
      invalid: 'something'
    })
    await tap.equal(updatedTag.name, 'new name')
    await tap.equal(updatedTag.json.property2, 2)
    await tap.notOk(updatedTag.json.property) // updating json replaces the whole object
    await tap.notOk(updatedTag.invalid)

    // fetch the updated tag
    const tag = await Tag.byId(tagCreated.id)
    await tap.equal(tag.name, 'new name')

    // Fetch the publication to make sure there there is no tag
    const pubAfter = await Publication.byId(urlToId(publication.id))
    await tap.equal(pubAfter.tags[0].name, 'new name')
  })

  await tap.test('Try to update tag with invalid data', async () => {
    const newTagObject = {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'random stack name',
      json: { property: 1 }
    }

    const tagCreated = await Tag.createTag(createdReader.id, newTagObject)

    // Update the tag
    const updatedTag = await tagCreated.update({ name: 123 })
    await tap.ok(updatedTag instanceof ValidationError)
  })

  await destroyDB(app)
}

module.exports = test
