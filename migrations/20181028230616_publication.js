exports.up = function (knex, Promise) {
  return knex.schema.createTable('Publication', function (table) {
    table.uuid('id').primary()
    table.string('canonicalId').index()
    table.text('description')
    table.jsonb('json')
    table
      .uuid('readerId')
      .references('id')
      .inTable('Reader')
      .notNullable()
      .onDelete('CASCADE')
      .index()
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

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('Publication')
}
