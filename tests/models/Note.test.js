const tap = require('tap')
const { destroyDB } = require('../utils/utils')
const { Reader } = require('../../models/Reader')
const { Note } = require('../../models/Note')
const { Tag } = require('../../models/Tag')
const { Publication } = require('../../models/Publication')
const { Document } = require('../../models/Document')
const { Note_Tag } = require('../../models/Note_Tag')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }

  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const simplePublication = {
    type: 'Publication',
    name: 'Publication A',
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

  const publication = await Publication.createPublication(
    createdReader,
    simplePublication
  )

  // creating a document - this will not be exposed to the readers. It will be done as part of the upload
  const createdDocument = await Document.createDocument(
    createdReader,
    urlToId(publication.id),
    {
      documentPath: 'path/1',
      mediaType: 'text/html',
      url: 'http://something/123'
    }
  )
  const documentUrl = `${publication.id}/${createdDocument.documentPath}`

  const noteObject = {
    noteType: 'highlight',
    content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem donec massa sapien faucibus et molestie. Turpis tincidunt id aliquet risus feugiat in ante metus. Quis vel eros donec ac odio tempor orci dapibus ultrices. Vulputate eu scelerisque felis imperdiet proin fermentum leo vel. Nunc aliquet bibendum enim facilisis gravida neque. Diam phasellus vestibulum lorem sed risus. Habitasse platea dictumst quisque sagittis purus. Ut venenatis tellus in metus. Ornare arcu dui vivamus arcu felis. Dignissim enim sit amet venenatis urna cursus. Et egestas quis ipsum suspendisse ultrices gravida. Etiam erat velit scelerisque in dictum non consectetur. Consectetur libero id faucibus nisl. Pretium lectus quam id leo in vitae turpis massa. Sem viverra aliquet eget sit amet tellus cras adipiscing.

    Ultrices tincidunt arcu non sodales neque. Lorem donec massa sapien faucibus et molestie ac feugiat sed. Eget magna fermentum iaculis eu non diam phasellus. Nibh venenatis cras sed felis eget. Netus et malesuada fames ac turpis egestas maecenas pharetra. Sed viverra ipsum nunc aliquet bibendum enim facilisis. Elit scelerisque mauris pellentesque pulvinar pellentesque habitant. Leo integer malesuada nunc vel risus commodo. In ante metus dictum at. Massa tincidunt nunc pulvinar sapien et ligula ullamcorper malesuada.
    
    Massa id neque aliquam vestibulum morbi blandit cursus risus. Pretium aenean pharetra magna ac placerat. Lorem sed risus ultricies tristique nulla aliquet. Maecenas volutpat blandit aliquam etiam erat. Vel pharetra vel turpis nunc eget lorem dolor. Luctus venenatis lectus magna fringilla urna porttitor rhoncus. Nunc sed velit dignissim sodales ut eu sem integer. Metus dictum at tempor commodo ullamcorper a. Sed tempus urna et pharetra pharetra. Aenean et tortor at risus viverra. Consectetur a erat nam at lectus. Donec adipiscing tristique risus nec feugiat in. Nulla aliquet porttitor lacus luctus accumsan tortor. Quis auctor elit sed vulputate mi sit amet. Tellus cras adipiscing enim eu turpis egestas pretium aenean. Nunc aliquet bibendum enim facilisis gravida neque convallis a cras.
    
    Mattis rhoncus urna neque viverra justo nec ultrices. Convallis a cras semper auctor neque vitae tempus quam pellentesque. Tempus urna et pharetra pharetra massa massa. Arcu bibendum at varius vel pharetra. Nulla aliquet enim tortor at. Tellus molestie nunc non blandit massa. Sed libero enim sed faucibus turpis. Id ornare arcu odio ut sem nulla pharetra diam sit. Volutpat est velit egestas dui id ornare arcu. Quam quisque id diam vel quam elementum pulvinar. Enim nulla aliquet porttitor lacus. Orci eu lobortis elementum nibh tellus molestie nunc. Aenean vel elit scelerisque mauris. Proin libero nunc consequat interdum varius sit amet. Nulla facilisi etiam dignissim diam quis enim. Sed viverra ipsum nunc aliquet. Adipiscing at in tellus integer feugiat. Turpis in eu mi bibendum neque egestas congue.
    
    Gravida quis blandit turpis cursus in. Metus aliquam eleifend mi in. Lacus sed viverra tellus in hac habitasse platea dictumst vestibulum. Feugiat in fermentum posuere urna nec tincidunt praesent semper. Sed egestas egestas fringilla phasellus faucibus scelerisque eleifend donec pretium. Nec ullamcorper sit amet risus nullam eget felis. Hac habitasse platea dictumst quisque sagittis purus sit. Tellus orci ac auctor augue mauris augue neque. Donec ac odio tempor orci dapibus. Amet mattis vulputate enim nulla. Ut sem viverra aliquet eget sit amet tellus cras. Pellentesque habitant morbi tristique senectus et netus. Mauris commodo quis imperdiet massa tincidunt nunc pulvinar.`,
    selector: { property: 'value' },
    json: { anotherProperty: 3 },
    inReplyTo: documentUrl,
    context: publication.id
  }

  const simpleNoteObject = {
    noteType: 'something',
    selector: { property: 'value' },
    inReplyTo: documentUrl,
    context: publication.id
  }

  let note

  await tap.test('Create Note', async () => {
    let response = await Note.createNote(createdReader, noteObject)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)

    note = response
  })

  await tap.test('Create Simple Note', async () => {
    let response = await Note.createNote(createdReader, simpleNoteObject)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
  })

  await tap.test('Get note by id', async () => {
    note = await Note.byId(urlToId(note.id))
    await tap.type(note, 'object')
    await tap.equal(note.noteType, 'highlight')
    await tap.ok(note instanceof Note)
    // eager loading the reader
    await tap.type(note.reader, 'object')
    await tap.ok(note.reader instanceof Reader)
  })

  await tap.test('Note as Ref', async () => {
    const noteRef = note.asRef()
    await tap.ok(noteRef)
    await tap.type(noteRef, 'string')
    await tap.equal(noteRef, note.id)
  })

  await tap.test('Update Note', async () => {
    const res = await Note.update({ id: note.id, content: 'new content' })
    await tap.ok(res)
    await tap.equal(res.content, 'new content')
  })

  await tap.test('Try to update a note that does not exist', async () => {
    const res = await Note.update({
      id: note.id + '123',
      content: 'new content'
    })
    await tap.equal(res, null)
  })

  await tap.test('Delete Note', async () => {
    const res = await Note.delete(urlToId(note.id))
    await tap.ok(res.deleted)
  })

  await tap.test('Try to delete a note that does not exist', async () => {
    const res = await Note.delete('123')
    await tap.equal(res, null)
  })

  // Create a valid tag
  const newTag = await Tag.createTag(createdReader.id, {
    type: 'reader:Tag',
    tagType: 'reader:Stack',
    name: 'mystack'
  })

  // Create a valid note
  const newNote = await Note.createNote(createdReader, noteObject)

  await tap.test('Add a tag to a note', async () => {
    const tagNote = await Note_Tag.addTagToNote(urlToId(newNote.id), newTag.id)

    tap.ok(tagNote.noteId)
    tap.ok(tagNote.tagId)
    tap.equal(tagNote.tagId, newTag.id)
    tap.equal(tagNote.noteId, urlToId(newNote.id))
  })

  await tap.test('Add a tag to a note with an invalid noteId', async () => {
    const tagNote = await Note_Tag.addTagToNote(
      newNote.id + 'Blah123',
      newTag.id
    )

    tap.ok(typeof tagNote, Error)
    tap.ok(tagNote.message, 'no note')
  })

  await tap.test('Add a tag to a note with an invalid tagId', async () => {
    const tagNote = await Note_Tag.addTagToNote(
      urlToId(newNote.id),
      newTag.id + 1222222223
    )

    tap.ok(typeof tagNote, Error)
    tap.equal(tagNote.message, 'no tag')
  })

  await tap.test('Delete all Note_Tags associated with a note', async () => {
    // Create valid tags
    const tag1 = await Tag.createTag(createdReader.id, {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'someStack1'
    })
    const tag2 = await Tag.createTag(createdReader.id, {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'someStack2'
    })

    const anotherNote = await Note.createNote(createdReader, noteObject)

    await Note_Tag.addTagToNote(urlToId(anotherNote.id), tag1.id)
    await Note_Tag.addTagToNote(urlToId(anotherNote.id), tag2.id)

    const noteWithTags = await Note.byId(urlToId(anotherNote.id))

    await tap.ok(noteWithTags.tags)
    await tap.equal(noteWithTags.tags.length, 2)
    await tap.ok(
      noteWithTags.tags[0].name === tag1.name ||
        noteWithTags.tags[0].name === tag2.name
    )
    await tap.ok(
      noteWithTags.tags[1].name === tag1.name ||
        noteWithTags.tags[1].name === tag2.name
    )

    // Remote the Note_Tag
    const numDeleted = await Note_Tag.deleteNoteTagsOfNote(
      urlToId(noteWithTags.id)
    )

    // Fetch the new Note
    const noteWithoutTags = await Note.byId(urlToId(noteWithTags.id))

    await tap.equal(noteWithoutTags.tags.length, 0)
    await tap.equal(numDeleted, 2)
  })

  await tap.test(
    'Delete Note_Tags of a Note with an id that does not exist',
    async () => {
      const response = await Note_Tag.deleteNoteTagsOfNote('invalidIdOfNote')

      await tap.equal(response, 0)
    }
  )

  await tap.test('Delete Note_Tags of a Note with an invalid id', async () => {
    const response = await Note_Tag.deleteNoteTagsOfNote(null)

    await tap.ok(typeof response, Error)
    await tap.equal(response.message, 'no note')
  })

  await tap.test('Delete all Note_Tags associated with a Tag', async () => {
    // Create 1 tag, 2 notes, and add this tag to the notes
    const createdTag = await Tag.createTag(createdReader.id, {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'another random stack'
    })

    const anotherNote1 = await Note.createNote(createdReader, noteObject)
    const anotherNote2 = await Note.createNote(createdReader, noteObject)

    await Note_Tag.addTagToNote(urlToId(anotherNote1.id), createdTag.id)
    await Note_Tag.addTagToNote(urlToId(anotherNote2.id), createdTag.id)

    // Fetch notes with tags
    const note1WithTag = await Note.byId(urlToId(anotherNote1.id))
    const note2WithTag = await Note.byId(urlToId(anotherNote2.id))

    await tap.equal(note1WithTag.tags.length, 1)
    await tap.equal(note2WithTag.tags.length, 1)

    const numDeleted = await Note_Tag.deleteNoteTagsOfTag(createdTag.id)

    // Fetch the Notes without tags
    const note1WithoutTag = await Note.byId(urlToId(anotherNote1.id))
    const note2WithoutTag = await Note.byId(urlToId(anotherNote2.id))

    await tap.equal(numDeleted, 2)
    await tap.equal(note1WithoutTag.tags.length, 0)
    await tap.equal(note2WithoutTag.tags.length, 0)
  })

  await tap.test('Remove a valid tag from a valid note', async () => {
    // Create valid tags
    const tag1 = await Tag.createTag(createdReader.id, {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'MyStack1'
    })
    const tag2 = await Tag.createTag(createdReader.id, {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'MyStack2'
    })

    // Create a valid note
    const note1 = await Note.createNote(createdReader, noteObject)
    const note2 = await Note.createNote(createdReader, simpleNoteObject)

    // Add tags to notes
    const tagNote1 = await Note_Tag.addTagToNote(urlToId(note1.id), tag1.id)
    const tagNote2 = await Note_Tag.addTagToNote(urlToId(note2.id), tag2.id)

    const result = await Note_Tag.removeTagFromNote(
      urlToId(tagNote1.noteId),
      tagNote1.tagId
    )

    // Check that the spcified entry has been removed
    removed = await Note_Tag.query().where({
      noteId: tagNote1.noteId,
      tagId: tagNote1.tagId
    })

    // Check that the not specified entry has not been removed
    notRemoved = await Note_Tag.query().where({
      noteId: tagNote2.noteId,
      tagId: tagNote2.tagId
    })

    // Make sure only 1 is removed
    tap.equal(result, 1)
    tap.ok(typeof removed, Error)
    tap.ok(notRemoved[0] instanceof Note_Tag)
  })

  await tap.test('Remove a tag with an invalid noteId', async () => {
    const result = await Note_Tag.removeTagFromNote(
      newNote.id + 'Blah1233333333333',
      newTag.id
    )

    tap.ok(typeof result, Error)
    tap.equal(result.message, 'not found')
  })

  await tap.test('Remove a tag with an invalid tagId', async () => {
    const result = await Note_Tag.removeTagFromNote(newNote.id, newTag.id + 123)

    tap.ok(typeof result, Error)
    tap.equal(result.message, 'not found')
  })

  await tap.test('Delete a Note', async () => {
    const tag = await Tag.createTag(createdReader.id, {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'random name for tag'
    })

    await Note_Tag.addTagToNote(urlToId(newNote.id), tag.id)

    // Fetch the note with the new tag
    const noteWithTag = await Note.byId(urlToId(newNote.id))

    await tap.ok(!noteWithTag.deleted)
    await tap.ok(noteWithTag.tags.length !== 0)

    // Delete the note
    const noteDeleted = await Note.delete(urlToId(noteWithTag.id))

    await tap.ok(noteDeleted.deleted)
    await tap.ok(!noteDeleted.tags)
  })

  await destroyDB(app)
}

module.exports = test
