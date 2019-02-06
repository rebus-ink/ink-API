const { Model } = require('objection')
const parseurl = require('url').parse
const { Publication } = require('./Publication')

class Publications_Tags extends Model {
  static get tableName () {
    return 'publications_tags'
  }

  static async addTagToPub (
    publicationUrl /*: string */,
    tagId /*: string */
  ) /*: any */ {
    let publicationShortId = parseurl(publicationUrl).path.substr(13)
    const publication = await Publication.byShortId(publicationShortId)
    try {
      return await Publications_Tags.query().insert({
        publicationId: publication.id,
        tagId
      })
    } catch (err) {
      return err
    }
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
