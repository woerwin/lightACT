var mongoose = require('./db');
var util = require('util');
var crypto = require('crypto');

var Schema = mongoose.Schema;
 
var userSchema = new Schema({
 	username : {type : String, index : true, unique : true},
 	password : {type : String},
 	email : {type : String, index : true},
    mobile : {type : String, index : true},
 	post_count : {type : Number, default : 0},
    reply_count : {type : Number, default : 0},
    head_pic : {type : String, default : '/images/defaul_head.png'},
    is_admin : {type : Number, default : 0},
    state : {type : Number, default : 0},
    create_time : {type : Date, default : Date.now},
    update_time : {type : Date, default : Date.now}
 }, {
    collection: 'users'
});
 
var userModel = mongoose.model('User', userSchema);

function User(user) {
	this.username = user.username;
	this.password = user.password;
    this.email = user.email;
    //this.head_pic = user.head_pic;
    //this.is_admin = user.is_admin;
    if(user.username == 'admin'){
        this.is_admin = 1;
    }else{
        this.is_admin = 0;
    }
};

module.exports = User;

User.instance = userModel;

User.prototype.save = function(callback) {
  var md5 = crypto.createHash('md5'),
      email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
      head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=96";
  var user = {
      username: this.username,
      password: this.password,
      email: this.email,
      is_admin: this.is_admin,
      head_pic: head
  };

  var newUser = new userModel(user);

  newUser.save(function (err, user) {
    if (err) {
      return callback(err);
    }
    callback(null, user);
  });
};

User.get = function(username, callback) {
  userModel.findOne({username: username}, function (err, user) {
    if (err) {
      return callback(err);
    }
    callback(null, user);
  });
};

/*
User.prototype.save = function save(callback) {
	// 存入 Mongodb 的文档 
    var user = {
		username: this.username,
		password: this.password,
        email: this.email,
        article_count: this.article_count,
        reply_count: this.reply_count,
        create_time: this.create_time,
        update_time: this.update_time,
        head_pic: '/images/defaul_head.png',
        is_admin: this.is_admin,
	};
	
	mongodb.open(function(err, db) {
		if (err) {
		  return callback(err);
		}

		//获取users集合
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			//为username属性添加索引
			collection.ensureIndex('username', {unique: true});

			//写入 user 文档 
			collection.insert(user, {safe: true}, function(err, user) {
				mongodb.close();
				callback(err, user);
			});
		});
	});
};

User.get = function get(username, callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
        // 读取 users 集合 
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			
			// 查找 name 属性为 username 的文档
			collection.findOne({username: username}, function(err, doc) {
				mongodb.close();
				if (doc) {
				    // 封装文档为 User 对象 
					var user = new User(doc);
                    user._id = doc._id.toHexString();
					callback(err, user);
				} else {
					callback(err, null);
				}
			});
		});
	});
};

User.getById = function(id, callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
        // 读取 users 集合 
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			
			// 查找 _id 为 id  的文档
            var ObjectID = require('mongodb').ObjectID;
			collection.findOne({_id: new ObjectID(id)}, function(err, doc) {
				mongodb.close();
				if (doc) {
					var user = doc;
                    user._id = doc._id.toHexString();
					callback(err, user);
				} else {
					callback(err, null);
				}
			});
		});
	});
};

User.getAll = function(query,req,callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}

			if (!query) {
				query = {};
			}
            
            var limit = 10;
            var current_page = parseInt(req.query.page, 10) || 1;
            collection.count(query,function(err,count){
                var pages = Math.ceil(count / limit);
                collection.find(query, {skip: (current_page - 1) * limit,limit:limit}).sort({create_time: -1}).toArray(function(err, docs) {
    				mongodb.close();
    
    				if (err) {
    					callback(err, null);
    				}
    				var usrs = [];
    				docs.forEach(function(doc, index) {
    				    var user = {
                            _id: doc._id.toHexString(),
                            username:doc.username,
                            email:doc.email,
                            article_count: doc.article_count,
                    	    create_time: Util.format_date(doc.create_time),
                            update_time: Util.format_date(doc.update_time),
                        };
    					usrs.push(user);
    				});
    
    				callback(null, usrs,current_page,pages);
    			});
            });
            
		});
	});
};

User.update = function(username,user, callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
        // 读取 users 集合 
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
            collection.update({username: username},{$set:user}, function(err) {
				mongodb.close();
				callback(err);
			});
		});
	});
};

User.del = function(uid, callback) {
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		} 
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			
			// 查找 _id 为 id  的文档
            var ObjectID = require('mongodb').ObjectID;
            collection.remove({_id: new ObjectID(uid)}, function(err) {
				mongodb.close();
				callback(err);
			});
		});
	});
};
*/