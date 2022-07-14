const express = require('express')
const router = express.Router()
const _ = require('lodash')
const { getMetadata } = require('../utils/metadata-get')

module.exports = function (app) {
  app.use('/', router)
  router.route('/metadata').get(async function (req, res) {
    let apis = {
      crossref: !!req.query.crossref,
      doaj: !!req.query.crossref,
      loc: !!req.query.loc
    }
    let title = req.query.title

    const response = await getMetadata(title, apis)

    res.send(response)
  })
}
