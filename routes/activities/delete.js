const { createActivityObject } = require('../../utils/utils')
const { Publication } = require('../../models/Publication')
const { Activity } = require('../../models/Activity')
const { Note } = require('../../models/Note')
const { Tag } = require('../../models/Tag')
const { urlToId } = require('../../utils/utils')
const boom = require('@hapi/boom')
const { libraryCacheUpdate } = require('../../utils/cache')

const handleDelete = async (req, res, next, reader) => {
  const body = req.body

  if (!body.object) {
    return next(
      boom.badRequest(`cannot delete without an object`, {
        missingParams: ['object'],
        activity: 'Delete'
      })
    )
  }

  if (!body.object.type) {
    return next(
      boom.badRequest(`cannot delete without an object type`, {
        missingParams: ['object.type'],
        activity: 'Delete'
      })
    )
  }

  switch (body.object.type) {
    case 'Publication':
      const returned = await Publication.delete(urlToId(body.object.id))
      if (returned === null) {
        return next(
          boom.notFound(
            `publication with id ${
              body.object.id
            } does not exist or has already been deleted`,
            {
              type: 'Publication',
              id: body.object.id,
              activity: 'Delete Publication'
            }
          )
        )
      }
      const activityObjPub = createActivityObject(body, returned, reader)
      const pubActivity = await Activity.createActivity(activityObjPub)

      await libraryCacheUpdate(reader.id)

      res.status(204)
      res.set('Location', pubActivity.id)
      res.end()

      break

    case 'Note':
      const resultNote = await Note.delete(urlToId(body.object.id))
      if (resultNote === null) {
        return next(
          boom.notFound(
            `note with id ${
              body.object.id
            } does not exist or has already been deleted`,
            { type: 'Note', id: body.object.id, activity: 'Delete Note' }
          )
        )
      }
      const activityObjNote = createActivityObject(body, resultNote, reader)
      const noteActivity = await Activity.createActivity(activityObjNote)

      res.status(204)
      res.set('Location', noteActivity.id)
      res.end()

      break

    case 'reader:Tag':
      const resultTag = await Tag.deleteTag(urlToId(body.object.id))
      if (resultTag === null || resultTag === 0) {
        return next(
          boom.notFound(
            `tag with id ${
              body.object.id
            } does not exist or has already been deleted`,
            { type: 'reader:Tag', id: body.object.id, activity: 'Delete Tag' }
          )
        )
      } else if (resultTag instanceof Error || !resultTag) {
        if (resultTag.message === 'no tag') {
          return next(
            boom.notFound(
              `tag with id ${
                body.object.id
              } does not exist or has already been deleted`,
              { type: 'reader:Tag', id: body.object.id, activity: 'Delete Tag' }
            )
          )
        } else {
          return next(err)
        }
      }
      const activityObjTag = createActivityObject(body, body.object, reader)
      const tagActivity = await Activity.createActivity(activityObjTag)

      await libraryCacheUpdate(reader.id)

      res.status(204)
      res.set('Location', tagActivity.id)
      res.end()

    case 'Collection':
      if (body.object.name !== 'Publication Notes') {
        return next(
          boom.badRequest(`invalid collection name: ${body.object.name}`, {
            type: 'Collection',
            activity: 'Delete Collection',
            badParams: ['object.name']
          })
        )
      }

      if (!body.object.id) {
        return next(
          boom.badRequest(`missing publication id`, {
            type: 'Collection',
            activity: 'Delete Collection',
            missingParams: ['object.id']
          })
        )
      }

      await Publication.deleteNotes(urlToId(body.object.id))
      const activityObjNotes = createActivityObject(body, body.object, reader)
      const collectionActivity = await Activity.createActivity(activityObjNotes)
      res.status(204)
      res.set('Location', collectionActivity.id)
      res.end()

      break

    default:
      return next(
        boom.badRequest(`cannot delete ${body.object.type}`, {
          badParams: ['object.type'],
          type: body.object.type,
          activity: 'Delete'
        })
      )
  }
}

module.exports = { handleDelete }
