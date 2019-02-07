
exports.up = function(knex, Promise) {
  return knex.schema.createTable('publications_tags', function(table){
    table
      .uuid('publicationId')
      .notNullable()
      .references('id')
      .inTable('Publication')
      .onDelete('CASCADE')
      .index()
    table.integer('tagId').references('id').inTable('Tag').notNullable().onDelete('CASCADE').index();
    table.primary(['publicationId', 'tagId']).unique()

  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('publications_tags')
};
