const express = require('express')
const router = express.Router()
const { Datastore } = require('@google-cloud/datastore')
const datastore = new Datastore()
const metricsQuery = datastore.createQuery('ink-metrics', 'metric')
const _ = require('lodash')

module.exports = function (app) {
  app.use('/', router)
  router.route('/metrics').get(async function (req, res) {
    console.log(req.query)
    let [list] = await datastore.runQuery(metricsQuery)
    list = list.map(item => {
      return {
        type: item.type,
        date: item.date,
        user: item.user
      }
    })
    list = _.orderBy(list, 'date', 'desc')
    if (req.query.start) {
      list = list.filter(
        item => Date.parse(item.date) > Date.parse(req.query.start)
      )
    }
    if (req.query.end) {
      list = list.filter(
        item => Date.parse(item.date) < Date.parse(req.query.end)
      )
    }
    list = _.groupBy(list, 'type')

    res.send(list)
  })
}
