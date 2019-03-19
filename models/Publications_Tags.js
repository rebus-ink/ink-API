const { Model } = require('objection')
const { Publication } = require('./Publication')
const { Tag } = require('./Tag')
const { urlToShortId, urlToId } = require('../routes/utils')

class Publications_Tags extends Model {
  static get tableName () {
    return 'publications_tags'
  }

  static get idColumn () {
    return ['publicationId', 'tagId']
  }

  static async addTagToPub (
    publicationUrl /*: string */,
    tagId /*: number */
  ) /*: any */ {
    // check publication
    if (!publicationUrl) return new Error('no publication')
    const publicationId = await urlToId(publicationUrl)

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
      return await Publications_Tags.query().insert({
        publicationId: publicationId,
        tagId
      })
    } catch (err) {
      if (err.constraint === 'publications_tags_tagid_foreign') {
        return new Error('no tag')
      } else if (err.constraint === 'publications_tags_publicationid_foreign') {
        return new Error('no publication')
      }
    }
  }

  static async removeTagFromPub (
    publicationUrl /*: string */,
    tagId /*: string */
  ) /*: number */ {
    const publicationId = await urlToId(publicationUrl)

    // check publication
    if (!publicationUrl) return new Error('no publication')

    // check tag
    if (!tagId) return new Error('no tag')

    const result = await Publications_Tags.query()
      .delete()
      .where({
        publicationId: publicationId,
        tagId
      })

    if (result === 0) {
      return new Error('not found')
    } else {
      return result
    }
  }
}

module.exports = { Publications_Tags }
