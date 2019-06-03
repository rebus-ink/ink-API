const { Tag } = require('../../models/Tag')
const { Activity } = require('../../models/Activity')
const { Publication } = require('../../models/Publication')
const { Note } = require('../../models/Note')
const { createActivityObject } = require('../../utils/utils')
const boom = require('@hapi/boom')

const handleCreate = async (req, res, next, reader) => {
  const body = req.body

  if (!body.object) {
    return next(
      boom.badRequest(`cannot create without an object`, {
        missingParams: ['object'],
        activity: 'Create'
      })
    )
  }

  if (!body.object.type) {
    return next(
      boom.badRequest(`cannot create without an object type`, {
        missingParams: ['object.type'],
        activity: 'Create'
      })
    )
  }

  switch (body.object.type) {
    case 'Publication':
      const resultPub = await Publication.createPublication(reader, body.object)
      if (resultPub instanceof Error || !resultPub) {
        const message = resultPub
          ? resultPub.message
          : 'publication creation failed'
        res.status(400).send(`create publication error: ${message}`)
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

    case 'Note':
      let resultNote
      try {
        resultNote = await Note.createNote(reader, body.object)
      } catch (err) {
        if (err.message === 'no document') {
          return next(
            boom.notFound(
              `note creation failed: no document found with url ${
                body.object.inReplyTo
              }`,
              {
                type: 'Document',
                id: body.object.inReplyTo,
                activity: 'Create Note'
              }
            )
          )
        }
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

    case 'reader:Stack':
      const resultStack = await Tag.createTag(reader.id, body.object)

      if (resultStack instanceof Error && resultStack.message === 'duplicate') {
        return next(
          boom.badRequest(
            `duplicate error: stack ${body.object.name} already exists`,
            { activity: 'Create Tag', type: 'Tag' }
          )
        )
      }
      if (resultStack instanceof Error || !resultStack) {
        const message = resultStack
          ? resultStack.message
          : 'stack creation failed'
        res.status(400).send(`create stack error: ${message}`)
      }
      const activityObjStack = createActivityObject(body, resultStack, reader)

      Activity.createActivity(activityObjStack)
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
        boom.badRequest(`cannot create ${body.object.type}`, {
          badParams: ['object.type'],
          type: body.object.type,
          activity: 'Create'
        })
      )
  }
}

module.exports = { handleCreate }
