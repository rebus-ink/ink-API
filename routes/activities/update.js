const { Activity } = require('../../models/Activity')
const { Publication } = require('../../models/Publication')
const { createActivityObject } = require('../../utils/utils')
const { Note } = require('../../models/Note')

const handleUpdate = async (req, res, reader) => {
  const body = req.body
  switch (body.object.type) {
    case 'Note':
      const resultNote = await Note.update(body.object)
      if (resultNote === null) {
        res.status(404).send(`no note found with id ${body.object.id}`)
        break
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
        res.status(404).send(`no publication found with id ${body.object.id}`)
        break
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
      res.status(400).send(`cannot update ${body.object.type}`)
      break
  }
}

module.exports = { handleUpdate }
