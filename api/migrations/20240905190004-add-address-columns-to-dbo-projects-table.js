'use strict';

var dbm;
var type;
var seed;
var fs = require('fs');
var path = require('path');
var Promise;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
  Promise = options.Promise;
};

exports.up = function(db) {
  var filePath = path.join(__dirname, 'sqls', '20240905190004-add-address-columns-to-dbo-projects-table-up.sql');
  return new Promise( function( resolve, reject ) {
    fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
      if (err) return reject(err);
      console.log('received data: ' + data);

      resolve(data);
    });
  })
  .then(function(data) {
    return db.runSql(data);
  });
};

exports.down = function(db) {
  var filePath = path.join(__dirname, 'sqls', '20240905190004-add-address-columns-to-dbo-projects-table-down.sql');
  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data) {
      if (err) {
        console.error('Error reading file:', err);
        return reject(err);
      }
      console.log('received data for down migration: ' + data);

      resolve(data);
    });
  })
  .then(function(data) {
    return db.runSql(data);
  })
  .catch(function(err) {
    console.error('Error running down migration:', err);
    throw err;
  });
};


exports._meta = {
  "version": 1
};
