exports.up = function (knex, Promise) {
  return knex.schema.createTable('Tag', function (table) {
    table.string('id').primary()
    table.string('type').index() // do we allow null? or have a default?
    table.string('name').notNullable()
    table.jsonb('json')
    table
      .string('readerId')
      .references('id')
      .inTable('Reader')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table
      .string('notebookId')
      .references('id')
      .inTable('Notebook')
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
    table.unique(['readerId', 'name', 'type'])
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('Tag')
}