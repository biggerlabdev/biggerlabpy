var MongoClient = require( 'mongodb' ).MongoClient;

var _db;

module.exports = {

  connectToServer: function( callback ) {
    MongoClient.connect( "mongodb://biggerlab:56G-h7G-WEa-pCS@ds111178.mlab.com:11178/heroku_v9z3shn0", function( err, db ) {
      _db = db;
      return callback( err );
    } );
  },

  getDb: function() {
    return _db;
  }
};