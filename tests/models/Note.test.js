const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { Note } = require('../../models/Note')
const { Source } = require('../../models/Source')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')
const _ = require('lodash')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }

  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const simpleSource = {
    type: 'Source',
    name: 'Source A',
    readingOrder: [
      {
        type: 'Link',
        url: 'http://example.org/abc',
        name: 'An example link'
      },
      {
        type: 'Link',
        url: 'http://example.org/abc2',
        name: 'An example link2'
      }
    ]
  }

  const source = await Source.createSource(createdReader, simpleSource)

  const simpleNote = {
    body: { motivation: 'test' }
  }

  const noteWithOneBody = {
    body: {
      motivation: 'test',
      content: 'this is the content of the note!',
      language: 'en'
    },
    document: 'doc123',
    target: { property: 'value' }
  }

  const noteWithTwoBodies = {
    body: [
      {
        motivation: 'test',
        content: 'this is content',
        language: 'en'
      },
      {
        motivation: 'test'
      }
    ]
  }

  const noteWithSourceObject = {
    sourceId: source.id,
    body: {
      motivation: 'test',
      content: 'something'
    }
  }

  const longNote = {
    body: [
      {
        motivation: 'test',
        content:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor. Morbi lectus risus, iaculis vel, suscipit quis, luctus non, massa. Fusce ac turpis quis ligula lacinia aliquet. Mauris ipsum. Nulla metus metus, ullamcorper vel, tincidunt sed, euismod in, nibh. Quisque volutpat condimentum velit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam nec ante. Sed lacinia, urna non tincidunt mattis, tortor neque adipiscing diam, a cursus ipsum ante quis turpis. Nulla facilisi. Ut fringilla. Suspendisse potenti. Nunc feugiat mi a tellus consequat imperdiet. Vestibulum sapien. Proin quam. Etiam ultrices. Suspendisse in justo eu magna luctus suscipit. Sed lectus. Integer euismod lacus luctus magna. Quisque cursus, metus vitae pharetra auctor, sem massa mattis sem, at interdum magna augue eget diam. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Morbi lacinia molestie dui. Praesent blandit dolor. Sed non quam. In vel mi sit amet augue congue elementum. Morbi in ipsum sit amet pede facilisis laoreet. Donec lacus nunc, viverra nec, blandit vel, egestas et, augue. Vestibulum tincidunt malesuada tellus. Ut ultrices ultrices enim. Curabitur sit amet mauris. Morbi in dui quis est pulvinar ullamcorper. Nulla facilisi. Integer lacinia sollicitudin massa. Cras metus. Sed aliquet risus a tortor. Integer id quam. Morbi mi. Quisque nisl felis, venenatis tristique, dignissim in, ultrices sit amet, augue. Proin sodales libero eget ante. Nulla quam. Aenean laoreet. Vestibulum nisi lectus, commodo ac, facilisis ac, ultricies eu, pede. Ut orci risus, accumsan porttitor, cursus quis, aliquet eget, justo. Sed pretium blandit orci. Ut eu diam at pede suscipit sodales. Aenean lectus elit, fermentum non, convallis id, sagittis at, neque. Nullam '
      }
    ]
  }

  let note, note2, noteWithSource

  await tap.test('Create Simple Note', async () => {
    let response = await Note.createNote(createdReader, simpleNote)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(response.body[0].motivation, 'test')
  })

  await tap.test('Create Note with long content', async () => {
    let response = await Note.createNote(createdReader, longNote)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(response.body[0].motivation, 'test')
  })

  await tap.test('Create Note with One Body', async () => {
    let response = await Note.createNote(createdReader, noteWithOneBody)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(response.document, 'doc123')
    await tap.ok(response.body)
    await tap.equal(response.body[0].motivation, 'test')
    await tap.equal(response.body[0].content, noteWithOneBody.body.content)
    await tap.equal(response.body[0].language, 'en')
    await tap.equal(response.target.property, 'value')
    note = response
  })

  await tap.test('Create Note with Two Bodies', async () => {
    let response = await Note.createNote(createdReader, noteWithTwoBodies)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
    await tap.ok(response.body)
    await tap.ok(_.isArray(response.body))
    await tap.equal(response.body.length, 2)
    note2 = response
  })

  await tap.test('Create Note with source', async () => {
    let response = await Note.createNote(createdReader, noteWithSourceObject)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    noteWithSource = response
  })

  await tap.test('Update a Note with a new body', async () => {
    const newNote = Object.assign(note, {
      body: { content: 'new content', motivation: 'test' },
      target: { property1: 'value1' }
    })
    const response = await Note.update(newNote)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
    await tap.ok(response.body)
    await tap.equal(response.body[0].motivation, 'test')
    await tap.equal(response.body[0].content, 'new content')
    await tap.notOk(response.body[0].language) // should be gone
    await tap.equal(response.target.property1, 'value1')
    await tap.notOk(response.target.property) // should be gone
  })

  await tap.test('Update a Note with one body', async () => {
    const newNote = Object.assign(note, {
      target: { property2: 'value2' },
      body: { motivation: 'test' }
    })
    const response = await Note.update(newNote)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(response.body[0].motivation, 'test')
    await tap.equal(response.target.property2, 'value2')
    await tap.notOk(response.target.property1) // should be gone
  })

  await tap.test('Update a Note with two bodies', async () => {
    const newNote = Object.assign(note, {
      body: [
        { content: '1', motivation: 'test' },
        { content: '2', motivation: 'test' }
      ]
    })
    const response = await Note.update(newNote)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(response.body.length, 2)
  })

  await tap.test('Update Note with source', async () => {
    const newNote = Object.assign(noteWithSource, {
      document: 'doc111',
      body: { content: 'something else', motivation: 'highlighting' }
    })
    let response = await Note.update(newNote)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.document, 'doc111')
  })

  await tap.test('Try to update a note that does not exist', async () => {
    const newNote = Object.assign(note, {
      target: { new: 'new value' },
      id: '123'
    })
    const response = await Note.update(newNote)
    await tap.notOk(response)
    await tap.equal(response, null)
  })

  await tap.test('Get note by id', async () => {
    const retrievedNote = await Note.byId(urlToId(note2.id))
    await tap.type(retrievedNote, 'object')
    await tap.ok(retrievedNote instanceof Note)
    // eager loading the reader
    await tap.type(retrievedNote.reader, 'object')
    await tap.ok(retrievedNote.reader instanceof Reader)
    // eager loading the body
    await tap.ok(_.isArray(retrievedNote.body))
    await tap.equal(retrievedNote.body.length, 2)
  })

  await tap.test('Try to get a Note that does not exist', async () => {
    const response = await Note.byId('123')
    await tap.equal(response, undefined)
  })

  await tap.test('Note as Ref', async () => {
    const noteRef = note2.asRef()
    await tap.ok(noteRef)
    await tap.type(noteRef, 'string')
    await tap.equal(noteRef, note2.id)
  })

  await tap.test('Delete Note', async () => {
    const res = await Note.delete(urlToId(note2.id))
    await tap.ok(res.deleted)

    // make sure that the NoteBodies are deleted:
    const newNote = await Note.byId(urlToId(note2.id))
    await tap.ok(newNote.body)
    await tap.ok(newNote.body[0].deleted)
    await tap.ok(newNote.body[1].deleted)
  })

  await tap.test('Try to delete a note that does not exist', async () => {
    const res = await Note.delete('123')
    await tap.notOk(res)
  })

  // --------------------------------------------------------------------------------
  // TODO: move to another file!
  // // Create a valid tag
  // const newTag = await Tag.createTag(createdReader.id, {
  //   type: 'stack',
  //   name: 'mystack'
  // })

  // // Create a valid note
  // const newNote = await Note.createNote(createdReader, noteObject)

  // await tap.test('Add a tag to a note', async () => {
  //   const tagNote = await Note_Tag.addTagToNote(urlToId(newNote.id), newTag.id)

  //   tap.ok(tagNote.noteId)
  //   tap.ok(tagNote.tagId)
  //   tap.equal(tagNote.tagId, newTag.id)
  //   tap.equal(tagNote.noteId, urlToId(newNote.id))
  // })

  // await tap.test('Add a tag to a note with an invalid noteId', async () => {
  //   const tagNote = await Note_Tag.addTagToNote(
  //     newNote.id + 'Blah123',
  //     newTag.id
  //   )

  //   tap.ok(typeof tagNote, Error)
  //   tap.ok(tagNote.message, 'no note')
  // })

  // await tap.test('Add a tag to a note with an invalid tagId', async () => {
  //   const tagNote = await Note_Tag.addTagToNote(
  //     urlToId(newNote.id),
  //     newTag.id + 1222222223
  //   )

  //   tap.ok(typeof tagNote, Error)
  //   tap.equal(tagNote.message, 'no tag')
  // })

  // await tap.test('Delete all Note_Tags associated with a note', async () => {
  //   // Create valid tags
  //   const tag1 = await Tag.createTag(createdReader.id, {
  //     type: 'stack',
  //     name: 'someStack1'
  //   })
  //   const tag2 = await Tag.createTag(createdReader.id, {
  //     type: 'stack',
  //     name: 'someStack2'
  //   })

  //   const anotherNote = await Note.createNote(createdReader, noteObject)

  //   await Note_Tag.addTagToNote(urlToId(anotherNote.id), tag1.id)
  //   await Note_Tag.addTagToNote(urlToId(anotherNote.id), tag2.id)

  //   const noteWithTags = await Note.byId(urlToId(anotherNote.id))

  //   await tap.ok(noteWithTags.tags)
  //   await tap.equal(noteWithTags.tags.length, 2)
  //   await tap.ok(
  //     noteWithTags.tags[0].name === tag1.name ||
  //       noteWithTags.tags[0].name === tag2.name
  //   )
  //   await tap.ok(
  //     noteWithTags.tags[1].name === tag1.name ||
  //       noteWithTags.tags[1].name === tag2.name
  //   )

  //   // Remote the Note_Tag
  //   const numDeleted = await Note_Tag.deleteNoteTagsOfNote(
  //     urlToId(noteWithTags.id)
  //   )

  //   // Fetch the new Note
  //   const noteWithoutTags = await Note.byId(urlToId(noteWithTags.id))

  //   await tap.equal(noteWithoutTags.tags.length, 0)
  //   await tap.equal(numDeleted, 2)
  // })

  // await tap.test(
  //   'Delete Note_Tags of a Note with an id that does not exist',
  //   async () => {
  //     const response = await Note_Tag.deleteNoteTagsOfNote('invalidIdOfNote')

  //     await tap.equal(response, 0)
  //   }
  // )

  // await tap.test('Delete Note_Tags of a Note with an invalid id', async () => {
  //   const response = await Note_Tag.deleteNoteTagsOfNote(null)

  //   await tap.ok(typeof response, Error)
  //   await tap.equal(response.message, 'no note')
  // })

  // await tap.test('Delete all Note_Tags associated with a Tag', async () => {
  //   // Create 1 tag, 2 notes, and add this tag to the notes
  //   const createdTag = await Tag.createTag(createdReader.id, {
  //     type: 'stack',
  //     name: 'another random stack'
  //   })

  //   const anotherNote1 = await Note.createNote(createdReader, noteObject)
  //   const anotherNote2 = await Note.createNote(createdReader, noteObject)

  //   await Note_Tag.addTagToNote(urlToId(anotherNote1.id), createdTag.id)
  //   await Note_Tag.addTagToNote(urlToId(anotherNote2.id), createdTag.id)

  //   // Fetch notes with tags
  //   const note1WithTag = await Note.byId(urlToId(anotherNote1.id))
  //   const note2WithTag = await Note.byId(urlToId(anotherNote2.id))

  //   await tap.equal(note1WithTag.tags.length, 1)
  //   await tap.equal(note2WithTag.tags.length, 1)

  //   const numDeleted = await Note_Tag.deleteNoteTagsOfTag(createdTag.id)

  //   // Fetch the Notes without tags
  //   const note1WithoutTag = await Note.byId(urlToId(anotherNote1.id))
  //   const note2WithoutTag = await Note.byId(urlToId(anotherNote2.id))

  //   await tap.equal(numDeleted, 2)
  //   await tap.equal(note1WithoutTag.tags.length, 0)
  //   await tap.equal(note2WithoutTag.tags.length, 0)
  // })

  // await tap.test('Remove a valid tag from a valid note', async () => {
  //   // Create valid tags
  //   const tag1 = await Tag.createTag(createdReader.id, {
  //     type: 'stack',
  //     name: 'MyStack1'
  //   })
  //   const tag2 = await Tag.createTag(createdReader.id, {
  //     type: 'stack',
  //     name: 'MyStack2'
  //   })

  //   // Create a valid note
  //   const note1 = await Note.createNote(createdReader, noteObject)
  //   const note2 = await Note.createNote(createdReader, simpleNoteObject)

  //   // Add tags to notes
  //   const tagNote1 = await Note_Tag.addTagToNote(urlToId(note1.id), tag1.id)
  //   const tagNote2 = await Note_Tag.addTagToNote(urlToId(note2.id), tag2.id)

  //   const result = await Note_Tag.removeTagFromNote(
  //     urlToId(tagNote1.noteId),
  //     tagNote1.tagId
  //   )

  //   // Check that the spcified entry has been removed
  //   removed = await Note_Tag.query().where({
  //     noteId: tagNote1.noteId,
  //     tagId: tagNote1.tagId
  //   })

  //   // Check that the not specified entry has not been removed
  //   notRemoved = await Note_Tag.query().where({
  //     noteId: tagNote2.noteId,
  //     tagId: tagNote2.tagId
  //   })

  //   // Make sure only 1 is removed
  //   tap.equal(result, 1)
  //   tap.ok(typeof removed, Error)
  //   tap.ok(notRemoved[0] instanceof Note_Tag)
  // })

  // await tap.test('Remove a tag with an invalid noteId', async () => {
  //   const result = await Note_Tag.removeTagFromNote(
  //     newNote.id + 'Blah1233333333333',
  //     newTag.id
  //   )

  //   tap.ok(typeof result, Error)
  //   tap.equal(result.message, 'not found')
  // })

  // await tap.test('Remove a tag with an invalid tagId', async () => {
  //   const result = await Note_Tag.removeTagFromNote(newNote.id, newTag.id + 123)

  //   tap.ok(typeof result, Error)
  //   tap.equal(result.message, 'not found')
  // })

  // await tap.test('Delete a Note', async () => {
  //   const tag = await Tag.createTag(createdReader.id, {
  //     type: 'stack',
  //     name: 'random name for tag'
  //   })

  //   await Note_Tag.addTagToNote(urlToId(newNote.id), tag.id)

  //   // Fetch the note with the new tag
  //   const noteWithTag = await Note.byId(urlToId(newNote.id))

  //   await tap.ok(!noteWithTag.deleted)
  //   await tap.ok(noteWithTag.tags.length !== 0)

  //   // Delete the note
  //   const noteDeleted = await Note.delete(urlToId(noteWithTag.id))

  //   await tap.ok(noteDeleted.deleted)
  //   await tap.ok(!noteDeleted.tags)
  // })

  await destroyDB(app)
}

module.exports = test
