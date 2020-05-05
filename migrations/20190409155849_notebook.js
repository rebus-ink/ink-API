exports.up = function (knex, Promise) {
  return knex.schema.createTable('Notebook', function (table) {
    table.string('id').primary()
    table.text('description')
    table.string('name').notNullable()
    table.integer('status')
    table.jsonb('settings')
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
  return knex.schema.dropTable('Notebook')
}
