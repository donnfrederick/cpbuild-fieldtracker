'use strict';

var dbm;
var type;
var seed;
var fs = require('fs');
var path = require('path');
var Promise;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 *
 * Migration: Add markup_data column to image_uploads for JSON overlay (annotations).
 * Nullable NVARCHAR(MAX), no backfill. Idempotent. No breaking changes to IHI Tools.
 */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
  Promise = options.Promise;
};

exports.up = function(db) {
  var filePath = path.join(__dirname, 'sqls', '20260211130000-add-markup-data-to-image-uploads-table-up.sql');
  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, { encoding: 'utf-8' }, function(err, data) {
      if (err) return reject(err);
      console.log('received data: ' + data);
      resolve(data);
    });
  }).then(function(data) {
    return db.runSql(data);
  });
};

exports.down = function(db) {
  var filePath = path.join(__dirname, 'sqls', '20260211130000-add-markup-data-to-image-uploads-table-down.sql');
  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, { encoding: 'utf-8' }, function(err, data) {
      if (err) return reject(err);
      console.log('received data: ' + data);
      resolve(data);
    });
  }).then(function(data) {
    return db.runSql(data);
  });
};

exports._meta = {
  version: 1
};
