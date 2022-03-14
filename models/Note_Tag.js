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
  static get tableName () /*:string */ {
    return 'note_tag'
  }

  static get idColumn () /*:Array<string> */ {
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

  /**
   * warning: does not throw errors
   */
  static async addMultipleTagsToNote (
    noteId /*: string */,
    tags /*: Array<string> */
  ) {
    const list = tags.map(tag => {
      return { noteId, tagId: tag }
    })

    // ignores errors - if errors encountered with first insert, insert one by one
    try {
      await Note_Tag.query().insert(list)
    } catch (err) {
      // if inserting all at once failed, insert one at a time and ignore errors
      list.forEach(async item => {
        try {
          await Note_Tag.query().insert(item)
        } catch (err2) {
          // eslint-disable-next-line
          return
        }
      })
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

  static async replaceTagsForNote (
    noteId /*: string */,
    tags /*: Array<string> */
  ) /*: Promise<any> */ {
    await this.deleteNoteTagsOfNote(noteId)
    return await this.addMultipleTagsToNote(noteId, tags)
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

  static async copyTagsFromAnotherNote (
    originalNoteId /*: string */,
    newNoteId /*: string */
  ) {
    const listOfNote_Tags = await Note_Tag.query().where(
      'noteId',
      '=',
      originalNoteId
    )
    if (listOfNote_Tags.length > 0) {
      let list = listOfNote_Tags.map(note_tag => {
        return { tagId: note_tag.tagId, noteId: newNoteId }
      })
      await Note_Tag.query().insert(list)
    }
  }
}

module.exports = { Note_Tag }
