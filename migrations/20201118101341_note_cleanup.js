

exports.up = function(knex) {
  return knex.schema.table('Note', function(table) {
    table.dropColumn('emptied')
    table.dropColumn('parentId')
    table.dropColumn('previous')
    table.dropColumn('next')
  })
};

exports.down = function(knex) {
  return knex.schema.table('Note', function(table) {
    table.timestamp('emptied')
    table.string('previous')
      .references('id')
      .inTable('Note')
      .onDelete('SET NULL')
    table.string('next')
      .references('id')
      .inTable('Note')
      .onDelete('SET NULL')
    table.string('parentId')
      .references('id')
      .inTable('Note')
      .onDelete('SET NULL')
  })
};
