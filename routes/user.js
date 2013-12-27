/*
 * user.
 */
var testImage = require('../lib/image');
var util = require('util');
var utils = require('../lib/utils.js');
var crypto = require('crypto');
var User = require('../models/user');
var Act = require('../models/act');
var Category = require('../models/category');
var Register = require('../models/register');
var fs = require('fs');
var async = require('async');

exports.userdel = function(req,res){
    if(req.params.uid){
        User.instance.findByIdAndRemove(req.params.uid,function(err,user){
           if(err){
            req.flash('error','删除失败！');
            res.redirect('/user/list');
           }else{
            req.flash('success','删除成功！');
            res.redirect('/user/list');
           } 
        }); 
    } 
};

exports.userinfo = function(req,res){
    var method = req.method.toLowerCase();
    if(method == 'get'){
        res.render('user/userinfo',{
            title:'个人资料'
        });
    }else{
        var email = req.body.email.trim(),
            mobile = req.body.mobile.trim();
        User.instance.update({_id:req.body.uid},{$set:{email:email,mobile:mobile}},function(err,user){
            if(user){
                req.flash('success','修改成功！');
                req.session.user.email = email;
                req.session.user.mobile = mobile;
            }else{
                req.flash('error','修改失败！');
            }
            res.redirect('/userinfo');
        });
    }
};

exports.password = function(req,res){
    var method = req.method.toLowerCase();
    if(method == 'get'){
        res.render('user/password',{
            title:'修改密码'
        });
    }else{
        var oldPassword = req.body.oldPassword.trim();
        var newPassword = req.body.newPassword.trim();
        var repeatPassword = req.body.repeatPassword.trim();
        if(!oldPassword || !newPassword || !repeatPassword){
            req.flash('error','密码不能空！');
            res.redirect('/password');
            return;
        }
        if(newPassword != repeatPassword){
            req.flash('error','两次新密码不一致！');
            res.redirect('/password');
            return;
        }
        var md5 = crypto.createHash('md5');
        oldPassword = md5.update(oldPassword).digest('hex');
        User.instance.findOne({_id:req.body.uid,password:oldPassword},function(err,user){
            if(user){
                md5 = crypto.createHash('md5');
                newPassword = md5.update(newPassword).digest('hex');
                User.instance.update({_id:req.body.uid},{$set:{password:newPassword,update_time:(new Date())}},function(err,user){
                    if(user){
                        req.flash('success','修改成功！');
                    }else{
                        req.flash('error','修改失败！');
                    }
                    res.redirect('/password');
                });
            }else{
                req.flash('error','原密码错误！');
                res.redirect('/password');
            }
        });
    }
};

exports.head = function(req,res){
    var method = req.method.toLowerCase();
    if(method == 'get'){
        res.render('user/head',{
            title:'修改头像'
        });
    }else{
        //res.end(util.inspect(req.body));
        User.instance.update({_id:req.body.uid},{$set:{head_pic:req.body.head_pic}},function(err,user){
            if(user){
                req.flash('success','修改成功！');
                req.session.user.head_pic = req.body.head_pic;
            }else{
                req.flash('error','修改失败！');
            }
            res.redirect('/head');
        });
    }
};

exports.index = function(req,res){
    var userId = '';
    User.get(req.params.name,function(err,user){
        userId = user._id;
        console.log(user._id);
        
    });
    User.instance.findOne({username:req.params.name},function(err,user){
        console.log(user.username + " " + utils.format_date(user.create_time));
    });
    
    res.send('Hello ' + req.params.name + ',user index...');
};

exports.social_login = function(req,res){
    var username = req.body.name;
    var social_id = req.body.social_id;
    var token = req.body.token;
    var media_type = req.body.media_type;
    var ret_data = {};
    if(!username || !token){
        req.flash('error','登录失败！');
        ret_data.code = 1;
        ret_data.msg = '登录失败！' + username;
        res.json(ret_data);
        return;
    }
    var md5 = crypto.createHash('md5'),
        password = md5.update('123456').digest('hex');
    var newUser = new User({
        username: social_id + '@' + media_type,
        password: password,
        email: social_id + '@baidu-social.com',
        token: token
    });
    //检查用户名是否已经存在 
    User.get(newUser.username, function(err, user){
          if(user){
            req.flash('success','同步登录成功！');
            req.session.user = user;
            ret_data.code = 0;
            ret_data.msg = '同步登录成功！';
            res.json(ret_data);
            return;
          }
          if(err){
            req.flash('error','登录失败！');
            ret_data.code = 1;
            ret_data.msg = '登录失败！';
            res.json(ret_data);
            return;
          }
          //如果不存在则新增用户
          newUser.save(function(err,user){
            if(err){
              req.flash('error','同步注册失败！');
              ret_data.code = 1;
              ret_data.msg = '同步注册失败！';
              res.json(ret_data);
              return;
            }
            req.session.user = user;//用户信息存入 session
            req.flash('success','同步登录成功！');
            ret_data.code = 0;
            ret_data.msg = '同步登录成功！';
            res.json(ret_data);
            return;
          });
    });
};

exports.login = function(req,res){
    var method = req.method.toLowerCase();
    if(method == 'get'){
        res.render('user/login',{
            title:'login...'
        });
    }else{
        var username = req.body.username.trim();
        var password = req.body.password.trim();
        if(!username || !password){
            //console.log('用户名、密码不能为空');
            req.flash('error','用户名、密码不能为空！');
            res.redirect('/login');
            return;
        }
        var md5 = crypto.createHash('md5');
        password = md5.update(password).digest('hex');
        //req.session.verifycode  = req.body.verifycode.trim();
        var option = {
            len: 4,
            pattern: 2
        };
        testImage.imageService.generateVCode(option,function(err,result){
            if (err) {
              req.flash('error','验证码不正确！');
              res.redirect('/login');
              return;
            }
            var len = req.body.verifycode.length;
            if(len < 4 || len > 4){
                req.flash('error','验证码不正确！');
                res.redirect('/login');
                return;
            }
            var option2 = {
                input: req.body.verifycode.trim(),
                secret: req.session.vcode_str
            };
            testImage.imageService.verifyVCode(option2,function(err,result2){
                if(err){
                    req.flash('error','验证码不正确！');
                    res.redirect('/login');
                    return;
                }else{
                    User.instance.findOne({username:username,password:password},function(err,user){
                       if(!user){
                        req.flash("error",'用户名或密码错误！');
                        res.redirect('/login');
                         return;
                       }
                       req.session.user = user;
                       req.flash('success','登录成功!');
                       res.redirect('/');
                    });
                }
            });
        });
        
    }
};

exports.register = function(req,res){
        var username = req.body.username.trim(),
            password = req.body.password.trim(),
            password_re = req.body['password-repeat'].trim(),
            email = req.body.email.trim();
        if(!username || !password){
            console.log('用户名、密码不能为空');
            req.flash('error','用户名、密码不能为空！');
            res.redirect('/register');
            return;
        }
        //检验用户两次输入的密码是否一致
        if(password_re != password){
          req.flash('error','两次输入的密码不一致!'); 
          return res.redirect('/register');
        }
        //生成密码的散列值
        var md5 = crypto.createHash('md5'),
            password = md5.update(password).digest('hex');
        var newUser = new User({
            username: username,
            password: password,
            email: email
        });
        //检查用户名是否已经存在 
        User.get(newUser.username, function(err, user){
          if(user){
            err = '用户已存在! ';
          }
          if(err){
            req.flash('error', err);
            return res.redirect('/login');
          }
          //如果不存在则新增用户
          newUser.save(function(err,user){
            if(err){
              req.flash('error','注册失败！');
              return res.redirect('/login');
            }
            req.session.user = user;//用户信息存入 session
            req.flash('success','注册成功!');
            res.redirect('/');
          });
        });
        //res.end('end...' + password);
};

exports.logout = function(req,res){
    req.session.user = null;
    req.flash('success','退出成功!');
    res.redirect('/');
};

exports.list = function(req,res){
    var page = req.query.page;
    if(!page) page = 1;
    /*async.waterfall([
        function(callback){
            callback(null, page, 'two');
        },
        function(arg1, arg2, callback){
            console.log('arg1 => ' + arg1);
            console.log('arg2 => ' + arg2);
            callback(null, 'three');
        },
        function(arg3, callback){
            console.log('arg3 => ' + arg3);
            callback(null, 'done');
        }
    ], function (err, result) {
       console.log('err => ' + err);
       console.log('result => ' + result);
    });*/
    page = parseInt(page);
    var pageSize = 10;
    var where = {};
    var opt = {skip: (page - 1) * pageSize, limit: pageSize, sort: {'create_time': -1}};
    async.waterfall([
        function(callback){
            User.instance.count(where,function(err,cnt){
                callback(err, cnt);
            });
        },
        function(cnt, callback){
            User.instance.find(where,{},opt,function(err,users){
                /*newUsers = [];
                users.forEach(function(doc){
                    var user = {
                        _id : doc._id,
                        username : doc.username,
                        email : doc.email,
                        mobile : doc.mobile,
                        create_time : utils.format_date(doc.create_time)
                    };
                    newUsers.push(user);
                });*/
                
                for(var i in users){
                    users[i].show_time = utils.format_date(users[i].create_time);
                }
                callback(err,cnt, users);
            });
        }
    ], function (err,cnt, users) {
       var totalPage = Math.ceil(cnt / pageSize);
       var pages = utils.pagination(page,totalPage);
       res.render('user/list',{
        title:'用户列表',
        nav_manage:true,
        pages:pages,
        users:users
       });
    });
    //User.instance.find({},{},function(err,users){
    //    res.render('user/list',{title:'用户列表',nav_manage:true});
    //});
};

exports.myact = function(req,res){
    var page = req.query.page;
    if(!page) page = 1;
    page = parseInt(page);
    var pageSize = 10;
    var where = {username:req.session.user.username};
    var opt = {skip: (page - 1) * pageSize, limit: pageSize, sort: {'create_time': -1}};
    async.waterfall([
        function(callback){
            Register.instance.count(where,function(err,cnt){
                callback(err, cnt);
            });
        },
        function(cnt, callback){
            Register.instance.find(where,{},opt,function(err,cates){
                for(var i in cates){
                    cates[i].show_time = utils.format_date(cates[i].create_time);
                }
                callback(err,cnt, cates);
            });
        }
    ], function (err,cnt, cates) {
       var totalPage = Math.ceil(cnt / pageSize);
       var pages = totalPage ? utils.pagination(page,totalPage) : '';
       res.render('user/myact',{
        title:'我参与的',
        nav_myact:true,
        pages:pages,
        cates:cates
       });
    });
    //res.render('user/myact',{title:'我参与的',nav_myact:true});
};

exports.doact = function(req,res){
    var page = req.query.page;
    if(!page) page = 1;
    page = parseInt(page);
    var pageSize = 10;
    var where = {
        username:req.session.user.username
    };
    var opt = {skip: (page - 1) * pageSize, limit: pageSize, sort: {'create_time': -1}};
    async.waterfall([
        function(callback){
            Act.instance.count(where,function(err,cnt){
                callback(err, cnt);
            });
        },
        function(cnt, callback){
            Act.instance.find(where,{},opt,function(err,acts){
                for(var i in acts){
                    acts[i].show_time = utils.format_date(acts[i].create_time);
                }
                callback(err,cnt, acts);
            });
        }
    ], function (err,cnt, acts) {
       var totalPage = Math.ceil(cnt / pageSize);
       var pages = totalPage ? utils.pagination(page,totalPage) : '';
       res.render('user/doact',{
        title:'我发起的',
        nav_myact:true,
        pages:pages,
        acts:acts
       });
    });
};

exports.addact = function(req,res){
    var method = req.method.toLowerCase();
    if(method == 'get'){
        var actInfo = {};
        Category.instance.find({state:0},{},{sort:{create_time:1}},function(err,cates){
            if(req.query.id){
                //检查用户名是否已经存在 
                Act.instance.findById(req.query.id, function(err, actInfo){
                  res.render('user/addact',{
                    title:'修改活动',
                    nav_myact:true,
                    actInfo:actInfo,
                    cates:cates
                  });
                });
            }else{
                res.render('user/addact',{
                    title:'发起活动',
                    nav_myact:true,
                    actInfo:actInfo,
                    cates:cates
                });
            }
        });
    }else{
        if(req.body.id){
            //res.end(util.inspect(req.body));
            var actInfo = {
                title:req.body.title.trim(),
                cate_title:req.body.cate_title,
                act_time:utils.format_date(new Date(req.body.act_time)),
                end_time:utils.format_date(new Date(req.body.end_time)),
                address:req.body.address.trim(),
                act_man:parseInt(req.body.act_man),
                act_pic:req.body.act_pic,
                act_slide:req.body.act_slide,
                description:req.body.description,
                content:req.body.editorValue,
                state:parseInt(req.body.state),
                update_time:new Date()
            };
            //更新 
            Act.instance.findOneAndUpdate({_id:req.body.id},actInfo, function(err, act){
              if(err){
                req.flash('error', '修改失败！');
                return res.redirect('/user/addact?id='+req.body.id);
              }
              req.flash('success','修改成功!');
              res.redirect('/user/doact');
            });
        }else{
            //res.end(util.inspect(req.body));
            if(!req.body.act_man) {
                req.body.act_man = 0;
            }
            var newAct = new Act({
                title:req.body.title.trim(),
                cate_title:req.body.cate_title,
                act_time:utils.format_date(new Date(req.body.act_time)),
                end_time:utils.format_date(new Date(req.body.end_time)),
                address:req.body.address.trim(),
                act_man:parseInt(req.body.act_man),
                act_pic:req.body.act_pic,
                act_slide:req.body.act_slide,
                description:req.body.description,
                content:req.body.editorValue,
                state:parseInt(req.body.state),
                is_rcmomend:0,
                username:req.session.user.username
            });
            //新增
            newAct.save(function(err,act){
                if(err){
                  req.flash('error','发起失败！');
                  return res.redirect('/user/addact');
                }
                req.flash('success','发起成功！');
                res.redirect('/user/doact');
            });
        }
    }
};

exports.actmember = function(req,res){
    var page = req.query.page;
    if(!page) page = 1;
    page = parseInt(page);
    var pageSize = 10;
    var where = {};
    var queryUrl = '';
    if(req.query.id){
        where.act_id = req.query.id;
        queryUrl = '/user/actmember?id=' + req.query.id;
    }
    var opt = {skip: (page - 1) * pageSize, limit: pageSize, sort: {'create_time': -1}};
    async.waterfall([
        function(callback){
            Register.instance.count(where,function(err,cnt){
                callback(err, cnt);
            });
        },
        function(cnt, callback){
            Register.instance.find(where,{},opt,function(err,cates){
                for(var i in cates){
                    cates[i].show_time = utils.format_date(cates[i].create_time);
                }
                callback(err,cnt, cates);
            });
        }
    ], function (err,cnt, cates) {
       var totalPage = Math.ceil(cnt / pageSize);
       var pages = totalPage ? utils.pagination(page,totalPage,queryUrl) : '';
       res.render('user/actmember',{
        title:'已报名成员',
        nav_myact:true,
        pages:pages,
        cates:cates
       });
    });
};