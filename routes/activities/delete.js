const { createActivityObject } = require('./utils')
const { Publication } = require('../../models/Publication')
const parseurl = require('url').parse
const { Activity } = require('../../models/Activity')
const { Note } = require('../../models/Note')

const handleDelete = async (req, res, reader) => {
  const body = req.body
  switch (body.object.type) {
    case 'reader:Publication':
      const returned = await Publication.delete(
        parseurl(body.object.id).path.substr(13)
      )
      const activityObjPub = createActivityObject(body, returned, reader)
      Activity.createActivity(activityObjPub)
        .then(activity => {
          res.status(204)
          res.set('Location', activity.url)
          res.end()
        })
        .catch(err => {
          res.status(400).send(`delete publication error: ${err.message}`)
        })
      break

    case 'Note':
      const resultNote = await Note.delete(
        parseurl(body.object.id).path.substr(6)
      )
      const activityObjNote = createActivityObject(body, resultNote, reader)
      Activity.createActivity(activityObjNote)
        .then(activity => {
          res.status(204)
          res.set('Location', activity.url)
          res.end()
        })
        .catch(err => {
          res.status(400).send(`delete note error: ${err.message}`)
        })
      break

    default:
      res.status(400).send(`cannot delete ${body.object.type}`)
      break
  }
}

module.exports = { handleDelete }
