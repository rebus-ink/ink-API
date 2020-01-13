// @flow
const { Model } = require('objection')
const { urlToId } = require('../utils/utils')

/*::
type NoteTagType = {
  id: string,
  noteId: string,
  tagId: string
};
*/

class Note_Tag extends Model {
  static get tableName () {
    return 'note_tag'
  }

  static get idColumn () {
    return ['noteId', 'tagId']
  }

  static async addTagToNote (
    noteId /*: string */,
    tagId /*: string */
  ) /*: Promise<any> */ {
    if (!noteId) return new Error('no note')

    if (!tagId) return new Error('no tag')

    try {
      return await Note_Tag.query().insert({
        noteId: noteId,
        tagId
      })
    } catch (err) {
      if (err.constraint === 'note_tag_tagid_foreign') {
        return new Error('no tag')
      } else if (err.constraint === 'note_tag_noteid_foreign') {
        return new Error('no note')
      } else if (err.constraint === 'note_tag_noteid_tagid_unique') {
        return new Error('duplicate')
      }
    }
  }

  static async removeTagFromNote (
    noteId /*: string */,
    tagId /*: string */
  ) /*: Promise<NoteTagType|Error> */ {
    if (!noteId) return new Error('no note')

    if (!tagId) return new Error('no tag')

    const result = await Note_Tag.query()
      .delete()
      .where({
        noteId: noteId,
        tagId
      })

    if (result === 0) {
      return new Error('not found')
    } else {
      return result
    }
  }

  static async deleteNoteTagsOfNote (
    noteId /*: string */
  ) /*: Promise<number|Error> */ {
    if (!noteId) return new Error('no note')

    return await Note_Tag.query()
      .delete()
      .where({ noteId: urlToId(noteId) })
  }

  static async deleteNoteTagsOfTag (
    tagId /*: string */
  ) /*: Promise<number|Error> */ {
    if (!tagId) return new Error('no tag')

    return await Note_Tag.query()
      .delete()
      .where({ tagId: urlToId(tagId) })
  }
}

module.exports = { Note_Tag }
