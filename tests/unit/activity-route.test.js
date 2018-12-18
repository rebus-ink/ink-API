const proxyquire = require('proxyquire')
const sinon = require('sinon')
const supertest = require('supertest')
const express = require('express')
const tap = require('tap')
const passport = require('passport')
const { Strategy, ExtractJwt } = require('passport-jwt')
const MockStrategy = require('passport-mock-strategy')
const { Activity } = require('../../models/Activity')

const setupPassport = () => {
  var opts = {}
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
  opts.secretOrKey = process.env.SECRETORKEY
  opts.issuer = process.env.ISSUER
  opts.audience = process.env.AUDIENCE
  opts.name = 'jwt'
  passport.use(new MockStrategy(opts))
}

setupPassport()

const app = express()
const urlparse = require('url').parse

const activity = {
  type: 'Create',
  object: {
    type: 'reader:Publication',
    id: 'http://localhost:8080/publication-q9g6Rd2XVdvBGPFu16Zyoz'
  },
  actor: {
    type: 'Person',
    id: 'http://localhost:8080/reader-RS56UPqyooM14eUsP9t6m'
  },
  summaryMap: {
    en: 'someone created'
  },
  'reader-id': 'http://localhost:8080/reader-1234',
  'publication-id': 'http://localhost:8080/publication-1234',
  id: 'http://localhost:8080/activity-puPTzt9V953Kakr8qwtCPg',
  published: '2018-11-28T16:11:30.931Z',
  updated: '2018-11-28 16:11:30',
  attributedTo: []
}

const test = async () => {
  const ActivityStub = {}
  const checkReaderStub = sinon.stub()

  const activityRoute = proxyquire('../../routes/activity', {
    '../models/Activity.js': ActivityStub,
    './utils.js': {
      checkReader: checkReaderStub
    },
    // 'passport': {
    //   authenticate: authenticateStub
    // }
    '@noCallThru': true
  })

  // const token = require('../utils/get-token')
  ActivityStub.Activity.byShortId = async () => Promise.resolve(activity)

  activityRoute(app)
  const request = supertest(app)

  await tap.test('Create activity', async () => {
    // getActivityStub.resolves(response)
    checkReaderStub.returns(true)
    // authenticateStub.yields(null, {id: '1'})

    const res = await request
      .get('/activity-123')
      .set('Host', 'reader-api.test')
      // .set('Authentication', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    console.log('response: ', res.body)

    await tap.equal(res.statusCode, 200)
  })

  tap.afterEach(() => {
    authenticateStub = sinon.restore()
  })
}

test()
