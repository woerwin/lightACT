var Xss = require('xss');
var Crypto = require('crypto');

//加密
exports.encrypt = function(str, secret) {
    var cipher = Crypto.createCipher('aes192', secret);
    var enc = cipher.update(str, 'utf8', 'hex');
    enc += cipher.final('hex');
    return enc;
}
//解密
exports.decrypt = function(str, secret) {
    var decipher = Crypto.createDecipher('aes192', secret);
    var dec = decipher.update(str, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}

//md5
exports.md5 = function(str) {
  var md5sum = Crypto.createHash('md5');
  md5sum.update(str);
  str = md5sum.digest('hex');
  return str;
}

//MD5
exports.MD5 = function(str) {
  var md5sum = Crypto.createHash('md5');
  str = md5sum.update(str).digest('base64');
  return str;
}

exports.format_date = function (date) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var hour = date.getHours();
  var minute = date.getMinutes();
  var second = date.getSeconds();
  
  //month = ((month < 10) ? '0' : '') + month;
  //day = ((day < 10) ? '0' : '') + day;
  hour = ((hour < 10) ? '0' : '') + hour;
  minute = ((minute < 10) ? '0' : '') + minute;
  second = ((second < 10) ? '0': '') + second;
  
  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
};

exports.xss = function (html) {
  return Xss(html);
};

// function to encode file data to base64 encoded string
exports.base64_encode = function(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
};

// function to create file from base64 encoded string
exports.base64_decode = function(base64str, file) {
    var bitmap = new Buffer(base64str, 'base64');
    // write buffer to file
    fs.writeFileSync(file, bitmap);
};

//pagination
exports.pagination = function(currentPage,totalPage,url,theme,offset){
    var pages = '';
    url = url ? (url + '&page=') : '?page=';
    offset = offset ? parseInt(offset) : 2;
    if(theme == 'a'){
        
    }else{
        pages += '<li><a href="'+url+'1">«</a></li>';
        var startPage = (currentPage - offset) <= 0 ? 1 : (currentPage - offset);
        for(var i = startPage; i < currentPage;i++){
            pages += '<li><a href="'+url+i+'">'+i+'</a></li>';
        }
        pages += '<li class="active"><a href="'+url+currentPage+'">'+currentPage+'</a></li>';
        var lastPage  = (currentPage + offset) >= totalPage ? totalPage : (currentPage + offset);
        for(var i = currentPage + 1; i <= lastPage;i++){
            pages += '<li><a href="'+url+i+'">'+i+'</a></li>';
        }
        pages += '<li><a href="'+url+totalPage+'">»</a></li>';
    }
    return pages;
};