
exports.up = function (knex, Promise) {
  return knex.schema.createTable('Reader', function (table) {
    table.uuid('id').primary().index()
    table.string('authId').index().notNullable()
    table.jsonb('profile')
    table.jsonb('preferences')
    table.jsonb('json')
    table
      .timestamp('published')
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updated')
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('deleted')
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('Reader')
}
