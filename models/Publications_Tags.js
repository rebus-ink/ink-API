const { Model } = require('objection')
const parseurl = require('url').parse
const { Publication } = require('./Publication')

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
    let publicationShortId = parseurl(publicationUrl).path.substr(13)
    const publication = await Publication.byShortId(publicationShortId)
    // check if already exists
    const result = await Publications_Tags.query().where({
      publicationId: publication.id,
      tagId
    })
    if (result.length > 0) {
      return new Error('duplicate')
    }
    return await Publications_Tags.query().insert({
      publicationId: publication.id,
      tagId
    })
  }

  static async removeTagFromPub (
    publicationUrl /*: string */,
    tagId /*: string */
  ) /*: number */ {
    let publicationShortId = parseurl(publicationUrl).path.substr(13)
    const publication = await Publication.byShortId(publicationShortId)
    return await Publications_Tags.query()
      .delete()
      .where({
        publicationId: publication.id,
        tagId
      })
  }
}

module.exports = { Publications_Tags }
