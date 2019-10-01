const express = require('express')
const router = express.Router()
const passport = require('passport')
const boom = require('@hapi/boom')
const { Job } = require('../models/Job')

/**
 * @swagger
 * definition:
 *   job:
 *     properties:
 *       id:
 *         type: integer
 *       type:
 *         type: string
 *         enum: ['epub']
 *       published:
 *         type: string
 *         format: date-time
 *       finished:
 *         type: string
 *         format: date-time
 *       error:
 *         type: string
 *       publicationId:
 *         type: string
 *       status:
 *         type: integer
 *         enum: [302, 304, 500]
 *
 */
module.exports = function (app) {
  /**
   * @swagger
   * /job-{id}:
   *   get:
   *     tags:
   *       - jobs
   *     description: GET /job-:id
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: the id of the job
   *     security:
   *       - Bearer: []
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: A Job Object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/job'
   *       404:
   *         description: 'No Job with ID {id}'
   */
  app.use('/', router)
  router.get(
    '/job-:id',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      Job.byId(id)
        .then(job => {
          if (!job) {
            return next(
              boom.notFound(`No job with ID ${id}`, {
                type: 'Job',
                id: id,
                activity: 'Get Job'
              })
            )
          } else {
            // if (job.publicationUrl && job.status === 302) {
            //   res.redirect(302, job.publicationUrl)
            // }
            res.setHeader('Content-Type', 'application/ld+json;')
            res.end(JSON.stringify(job))
          }
        })
        .catch(next)
    }
  )
}
