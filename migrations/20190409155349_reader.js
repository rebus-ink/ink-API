
exports.up = function (knex, Promise) {
  return knex.schema.createTable('Reader', function (table) {
    table.string('id').primary()
    table.string('authId').index().notNullable()
    table.jsonb('profile')
    table.string('name')
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
    table.unique('authId')
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('Reader')
}
