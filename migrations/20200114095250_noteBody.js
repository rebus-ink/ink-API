exports.up = function (knex, Promise) {
  return knex.schema.createTable('NoteBody', function (table) {
    table.string('id').primary()
    table
      .string('noteId')
      .references('id')
      .inTable('Note')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table.string('content')
    table.string('language')
    table.string('motivation').notNullable()
    table
      .string('readerId')
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
  return knex.schema.dropTable('NoteBody')
}
