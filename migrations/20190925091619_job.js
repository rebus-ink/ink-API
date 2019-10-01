exports.up = function(knex, Promise) {
  return knex.schema.createTable('job', function(table){
    table.increments('id')
    table
      .string('publicationId')
    table
      .string('readerId')
      .references('id')
      .inTable('Reader')
      .notNullable()
      .onDelete('CASCADE')
      .index() 
    table.string('error')
    table.string('type')
    table
      .timestamp('published')
      .defaultTo(knex.fn.now())
    table
      .timestamp('finished')
    table
      .string('publicationUrl')
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('job')
};