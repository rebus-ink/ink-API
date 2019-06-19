const { createActivityObject } = require('../../utils/utils')
const { Publication } = require('../../models/Publication')
const { Activity } = require('../../models/Activity')
const { Note } = require('../../models/Note')
const { Tag } = require('../../models/Tag')
const { urlToId } = require('../../utils/utils')
const boom = require('@hapi/boom')

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
      Activity.createActivity(activityObjPub)
        .then(activity => {
          res.status(204)
          res.set('Location', activity.url)
          res.end()
        })
        .catch(err => {
          return next(
            boom.badRequest(`create activity error: ${err.message}`, {
              type: 'Activity',
              activity: 'Delete Publication'
            })
          )
        })
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
      Activity.createActivity(activityObjNote)
        .then(activity => {
          res.status(204)
          res.set('Location', activity.url)
          res.end()
        })
        .catch(err => {
          res.status(400).send(`create activity error: ${err.message}`)
        })
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
        const message = resultTag ? resultTag.message : 'tag deletion failed'
        if (resultTag.message === 'no tag') {
          return next(
            boom.notFound(
              `tag with id ${
                body.object.id
              } does not exist or has already been deleted`,
              { type: 'reader:Tag', id: body.object.id, activity: 'Delete Tag' }
            )
          )
        }
        res.status(400).send(`delete tag error: ${message}`)
        break
      }
      const activityObjTag = createActivityObject(body, body.object, reader)
      Activity.createActivity(activityObjTag)
        .then(activity => {
          res.status(204)
          res.set('Location', activity.url)
          res.end()
        })
        .catch(err => {
          return next(
            boom.badRequest(`create activity error: ${err.message}`, {
              type: 'Activity',
              activity: 'Delete Note'
            })
          )
        })
      break

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
      Activity.createActivity(activityObjNotes)
        .then(activity => {
          res.status(204)
          res.set('Location', activity.url)
          res.end()
        })
        .catch(err => {
          res.status(400).send(`create activity error: ${err.message}`)
        })
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
