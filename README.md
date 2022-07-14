# Rebus Ink "Reader" API Server

The Rebus Ink "Reader" server is an API for research workflow to support researchers to
better manage and draw insights from their collected sources.


## Technology Stack

Key libraries:

* [Express](https://expressjs.com): a back-end web application framework for [Node.js](https://nodejs.org/).
* [Objecitve](https://github.com/Vincit/objection.js): an ORM.
* [Knex](https://knexjs.org): a SQL query builder.
* [Passport](https://www.passportjs.org): authentication with JSON web tokens.
* [Flow](https://flow.org): static type checker.

Key third-party services:

* [Google Cloud Platform](https://cloud.google.com): deployment and services including
  [Cloud Storage](https://cloud.google.com/storage) and [Cloud SQL - PostgreSQL](https://cloud.google.com/sql).
* [Redis Labs](https://redis.com): in-memory data structure store and cache.

For more details, see the [Overview Guide](./guides/overview.md).

## Development

See the front-end service [Development Guide](./guides/development.md) for instructions on setup and
testing.

### Documentation

The documentation for the routes is available at https://rebusfoundation.github.io/reader-api.

### Key Concepts
The documentation for key concepts in the API is available here ./guides/development.md

## Contributing

This project is still in the very early stages and is not yet ready for unsolicited contributions.
If you are interested in the project, please contact the development team.

## License

Rebus Ink "Reader" API Server is released under the GNU GENERAL PUBLIC LICENSE. Some third-party
components are included. They are subject to their own licenses. All of the license information can
be found in the included [LICENSE](./LICENSE) file.
