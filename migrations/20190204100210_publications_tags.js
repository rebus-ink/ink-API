
exports.up = function(knex, Promise) {
  return knex.schema.createTable('publications_tags', function(table){
    table.increments('id')
    table
      .uuid('publicationId')
      .references('id')
      .inTable('Publication')
      .notNullable()
      .onDelete('CASCADE')
      .index()
    table.integer('tagId').references('id').inTable('Tag').notNullable().onDelete('CASCADE').index();
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('publications_tags')
};
