// Update with your config settings.

const path = require('path')
module.exports = {
  postgresql: {
    client: 'postgresql',
    connection: {
      host: process.env.POSTGRE_INSTANCE,
      database: process.env.POSTGRE_DB,
      user: process.env.POSTGRE_USER,
      password: process.env.POSTGRE_PASSWORD
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: path.join(__dirname, 'migrations')
    }
  }
}
