var redis = require('redis');
var configs = require('../config/config.js');
 
var username = configs.apiKey;//'gyFG80njksqzyzwyiDxc3Irv';              // 用户名
var password = configs.secretKey;//'do6Blf9QzzYpTBsjKX5K1RNqb5odcefG';              // 密码
var db_host = 'redis.duapp.com';   
var db_port = 80;
var db_name = configs.baeRedis;//'TjZTtYzginmNwIZcMpZq';               // 数据库名，从云平台获取
console.log(db_host);
console.log(db_port);
var options = {"no_ready_check":true};

function testRedis(req, res) {
  var client = redis.createClient(db_port, db_host, options);
  client.on("error", function (err) {
    console.log("Error " + err);
  });
  
  // 建立连接后，在进行集合操作前，需要先进行auth验证
  
  client.auth(username + '-' + password + '-' + db_name);

  client.set('baidu', 'welcome to BAE');
  
  client.get('baidu', function(err, result) {
    if (err) {
      console.log(err);
      res.end('get error');
      return;
    }
    res.end('result: ' + result);      
  }); 
  
}


module.exports = testRedis;