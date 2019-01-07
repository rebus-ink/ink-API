# reader-api

IMPORTANT: this project is still in the very early stages and is not yet ready for unsolicited contributions.
If you are interested in the project, please contact the development team.

Hobb API Server: backend for the Rebus Reader system

[![Build Status](https://travis-ci.com/RebusFoundation/reader-api.svg?token=gL3WLUGSnpsqdtB2nHUM&branch=master)](https://travis-ci.com/RebusFoundation/reader-api)

## Starting the Server

To start the regular server: `npm start`

To start the dev-server (which uses `nodemon` to automatically restart): `npm run dev-server`

## Starting Tests

Unit tests can be run with `npm run test`

Integration tests will be added soon.

## Interface

### Authorization

The server uses [OAuth 2.0](https://oauth.net/2/) for authorization, with [JWT](https://jwt.io/)
tokens. The JWT tokens should use the same secret value as defined by the
`SECRETORKEY` configuration variable (see below). It should also use the
audience and issuer defined by `AUDIENCE` and `ISSUER`.

Tokens are passed to the server as [bearer tokens](https://oauth.net/2/bearer-tokens/).
A typical example:

```
GET /924WWrqtc2dbZMF2NQRiHp/library HTTP/1.1
Host: api.rebus.foundation
Date: Fri, 19 Oct 2018 16:25:55 GMT
Authorization: Bearer <token>
```

...where `<token>` is the JWT token.

Typically only the owner of a resource can access a resource.

#### Errors

Requests without a JWT token will fail with a 401 status code.

Requests with a valid JWT token for access to another user's resources will fail
with a 403 status code.

### Representation

The server follows the [ActivityPub](https://www.w3.org/TR/activitypub/) API.
All objects are represented as [Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/)
[JSON-LD](https://json-ld.org/).

### Documentation

The documentation for the routes and the expected request / response objects can be found
in html format at route /docs

To get the raw json documentation, use the /swagger.json route

### Activity types

The server can handle the following activity types.

#### Create Publication

To upload a publication, use an activity with type `Create` and object type
`reader:Publication`. The publication should include all of its `Document`
members by value, with their full content.

#### Read Document

To note that a user has read a document, use an activity with type `Read` and
object type `Document`.

## Administration

### Configuration variables

The server uses environment variables for configuration.

* `AUDIENCE`: The expected audience for [JWT](https://jwt.io) tokens.
* `DEPLOY_STAGE`: Deployment stage. One of `production`, `staging`, or `development`.
* `DEV_PASSWORD`: A basic auth password used when in development or staging.
  Username is `admin`.
* `DOMAIN`: Domain name of the server. If the server is hit with HTTP, redirects
  to https: plus this domain.
* `ISSUER`: Expected issuer for JWT tokens.
* `NODE_ENV`: Environment variable used by [express](https://expressjs.com/).
  Can be `production` or `development`.
* `SECRETORKEY`: Expected shared secret for [JWT](https://jwt.io) tokens.
* `POSTGRE_INSTANCE`: the db server. Set it to 'localhost' for a local dev. If this
  variable is not set, the models will be stored in a SQLite database.
* `POSTGRE_DB`: the name of the database.
* `POSTGRE_USER`: the user name to use for the connection
* `POSTGRE_PASSWORD`: the password
* `SQLITE_DB`: filename of the SQLite database to store data if `POSTGRE_INSTANCE` is
  not set. Defaults to "./dev.sqlite3".

The environment variables can be set in a .env file

## Contributing

IMPORTANT: this project is still in the very early stages and is not yet ready for unsolicited contributions.
If you are interested in the project, please contact the development team.

### Commit Message Style

`prefix: message`

Where prefix can be any of: build, ci, chore, docs, feat, fix, perf, refactor, revert, style, test.

The other rules are as
[described here](https://github.com/marionebl/commitlint/tree/master/@commitlint/config-conventional)

### JS style

Code should be written in the [Standard]() style and even if it isn't,
`prettier-standard` is run on commit to convert the code into Standard style.

(I don't particularly prefer Standard style over any other variety, but we need
a coding style and that one's as good as any other and comes with a bunch of
ready-made tools.)
