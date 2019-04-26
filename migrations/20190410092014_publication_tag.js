
exports.up = function(knex, Promise) {
  return knex.schema.createTable('publication_tag', function(table){
    table.increments('id')
    table
      .string('publicationId')
      .references('id')
      .inTable('Publication')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table.string('tagId').references('id').inTable('Tag').notNullable().onDelete('CASCADE').index();
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('publication_tag')
};
