# Development Guide

## Prerequisites

* [Node.js](https://nodejs.org/) :version specified by `engines.node` in `package.json`

## Setup

To setup the API server for local development, clone this repository and configure the follow
files in the root of the application (source these from a team member):

1. Google Service Account Key: `keyfile.json`
2. Environment Variables: `.env`. Update `GOOGLE_APPLICATION_CREDENTIALS` to point to the correct path.

Install the Node modules:

    $ npm install

## Running the Server

Run the server:

    $ npm start

To start the dev-server (which uses `nodemon` to automatically restart):

    $ npm run dev-server

## Testing

To run:

    $ npm run test

Individual test suites:

|            Type            |          Command           |                                                                                                                 Notes                                                                                                                 |
| -------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit tests                 | `npm run test-unit`        |                                                                                                                                                                                                                                       |
| Database model tests       | `npm run test-models`      |                                                                                                                                                                                                                                       |
| Integration (routes) tests | `npm run test-integration` | You can also run more specific integration tests by doing: npm run test-integration --test={category}. Valid categories are 'library', 'note', 'source', 'reader', 'readerNotes', 'notebook', 'noteContext', 'noteRelation' and 'tag' |

## Listing

To run eslint (only select rules are applied) and check flow types:

    $ npm run lint

## JS style

Code should be written in the [Standard]() style and even if it isn't, `prettier-standard` is run on
commit to convert the code into Standard style.

## Configuration variables

The server uses environment variables for configuration. The environment variables can be set in a
.env file

| Var                | Description                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `AUDIENCE`         | the expected audience for [JWT](https://jwt.io) tokens.                                                                            |
| `DEPLOY_STAGE`     | deployment stage. One of `production`, `staging`, or `development`.                                                                |
| `DEV_PASSWORD`     | a basic auth password used when in development or staging. Username is `admin`.                                                    |
| `DOMAIN`           | domain name of the server. If the server is hit with HTTP, redirects to https: plus this domain.                                   |
| `ISSUER`           | expected issuer for JWT tokens.                                                                                                    |
| `NODE_ENV`         | environment variable used by [express](https://expressjs.com/). Can be `production` or `development`.                              |
| `SECRETORKEY`      | expected shared secret for [JWT](https://jwt.io) tokens.                                                                           |
| `POSTGRE_INSTANCE` | the db server. Set it to 'localhost' for a local dev. If this variable is not set, the models will be stored in a SQLite database. |
| `POSTGRE_DB`       | the name of the database.                                                                                                          |
| `POSTGRE_USER`     | the user name to use for the connection                                                                                            |
| `POSTGRE_PASSWORD` | the password                                                                                                                       |
| `SQLITE_DB`        | filename of the SQLite database to store data if `POSTGRE_INSTANCE` is not set. Defaults to `./dev.sqlite3`.                       |
