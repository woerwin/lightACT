var BaeMemcache = require('../module/baev3-cache');
var configs = require('../config/config.js');
var cacheId = configs.baeCache;//'BsZWYTuPvTVavNkCXMZu';
var host = 'cache.duapp.com:20243';
var ak = configs.apiKey;//'gyFG80njksqzyzwyiDxc3Irv';
var sk = configs.secretKey;//'do6Blf9QzzYpTBsjKX5K1RNqb5odcefG';

function testCache(req, res) {
  var client = new BaeMemcache(cacheId, host, ak, sk);

  client.set('baidu', 'welcome to bae', function(err){
    if (err) {
      console.log(err);
      res.end('set error');
      return;
    }
    client.get('baidu', function(err, result) {
      if (err) {
        console.log(err);
        res.end('get error');
        return;
      }
      res.end('get value: ' + result);
    });
  });
}

module.exports = testCache;