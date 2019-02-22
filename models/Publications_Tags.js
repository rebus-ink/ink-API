const { Model } = require('objection')
const { Publication } = require('./Publication')
const { Tag } = require('./Tag')
const { urlToShortId } = require('../routes/utils')

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
    let publicationShortId = urlToShortId(publicationUrl)
    const publication = await Publication.byShortId(publicationShortId)
    if (!publication) return new Error('no publication')

    // check tag
    if (!tagId) return new Error('no tag')
    const tag = await Tag.byId(tagId)
    if (!tag) return new Error('no tag')
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
    // check publication
    if (!publicationUrl) return new Error('no publication')
    let publicationShortId = urlToShortId(publicationUrl)
    const publication = await Publication.byShortId(publicationShortId)
    if (!publication) return new Error('no publication')

    // check tag
    if (!tagId) return new Error('no tag')
    const tag = await Tag.byId(tagId)
    if (!tag) return new Error('no tag')

    return await Publications_Tags.query()
      .delete()
      .where({
        publicationId: publication.id,
        tagId
      })
  }
}

module.exports = { Publications_Tags }
