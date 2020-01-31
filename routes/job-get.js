const express = require('express')
const router = express.Router()
const passport = require('passport')
const boom = require('@hapi/boom')
const { Job } = require('../models/Job')

module.exports = function (app) {
  /**
   * @swagger
   * /jobs/{id}:
   *   get:
   *     tags:
   *       - jobs
   *     description: Get a job by id to see the status of an upload / publication creation
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
   *       401:
   *         description: 'No Authentication'
   *       404:
   *         description: 'No Job with ID {id}'
   */
  app.use('/', router)
  router.get(
    '/jobs/:id',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      Job.byId(id)
        .then(job => {
          if (!job) {
            return next(
              boom.notFound(`No Job found with id ${id}`, {
                requestUrl: req.originalUrl
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
