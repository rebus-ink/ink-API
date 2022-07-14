/*
DISABLED BECAUSE IT RELIES ON GOOGLE CLOUD, WHICH HAS BEEND DISABLED.

*/


// const express = require('express')
// const router = express.Router()
// const { Datastore } = require('@google-cloud/datastore')
// const datastore = new Datastore()
// const metricsQuery = datastore.createQuery('ink-metrics', 'metric')
// const _ = require('lodash')

// /*
// by default: all results will be sent, grouped by type, ordered by most recent to oldest.

// query parameters:
// - groupBy=user (this will created nested results. It will first groupBy type, then by user)
// - start=date
// - end=date
// -
// */



// module.exports = function (app) {
//   app.use('/', router)
//   router.route('/metrics').get(async function (req, res) {
//     let [list] = await datastore.runQuery(metricsQuery)
//     let csv
//     list = list.map(item => {
//       return {
//         type: item.type,
//         date: item.date,
//         user: item.user
//       }
//     })
//     list = _.orderBy(list, 'date', 'desc')
//     if (req.query.start) {
//       list = list.filter(
//         item => Date.parse(item.date) > Date.parse(req.query.start)
//       )
//     }
//     if (req.query.end) {
//       list = list.filter(
//         item => Date.parse(item.date) <= Date.parse(req.query.end)
//       )
//     }
//     list = _.groupBy(list, 'type')
//     if (req.query.groupBy === 'user') {
//       const newList = {}
//       const keys = _.keys(list)
//       keys.forEach(key => {
//         newList[key] = _.groupBy(list[key], 'user')
//         if (req.query.countOnly) {
//           const nestedKeys = _.keys(newList[key])
//           nestedKeys.forEach(user => {
//             newList[key][user] = newList[key][user].length
//           })
//         }
//       })

//       list = newList
//     } else if (req.query.groupBy === 'date') {
//       const newList = {}
//       const keys = _.keys(list)
//       keys.forEach(key => {
//         // convert dates
//         let listWithDates = {}
//         listWithDates[key] = list[key].map(item => {
//           const date = new Date(item.date)
//           item.date = `${date.getFullYear()}-${date.getMonth() +
//             1}-${date.getDate()}`
//           return item
//         })
//         newList[key] = _.groupBy(listWithDates[key], 'date')
//         if (req.query.countOnly) {
//           const nestedKeys = _.keys(newList[key])
//           nestedKeys.forEach(date => {
//             newList[key][date] = newList[key][date].length
//           })
//         }
//       })

//       list = newList
//     } else if (req.query.groupBy === 'week') {
//       let newList = {}
//       const keys = _.keys(list)
//       keys.forEach(key => {
//         // convert dates
//         let listWithDates = {}
//         listWithDates[key] = list[key].map(item => {
//           const date = new Date(item.date)
//           const sundayDate = new Date(
//             date.setDate(date.getDate() - date.getDay())
//           )
//           item.date = `${sundayDate.getFullYear()}-${sundayDate.getMonth() +
//             1}-${sundayDate.getDate()}`
//           return item
//         })
//         newList[key] = _.groupBy(listWithDates[key], 'date')
//         if (req.query.countOnly) {
//           const nestedKeys = _.keys(newList[key])
//           nestedKeys.forEach(date => {
//             newList[key][date] = newList[key][date].length
//           })
//           if (req.query.format === 'csv') {
//             csv = `type,week,number`
//             let types = _.keys(newList)
//             types.forEach(type => {
//               let dates = _.keys(newList[type])
//               dates.forEach(date => {
//                 csv = `${csv},
//                 ${type},${date},${newList[type][date]}`
//               })
//             })
//           }
//         }
//       })

//       list = newList
//     } else {
//       if (req.query.countOnly) {
//         const keys = _.keys(list)
//         keys.forEach(key => {
//           list[key] = list[key].length
//         })
//       }
//     }

//     if (csv) {
//       console.log(csv)
//       res.setHeader('Content-Type', 'text/csv')
//       res.send(csv)
//     } else {
//       res.send(list)
//     }
//   })
// }
