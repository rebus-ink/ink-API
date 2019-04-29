const { BaseModel } = require('./BaseModel')
const { Publication } = require('./Publication')
const { Tag } = require('./Tag')
const { urlToId } = require('../routes/utils')

class Publication_Tag extends BaseModel {
  static get tableName () {
    return 'publication_tag'
  }

  static get idColumn () {
    return ['publicationId', 'tagId']
  }

  static async addTagToPub (
    publicationId /*: string */,
    tagId /*: number */
  ) /*: any */ {
    // check publication
    if (!publicationId) return new Error('no publication')

    // check tag
    if (!tagId) return new Error('no tag')

    const newTag = await Tag.byId(tagId)

    // // check if already exists - SKIPPED FOR NOW
    // const result = await Publications_Tags.query().where({
    //   publicationId: publication.id,
    //   tagId
    // })
    // if (result.length > 0) {
    //   return new Error('duplicate')

    try {
      return await Publication_Tag.query().insertAndFetch({
        publicationId: publicationId,
        tagId
      })
    } catch (err) {
      if (err.constraint === 'publication_tag_tagid_foreign') {
        return new Error('no tag')
      } else if (err.constraint === 'publication_tag_publicationid_foreign') {
        return new Error('no publication')
      }
    }
  }

  static async removeTagFromPub (
    publicationId /*: string */,
    tagId /*: string */
  ) /*: number */ {
    // check publication
    if (!publicationId) return new Error('no publication')

    // check tag
    if (!tagId) return new Error('no tag')

    const result = await Publication_Tag.query()
      .delete()
      .where({
        publicationId: urlToId(publicationId),
        tagId
      })

    if (result === 0) {
      return new Error('not found')
    } else {
      return result
    }
  }

  $beforeInsert (queryOptions /*: any */, context /*: any */) /*: any */ {
    const parent = super.$beforeInsert(queryOptions, context)
    let doc = this
    return Promise.resolve(parent).then(function () {
      doc.published = undefined
      doc.id = undefined
    })
  }
}

module.exports = { Publication_Tag }
