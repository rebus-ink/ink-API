const { Model } = require('objection')
const { urlToId } = require('../routes/utils')
const { BaseModel } = require('./BaseModel.js')
const { Note } = require('./Note')
const { Tag } = require('./Tag')

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
    // check publication

    if (!noteId) return new Error('no note')

    // check tag
    if (!tagId) return new Error('no tag')

    // // check if already exists - SKIPPED FOR NOW
    // const result = await Publications_Tags.query().where({
    //   publicationId: publication.id,
    //   tagId
    // })
    // if (result.length > 0) {
    //   return new Error('duplicate')

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
    // check publication

    console.log('note and tag id: ' + noteId + ' and ' + tagId)

    if (!noteId) return new Error('no note')

    // check tag
    if (!tagId) return new Error('no tag')

    const result = await Note_Tag.query()
      .delete()
      .where({
        noteId: noteId,
        tagId
      })

    console.log('The result: ' + result)

    if (result === 0) {
      return new Error('not found')
    } else {
      return result
    }
  }
}

module.exports = { Note_Tag }
