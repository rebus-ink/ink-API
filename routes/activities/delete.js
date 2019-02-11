const { createActivityObject } = require('./utils')
const { Publication } = require('../../models/Publication')
const parseurl = require('url').parse
const { Activity } = require('../../models/Activity')

const handleDelete = async (req, res, reader) => {
  const body = req.body
  switch (body.object.type) {
    case 'reader:Publication':
      const resultPub = Publication.delete(
        parseurl(body.object.id).path.substr(13)
      )
      const activityObjPub = createActivityObject(body, resultPub, reader)
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

    default:
      res.status(400).send(`cannot delete ${body.object.type}`)
      break
  }
}

module.exports = { handleDelete }
