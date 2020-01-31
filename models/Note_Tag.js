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
        throw new Error('no tag')
      } else if (err.constraint === 'note_tag_noteid_foreign') {
        throw new Error('no note')
      } else if (err.constraint === 'note_tag_noteid_tagid_unique') {
        throw new Error(
          `Add Tag To Note Error: Tag ${tagId} is already assigned to Note ${noteId}`
        )
      }
    }
  }

  static async removeTagFromNote (
    noteId /*: string */,
    tagId /*: string */
  ) /*: Promise<NoteTagType|Error> */ {
    const result = await Note_Tag.query()
      .delete()
      .where({
        noteId: noteId,
        tagId
      })

    if (result === 0) {
      throw new Error(
        `Delete Tag from Note Error: No relationship found between Note ${noteId} and Tag ${tagId}`
      )
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
