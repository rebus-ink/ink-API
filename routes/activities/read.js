const { createActivityObject } = require('./utils')
const { Activity } = require('../../models/Activity')
const { ReadActivity } = require('../../models/ReadActivity')
const { Document } = require('../../models/Document')
const { urlToId } = require('../utils')

const handleRead = async (req, res, reader) => {
  const body = req.body
  switch (body.object.type) {
    case 'Document':
      const resultDoc = await Document.byId(urlToId(body.object.id))
      if (!resultDoc) {
        res.status(404).send(`document with id ${body.object.id} not found`)
        break
      }

      // const activityObjStack = createActivityObject(body, resultDoc, reader)
      const object = {
        selector: body['oa:hasSelector']
      }

      if (body.json) {
        object.json = body.json
      }
      console.log('activity selector object')
      console.log(object)
      ReadActivity.createReadActivity(reader.id, body.context, object)
        .then(activity => {
          console.log('Content of ReadActivity:')
          console.log(activity)
          res.status(201)
          res.set('Location', activity.id)
          res.end()
        })
        .catch(err => {
          res.status(400).send(`create read activity error: ${err.message}`)
        })
      break

    default:
      res.status(400).send(`cannot read ${body.object.type}`)
      break
  }
}

module.exports = { handleRead }
