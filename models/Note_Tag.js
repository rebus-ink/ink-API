const { Model } = require('objection')

class Note_Tag extends Model {
  static get tableName () {
    return 'note_tag'
  }

  static get idColumn () {
    return ['noteId', 'tagId']
  }

  static async addTagToNote (
    noteId /*: string */,
    tagId /*: number */
  ) /*: any */ {
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
      }
    }
  }

  static async removeTagFromNote (
    noteId /*: string */,
    tagId /*: string */
  ) /*: number */ {
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
}

module.exports = { Note_Tag }
