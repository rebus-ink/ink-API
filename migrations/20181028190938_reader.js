exports.up = function (knex, Promise) {
  if (!knex.schema.hasTable('Reader')) {
    return knex.schema.createTable('Reader', function (table) {
      table.uuid('id').primary()
      table.jsonb('json')
      table.string('userId').index()
      table
        .timestamp('published')
        .defaultTo(knex.fn.now())
        .notNullable()
      table
        .timestamp('updated')
        .defaultTo(knex.fn.now())
        .notNullable()
    })
  }
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('Reader')
}
