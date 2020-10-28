
exports.up = function(knex) {
  return knex.schema.table('Note', function(table) {
    table.timestamp('emptied')
  })
};

exports.down = function(knex) {
  return knex.schema.table('Note', function(table) {
    table.dropColumn('emptied')
  })
};
