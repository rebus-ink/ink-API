exports.up = function (knex, Promise) {
  return knex.schema.createTable('Publication', function (table) {
    table.uuid('id').primary().index()
    table.text('description')
    table.string('name').notNullable()
    table.timestamp('datePublished')
    table.jsonb('metadata')
    table.jsonb('readingOrder').notNullable()
    table.jsonb('resources').notNullable()
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
    table
      .timestamp('deleted')
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('Publication')
}
