exports.up = function (knex, Promise) {
  return knex.schema.createTable('Attribution', function (table) {
    table.uuid('id').primary()
    table.string('role').notNullable().index()
    table
      .boolean('isContributor')
      .defaultTo(false)
    table.string('name').notNullable().index() // index this or only normalized name?
    table.string('normalizedName').notNullable().index()
    table.string('type').defaultTo('Person')
    table
      .uuid('readerId')
      .references('id')
      .inTable('Reader')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table
      .uuid('publicationId')
      .references('id')
      .inTable('Publication')
      .nullable()
      .onDelete('CASCADE')
      .index()
    table
      .timestamp('published')
      .defaultTo(knex.fn.now())
      .notNullable()
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('Attribution')
}
