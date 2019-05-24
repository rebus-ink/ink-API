const { createActivityObject } = require('../../utils/utils')
const { Publication } = require('../../models/Publication')
const { Activity } = require('../../models/Activity')
const { Note } = require('../../models/Note')
const { Tag } = require('../../models/Tag')
const { urlToId } = require('../../utils/utils')
const boom = require('@hapi/boom')

const handleDelete = async (req, res, next, reader) => {
  const body = req.body
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
      } else if (returned instanceof Error || !returned) {
        const message = returned
          ? returned.message
          : 'publication deletion failed'

        return next(
          boom.badRequest(`delete publication error: ${message}`, {
            type: 'Publication',
            activity: 'Delete Publication'
          })
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
      } else if (resultNote instanceof Error || !resultNote) {
        const message = resultNote ? resultNote.message : 'note deletion failed'
        return next(
          boom.badRequest(`delete note error: ${message}`, {
            type: 'Note',
            activity: 'Delete Note'
          })
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

    case 'Tag':
      const resultTag = await Tag.deleteTag(urlToId(body.object.id))
      if (resultTag === null || resultTag === 0) {
        res
          .status(404)
          .send(
            `tag with id ${
              body.object.id
            } does not exist or has already been deleted`
          )
        break
      } else if (resultTag instanceof Error || !resultTag) {
        const message = resultTag ? resultTag.message : 'tag deletion failed'
        res.status(400).send(`delete tag error: ${message}`)
        break
      }
      const activityObjTag = createActivityObject(body, body.object.id, reader)
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

    default:
      return next(
        boom.badRequest(`cannot delete ${body.object.type}`, {
          badParams: ['object.type'],
          activity: `Delete ${body.object.type}`
        })
      )
  }
}

module.exports = { handleDelete }
