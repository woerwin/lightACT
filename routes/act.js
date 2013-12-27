/*
 * user.
 */
var util = require('util');
var utils = require('../lib/utils.js');
var User = require('../models/user');
var Act = require('../models/act');
var Category = require('../models/category');
var Register = require('../models/register');
var async = require('async');

exports.acts = function(req,res){
    var page = req.query.page;
        var cate_title = req.query.cname;
        if(!page) page = 1;
        page = parseInt(page);
        var pageSize = 10;
        var where = {state:0};
        if(cate_title){
            where.cate_title = cate_title;
        }
        var opt = {skip: (page - 1) * pageSize, limit: pageSize, sort: {'create_time': -1}};
        var cates = {};
        async.waterfall([
            function(callback){
                Category.instance.find({state:0},{},{sort:{create_time:1}},function(err,sorts){
                    cates = sorts;
                    callback(err);
                });
            },
            function(callback){
                Act.instance.count(where,function(err,cnt){
                    callback(err, cnt);
                });
            },
            function(cnt, callback){
                Act.instance.find(where,{},opt,function(err,acts){
                    var currDate = new Date();
                    for(var i in acts){
                        acts[i].show_time = utils.format_date(acts[i].create_time);
                        acts[i].do_state = new Date(acts[i].act_time) > currDate ? 1 : 0;
                    }
                    callback(err,cnt, acts);
                });
            }
        ], function (err,cnt, acts) {
           var totalPage = Math.ceil(cnt / pageSize);
           var cateStr = '';
           if(cate_title){
                var pages = totalPage ? utils.pagination(page,totalPage,'/acts?cname='+cate_title) : '';
                cateStr = '<li><a href="/acts">全部</a>';
           }else{
                var pages = totalPage ? utils.pagination(page,totalPage) : '';
                cateStr = '<li class="active"><a href="/acts">全部</a>';
           }
           cates.forEach(function(doc){
                if(cate_title == doc.title){
                    cateStr += '<li class="active"><a href="/acts?cname='+doc.title+'">'+doc.title+'</a>';
                }else{
                    cateStr += '<li><a href="/acts?cname='+doc.title+'">'+doc.title+'</a>';
                }
           });
           
           res.render('acts',{
            title:'活动列表--轻活动·易享',
            nav_acts:true,
            pages:pages,
            cates:cates,
            cateStr: cateStr,
            acts:acts
           });
        });
};

exports.list = function(req,res){
    var page = req.query.page;
    if(!page) page = 1;
    page = parseInt(page);
    var pageSize = 10;
    var where = {};
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
       res.render('act/list',{
        title:'活动列表',
        nav_manage:true,
        pages:pages,
        acts:acts
       });
    });
    //res.render('act/list',{title:'活动列表',nav_manage:true});
};

exports.register = function(req,res){
    var method = req.method.toLowerCase();
    if(method == 'get'){
        var actInfo = {};
        Act.instance.find({state:0},{},{sort:{create_time:1}},function(err,cates){
            if(req.query.id){
                //检查用户名是否已经存在 
                Register.instance.findById(req.query.id, function(err, actInfo){
                  res.render('act/register',{
                    title:'修改报名用户',
                    nav_manage:true,
                    actInfo:actInfo,
                    cates:cates
                  });
                });
            }else{
                res.render('act/register',{
                    title:'添加报名用户',
                    nav_manage:true,
                    actInfo:actInfo,
                    cates:cates
                });
            }
        });
    }else{
        if(req.body.id){
            var title = req.body.act_title.trim().split(',');
            var regInfo = {
                act_title:title[1],
                act_id:title[0],
                email:req.body.email.trim(),
                address:req.body.address.trim(),
                mobile:req.body.mobile.trim(),
                state:parseInt(req.body.state),
                username:req.body.username,
                update_time:new Date()
            };
            //更新 
            Register.instance.findOneAndUpdate({_id:req.body.id},regInfo, function(err, act){
              if(err){
                req.flash('error', '修改失败！');
                return res.redirect('/act/register?id='+req.body.id);
              }
              req.flash('success','修改成功!');
              res.redirect('/act/join');
            });
        }else{
            var title = req.body.act_title.trim().split(',');
            var newReg = new Register({
                act_title:title[1],
                act_id:title[0],
                email:req.body.email.trim(),
                address:req.body.address.trim(),
                mobile:req.body.mobile.trim(),
                state:parseInt(req.body.state),
                username:req.body.username
            });
            //新增
            newReg.save(function(err,act){
                if(err){
                  req.flash('error','添加失败！');
                  return res.redirect('/act/register');
                }
                Act.instance.findOneAndUpdate({_id:newReg.act_id},{$inc:{act_reg:1}},function(err,act){
                    req.flash('success','添加成功！');
                    res.redirect('/act/join');
                });
                //req.flash('success','添加成功！');
                //res.redirect('/act/join');
            });
        }
    }
};

exports.join = function(req,res){
    var page = req.query.page;
    if(!page) page = 1;
    page = parseInt(page);
    var pageSize = 10;
    var where = {};
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
       res.render('act/join',{
        title:'报名管理',
        nav_manage:true,
        pages:pages,
        cates:cates
       });
    });
};

exports.registerdel = function(req,res){
    if(req.query.id){
        Register.instance.findByIdAndRemove(req.query.id,function(err,cate){
           if(err){
            req.flash('error','删除失败！');
            res.redirect('/act/join');
           }else{
            req.flash('success','删除成功！');
            res.redirect('/act/join');
           } 
        }); 
    }else{
        res.end('exit...');
    }
};

exports.catelist = function(req,res){
    var page = req.query.page;
    if(!page) page = 1;
    page = parseInt(page);
    var pageSize = 10;
    var where = {};
    var opt = {skip: (page - 1) * pageSize, limit: pageSize, sort: {'create_time': -1}};
    async.waterfall([
        function(callback){
            Category.instance.count(where,function(err,cnt){
                callback(err, cnt);
            });
        },
        function(cnt, callback){
            Category.instance.find(where,{},opt,function(err,cates){
                for(var i in cates){
                    cates[i].show_time = utils.format_date(cates[i].create_time);
                }
                callback(err,cnt, cates);
            });
        }
    ], function (err,cnt, cates) {
       var totalPage = Math.ceil(cnt / pageSize);
       var pages = totalPage ? utils.pagination(page,totalPage) : '';
       res.render('act/catelist',{
        title:'活动分类',
        nav_manage:true,
        pages:pages,
        cates:cates
       });
    });
};

exports.cateadd = function(req,res){
    var method = req.method.toLowerCase();
    if(method == 'get'){
        var cateInfo = {};
        if(req.query.cid){
            //检查用户名是否已经存在 
            Category.instance.findById(req.query.cid, function(err, cate){
              res.render('act/cateadd',{
                title:'添加分类',
                nav_manage:true,
                cateInfo:cate
              });
            });
        }else{
            res.render('act/cateadd',{
                title:'添加分类',
                nav_manage:true,
                cateInfo:cateInfo
            });
        }
    }else{
        if(req.body.cid){
            var cateInfo = {
                title:req.body.title,
                cate_pic:req.body.cate_pic,
                description:req.body.description,
                state:req.body.state
            };
            //更新 
            Category.instance.findOneAndUpdate({_id:req.body.cid},cateInfo, function(err, cate){
              if(err){
                req.flash('error', '修改失败！');
                return res.redirect('/act/cateadd?cid='+req.body.cid);
              }
              req.flash('success','修改成功!');
              res.redirect('/act/cate');
            });
        }else{
            //res.end(util.inspect(req.body));
            var newCate = new Category({
                title: req.body.title.trim(),
                cate_pic: req.body.cate_pic,
                description: req.body.description,
                state: req.body.state
            });
            //更新 
            Category.instance.findOne({title:newCate.title}, function(err, cate){
              if(cate){
                err = '分类已存在! ';
              }
              if(err){
                req.flash('error', err);
                return res.redirect('/act/cateadd');
              }
              //新增
              newCate.save(function(err,cate){
                if(err){
                  req.flash('error','添加失败！');
                  return res.redirect('/act/cateadd');
                }
                req.flash('success','添加成功！');
                res.redirect('/act/cate');
              });
            });
        }
    }
}

exports.catedel = function(req,res){
    if(req.query.cid){
        Category.instance.findByIdAndRemove(req.query.cid,function(err,cate){
           if(err){
            req.flash('error','删除失败！');
            res.redirect('/act/cate');
           }else{
            req.flash('success','删除成功！');
            res.redirect('/act/cate');
           } 
        }); 
    }else{
        res.end('exit...');
    }
};

exports.add = function(req,res){
    var method = req.method.toLowerCase();
    if(method == 'get'){
        var actInfo = {};
        Category.instance.find({state:0},{},{sort:{create_time:1}},function(err,cates){
            if(req.query.id){
                //检查用户名是否已经存在 
                Act.instance.findById(req.query.id, function(err, actInfo){
                  res.render('act/add',{
                    title:'修改活动',
                    nav_manage:true,
                    actInfo:actInfo,
                    cates:cates
                  });
                });
            }else{
                res.render('act/add',{
                    title:'添加活动',
                    nav_manage:true,
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
                is_recommend:parseInt(req.body.is_recommend),
                update_time:new Date()
            };
            //更新 
            Act.instance.findOneAndUpdate({_id:req.body.id},actInfo, function(err, act){
              if(err){
                req.flash('error', '修改失败！');
                return res.redirect('/act/add?id='+req.body.id);
              }
              req.flash('success','修改成功!');
              res.redirect('/act/list');
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
                is_recommend:parseInt(req.body.is_recommend),
                username:req.session.user.username
            });
            //新增
            newAct.save(function(err,act){
                if(err){
                  req.flash('error','添加失败！');
                  return res.redirect('/act/add');
                }
                req.flash('success','添加成功！');
                res.redirect('/act/list');
            });
        }
    }
};

exports.actdel = function(req,res){
    if(req.query.id){
        Act.instance.findByIdAndRemove(req.query.id,function(err,cate){
           if(err){
            req.flash('error','删除失败！');
            res.redirect('/act/list');
           }else{
            req.flash('success','删除成功！');
            res.redirect('/act/list');
           } 
        }); 
    }else{
        res.end('exit...');
    }
};

exports.show = function(req,res){
    Act.instance.findById(req.params.id,function(err,actInfo){
        Category.instance.find({},{},{sort:{create_time:1}},function(err,cates){
            res.render('act/show',{title:'活动详情',cates:cates,actInfo:actInfo});
        });
    });
};

exports.doregister = function(req,res){
    var method = req.method.toLowerCase();
    if(method == 'get'){
        var actInfo = {};
        Category.instance.find({state:0},{},{sort:{create_time:1}},function(err,cates){
                Act.instance.findById(req.params.id, function(err, actInfo){
                  res.render('act/doregister',{
                    title:'活动报名',
                    actInfo:actInfo,
                    cates:cates
                  });
                });
        });
    }else{
            var newReg = new Register({
                act_title:req.body.act_title,
                act_id:req.body.act_id,
                email:req.body.email.trim(),
                address:req.body.address.trim(),
                mobile:req.body.mobile.trim(),
                username:req.session.user.username
            });
            //新增
            newReg.save(function(err,act){
                if(err){
                  req.flash('error','报名失败！');
                  return res.redirect('/act/doregister/'+req.body.act_id);
                }
                Act.instance.findOneAndUpdate({_id:req.body.act_id},{$inc:{act_reg:1}},function(err,act){
                    req.flash('success','报名成功！');
                    res.redirect('/act/show/'+req.body.act_id);
                });
            });
    }
};