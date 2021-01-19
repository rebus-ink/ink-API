exports.up = function (knex, Promise) {
  return knex.schema.createTable('Collaborator', function (table) {
    table.string('id').primary()
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
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table.json('permission').notNullable()
    table.integer('status').notNullable()
    table
      .timestamp('published')
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updated')
      .defaultTo(knex.fn.now())
      .notNullable()
    table.timestamp('deleted')
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('Collaborator')
}
