const { createActivityObject } = require('./utils')
const { Publication } = require('../../models/Publication')
const { Activity } = require('../../models/Activity')
const { Note } = require('../../models/Note')
const { urlToShortId } = require('../../routes/utils')

const handleDelete = async (req, res, reader) => {
  const body = req.body
  switch (body.object.type) {
    case 'reader:Publication':
      const returned = await Publication.delete(urlToShortId(body.object.id))
      if (returned === null) {
        res
          .status(404)
          .send(
            `publication with id ${
              body.object.id
            } does not exist or has already been deleted`
          )
        break
      } else if (returned instanceof Error || !returned) {
        const message = returned
          ? returned.message
          : 'publication deletion failed'
        res.status(400).send(`delete publication error: ${message}`)
        break
      }
      const activityObjPub = createActivityObject(body, returned, reader)
      Activity.createActivity(activityObjPub)
        .then(activity => {
          res.status(204)
          res.set('Location', activity.url)
          res.end()
        })
        .catch(err => {
          res.status(400).send(`create activity error: ${err.message}`)
        })
      break

    case 'Note':
      const resultNote = await Note.delete(urlToShortId(body.object.id))
      if (resultNote === null) {
        res
          .status(404)
          .send(
            `note with id ${
              body.object.id
            } does not exist or has already been deleted`
          )
        break
      } else if (resultNote instanceof Error || !resultNote) {
        const message = resultNote ? resultNote.message : 'note deletion failed'
        res.status(400).send(`delete note error: ${message}`)
        break
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

    default:
      res.status(400).send(`cannot delete ${body.object.type}`)
      break
  }
}

module.exports = { handleDelete }
