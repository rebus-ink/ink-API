const express = require('express')
const router = express.Router()
const passport = require('passport')
const boom = require('@hapi/boom')
const { Job } = require('../models/Job')

module.exports = function (app) {
  app.use('/', router)
  router.patch(
    '/job-:id',
    passport.authenticate('jwt', { session: false }),
    function (req, res, next) {
      const id = req.params.id
      Job.updateJob(id, req.body)
        .then(job => {
          if (!job) {
            return next(
              boom.notFound(`No job with ID ${id}`, {
                type: 'Job',
                id: id,
                activity: 'Update Job'
              })
            )
          } else {
            res.setHeader('Content-Type', 'application/ld+json;')
            res.end(JSON.stringify(job))
          }
        })
        .catch(next)
    }
  )
}
