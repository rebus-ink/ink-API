
exports.up = function(knex) {
  return knex.schema.table('Source', function(table) {
    table.jsonb('citation')
  })
};

exports.down = function(knex) {
  return knex.schema.table('Source', function(table) {
    table.dropColumn('citation')
  })
};
