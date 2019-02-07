
exports.up = function(knex, Promise) {
  return knex.schema.createTable('publications_tags', function(table){
    table.primary(['publicationId', 'tagId'])
    table
      .uuid('publicationId')
      .references('id')
      .inTable('Publication')
      .onDelete('CASCADE')
      .index()
    table.integer('tagId').references('id').inTable('Tag').onDelete('CASCADE').index();
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('publications_tags')
};
