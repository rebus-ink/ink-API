// Update with your config settings.
require('dotenv').config()

const path = require('path')

const connection = {
  connectionString: process.env.DATABASE_URL
}

if (process.env.DATABASE_CA_CERT) {
  connection.ssl = {
    rejectUnauthorized: true,
    ca: process.env.DATABASE_CA_CERT
  }
}

module.exports = {
  client: 'pg',
  connection: connection,
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: path.join(__dirname, 'migrations')
  }
}
