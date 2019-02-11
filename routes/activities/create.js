const { Reader } = require('../../models/Reader')
const { Tag } = require('../../models/Tag')
const { Activity } = require('../../models/Activity')
const { createActivityObject } = require('./utils')

const handleCreate = async (req, res, reader) => {
  const body = req.body
  switch (body.object.type) {
    case 'reader:Publication':
      const resultPub = await Reader.addPublication(reader, body.object)
      const activityObjPub = createActivityObject(body, resultPub, reader)
      Activity.createActivity(activityObjPub)
        .then(activity => {
          res.status(201)
          res.set('Location', activity.url)
          res.end()
        })
        .catch(err => {
          res.status(400).send(`create publication error: ${err.message}`)
        })
      break

    case 'Document':
      const resultDoc = await Reader.addDocument(reader, body.object)
      const activityObjDoc = createActivityObject(body, resultDoc, reader)
      Activity.createActivity(activityObjDoc)
        .then(activity => {
          res.status(201)
          res.set('Location', activity.url)
          res.end()
        })
        .catch(err => {
          res.status(400).send(`create document error: ${err.message}`)
        })
      break

    case 'Note':
      const resultNote = await Reader.addNote(reader, body.object)
      const activityObjNote = createActivityObject(body, resultNote, reader)
      Activity.createActivity(activityObjNote)
        .then(activity => {
          res.status(201)
          res.set('Location', activity.url)
          res.end()
        })
        .catch(err => {
          res.status(400).send(`create note error: ${err.message}`)
        })
      break

    case 'reader:Stack':
      const resultStack = await Tag.createTag(reader.id, body.object)
      const activityObjStack = createActivityObject(body, resultStack, reader)
      Activity.createActivity(activityObjStack)
        .then(activity => {
          res.status(201)
          res.set('Location', activity.url)
          res.end()
        })
        .catch(err => {
          res.status(400).send(`create stack error: ${err.message}`)
        })
      break

    default:
      res.status(400).send(`cannot create ${body.object.type}`)
      break
  }
}

module.exports = { handleCreate }
