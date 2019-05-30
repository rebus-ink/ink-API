const { Activity } = require('../../models/Activity')
const { Publication } = require('../../models/Publication')
const { createActivityObject } = require('../../utils/utils')
const { Note } = require('../../models/Note')
const boom = require('@hapi/boom')

const handleUpdate = async (req, res, next, reader) => {
  const body = req.body

  if (!body.object) {
    return next(
      boom.badRequest(`cannot update without an object`, {
        missingParams: ['object'],
        activity: 'Update'
      })
    )
  }

  if (!body.object.type) {
    return next(
      boom.badRequest(`cannot update without an object type`, {
        missingParams: ['object.type'],
        activity: 'Update'
      })
    )
  }

  switch (body.object.type) {
    case 'Note':
      const resultNote = await Note.update(body.object)
      if (resultNote === null) {
        return next(
          boom.notFound(`no note found with id ${body.object.id}`, {
            type: 'Note',
            id: body.object.id,
            activity: 'Update Note'
          })
        )
      }
      const activityObjNote = createActivityObject(body, resultNote, reader)
      Activity.createActivity(activityObjNote)
        .then(activity => {
          res.status(201)
          res.set('Location', activity.id)
          res.end()
        })
        .catch(err => {
          res.status(400).send(`create activity error: ${err.message}`)
        })
      break

    case 'Publication':
      const resultPub = await Publication.update(body.object)
      if (resultPub === null) {
        return next(
          boom.notFound(`no publication found with id ${body.object.id}`, {
            type: 'Publication',
            id: body.object.id,
            activity: 'Update Publication'
          })
        )
      }
      const activityObjPub = createActivityObject(body, resultPub, reader)
      Activity.createActivity(activityObjPub)
        .then(activity => {
          res.status(201)
          res.set('Location', activity.id)
          res.end()
        })
        .catch(err => {
          res.status(400).send(`create activity error: ${err.message}`)
        })
      break

    default:
      return next(
        boom.badRequest(`cannot update ${body.object.type}`, {
          type: body.object.type,
          activity: 'Update',
          badParams: ['object.type']
        })
      )
  }
}

module.exports = { handleUpdate }
