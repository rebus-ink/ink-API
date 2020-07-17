const express = require('express')
const router = express.Router()
const { Datastore } = require('@google-cloud/datastore')
const datastore = new Datastore()
const metricsQuery = datastore.createQuery('ink-metrics', 'metric')
const _ = require('lodash')

/*
by default: all results will be sent, grouped by type, ordered by most recent to oldest.

query parameters:
- groupBy=user (this will created nested results. It will first groupBy type, then by user)
- start=date
- end=date
-
*/

module.exports = function (app) {
  app.use('/', router)
  router.route('/metrics').get(async function (req, res) {
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
        item => Date.parse(item.date) <= Date.parse(req.query.end)
      )
    }
    list = _.groupBy(list, 'type')
    if (req.query.groupBy === 'user') {
      const newList = {}
      const keys = _.keys(list)
      keys.forEach(key => {
        newList[key] = _.groupBy(list[key], 'user')
        if (req.query.countOnly) {
          const nestedKeys = _.keys(newList[key])
          nestedKeys.forEach(user => {
            newList[key][user] = newList[key][user].length
          })
        }
      })

      list = newList
    } else {
      if (req.query.countOnly) {
        const keys = _.keys(list)
        keys.forEach(key => {
          list[key] = list[key].length
        })
      }
    }

    res.send(list)
  })
}
