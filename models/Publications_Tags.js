const { Model } = require('objection')
const parseurl = require('url').parse
const { Publication } = require('./Publication')
const { Tag } = require('./Tag')

class Publications_Tags extends Model {
  static get tableName () {
    return 'publications_tags'
  }

  static async addTagToPub (
    publicationUrl /*: string */,
    tagUrl /*: string */
  ) /*: any */ {
    let publicationShortId = parseurl(publicationUrl).path.substr(13)
    let tagShortId = parseurl(tagUrl).path.substr(5)
    const publication = await Publication.byShortId(publicationShortId)
    const tag = await Tag.byShortId(tagShortId)
    return await Publications_Tags.query().insert({
      publicationId: publication.id,
      tagId: tag.id
    })
  }

  static async removeTagFromPub (
    publicationUrl /*: string */,
    tagUrl /*: string */
  ) /*: number */ {
    let publicationShortId = parseurl(publicationUrl).path.substr(13)
    let tagShortId = parseurl(tagUrl).path.substr(5)
    const publication = await Publication.byShortId(publicationShortId)
    const tag = await Tag.byShortId(tagShortId)
    return await Publications_Tags.query()
      .delete()
      .where({
        publicationId: publication.id,
        tagId: tag.id
      })
  }
}

module.exports = { Publications_Tags }
