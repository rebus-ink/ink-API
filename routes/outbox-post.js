const express = require('express')
const router = express.Router()
const passport = require('passport')
const { Reader } = require('../models/Reader')
const { Activity } = require('../models/Activity')
const { Publications_Tags } = require('../models/Publications_Tags')
const debug = require('debug')('hobb:routes:outbox')
const jwtAuth = passport.authenticate('jwt', { session: false })
const { Tag } = require('../models/Tag')

const utils = require('./utils')
/**
 * @swagger
 * definition:
 *   outbox-request:
 *     properties:
 *       type:
 *         type: string
 *         enum: ['Create', 'Add']
 *       object:
 *         type: object
 *         properties:
 *           type:
 *             type: string
 *             enum: ['reader:Publication', 'Document', 'Note', 'reader:Tag']
 *         additionalProperties: true
 *       '@context':
 *         type: array
 *
 */
module.exports = function (app) {
  /**
   * @swagger
   * /reader-{shortId}/activity:
   *   post:
   *     tags:
   *       - readers
   *     description: POST /reader-:shortId/activity
   *     parameters:
   *       - in: path
   *         name: shortId
   *         schema:
   *           type: string
   *         required: true
   *     security:
   *       - Bearer: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/definitions/outbox-request'
   *     responses:
   *       201:
   *         description: Created
   *       204:
   *         description: Successfully added or removed a tag
   *       404:
   *         description: 'No Reader with ID {shortId}'
   *       403:
   *         description: 'Access to reader {shortId} disallowed'
   */
  app.use('/', router)
  router
    .route('/reader-:shortId/activity')
    .post(jwtAuth, function (req, res, next) {
      const shortId = req.params.shortId
      Reader.byShortId(shortId)
        .then(reader => {
          if (!reader) {
            res.status(404).send(`No reader with ID ${shortId}`)
          } else if (!utils.checkReader(req, reader)) {
            res.status(403).send(`Access to reader ${shortId} disallowed`)
          } else {
            if (!req.is('application/ld+json')) {
              return next(new Error('Body must be JSON-LD'))
            }

            const body = req.body
            if (typeof body !== 'object') {
              return next(new Error('Body must be a JSON object'))
            }

            let pr
            let expectedStatus
            switch (body.type) {
              case 'Create':
                expectedStatus = 201
                switch (body.object.type) {
                  case 'reader:Publication':
                    pr = Reader.addPublication(reader, body.object)
                    break
                  case 'Document':
                    pr = Reader.addDocument(reader, body.object)
                    break
                  case 'Note':
                    pr = Reader.addNote(reader, body.object)
                    break
                  case 'reader:Stack':
                    pr = Tag.createTag(reader.id, body.object)
                    break
                  default:
                    res.status(400).send(`cannot create ${body.object.type}`)
                    break
                }
                break

              case 'Add':
                expectedStatus = 204
                switch (body.object.type) {
                  case 'reader:Stack':
                    pr = Publications_Tags.addTagToPub(
                      body.target.id,
                      body.object.id
                    )
                    break

                  default:
                    res.status(400).send(`cannot add ${body.object.type}`)
                    break
                }
                break

              case 'Remove':
                expectedStatus = 204
                switch (body.object.type) {
                  case 'reader:Stack':
                    pr = Publications_Tags.removeTagFromPub(
                      body.target.id,
                      body.object.id
                    )
                    break

                  default:
                    res.status(400).send(`cannot remove ${body.object.type}`)
                    break
                }
                break

              case 'Arrive': // used for testing only
                expectedStatus = 201
                pr = Promise.resolve(null)
                break

              default:
                res.status(400).send(`action ${body.type} not reconized`)

                break
            }
            pr
              .then(result => {
                debug(result)
                // catching duplicate entries to publication_tag table
                if (
                  body.object &&
                  body.object.type === 'reader:Stack' &&
                  result &&
                  result.code === 'SQLITE_CONSTRAINT'
                ) {
                  return res
                    .status(400)
                    .send(
                      `publication ${
                        body.target.id
                      } already asssociated with tag ${body.object.id} (${
                        body.object.name
                      })`
                    )
                }
                let props = Object.assign(body, {
                  actor: {
                    type: 'Person',
                    id: reader.url
                  }
                })
                if (result) {
                  props = Object.assign(props, {
                    object: {
                      type: result.json ? result.json.type : null,
                      id: result.url
                    }
                  })
                }
                debug(props)
                Activity.createActivity(props)
                  .then(activity => {
                    res.status(expectedStatus)
                    res.set('Location', activity.url)
                    res.end()
                  })
                  .catch(next)
              })
              .catch(next)
          }
        })
        .catch(err => {
          next(err)
        })
    })
}
