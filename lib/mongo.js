var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var configs = require('../config/config.js');
 
var db_name = configs.baeMongo;//'kZMdxMfzxRtbSxJzPiQK';                  // 数据库名，从云平台获取
var db_host =  'mongo.duapp.com';      // 数据库地址
var db_port =  '8908';   // 数据库端口
var username = configs.apiKey;//'gyFG80njksqzyzwyiDxc3Irv';                 // 用户名
var password = configs.secretKey;//'do6Blf9QzzYpTBsjKX5K1RNqb5odcefG';                 // 密码

var db = new Db(db_name, new Server(db_host, db_port, {}), {w: 1});

function testMongo(req, res) {
  function test(err, collection) {
    collection.insert({a: 1}, function(err, docs) {
      if (err) {
        console.log(err);
        res.end('insert error');
        return;
      }
      collection.count(function(err, count) {
        if (err) {
          console.log(err);
          res.end('count error');
          return;
        } 
        res.end('count: ' + count + '\n');
        db.close(); 
      });
    });  
  }
 
  db.open(function(err, db) {
    db.authenticate(username, password, function(err, result) { 
      if (err) {
        db.close();
        res.end('Authenticate failed!');
        return;   
      }
      db.collection('test_insert', test); 
    });  
  });
}

module.exports = testMongo;