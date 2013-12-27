/*
 * GET home page.
 */
//var testCache = require('../lib/cache');
//var testMongo = require('../lib/mongo');
//var testRedis = require('../lib/redis');
//var testSql = require('../lib/sql');
var testImage = require('../lib/image');
var util = require('util');
var utils = require('../lib/utils.js');
var crypto = require('crypto');
var User = require('../models/user');
var Act = require('../models/act');
var Category = require('../models/category');
var userRoute = require('./user');
var actRoute = require('./act');
var fs = require('fs');
var async = require('async');

//exports.index = function(req, res){
//  res.render('index', { title: 'Express BAE...' });
//};

function checkIsLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','请先登录！');
        res.redirect('/login');
        return;
    }
    next();
}

function checkIsAdmin(req,res,next){
    if(!req.session.user){
        req.flash('error','请先登录！');
        res.redirect('/login');
        return;
    }
    if(!req.session.user.is_admin){
        req.flash('error','亲，这里没权限哦！');
        res.redirect('/');
        return;
    }
    next();
}

module.exports = function(app){
    app.get('/', function(req, res) {
        //res.cookie('name', 'tobi',{httpOnly: true,maxAge: 1000 * 60 * 60 * 24 * 30,signed: true });
        //req.cookies.name req.signedCookies.name
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
        var slides = {};
        async.waterfall([
            function(callback){
                Act.instance.find({state:0,is_recommend:1},{},{limit:5,sort:{create_time:-1}},function(err,slide){
                    slides = slide;
                    callback(err);
                });
            },
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
           //var pages = totalPage ? utils.pagination(page,totalPage) : '';
           //var len = cates.length;
           //for(var i = 0;i < len;i++){
           //     console.log(cates[i].title);
           //}
           var cateStr = '';
           if(cate_title){
                var pages = totalPage ? utils.pagination(page,totalPage,'?cname='+cate_title) : '';
                cateStr = '<li><a href="/">全部</a>';
           }else{
                var pages = totalPage ? utils.pagination(page,totalPage) : '';
                cateStr = '<li class="active"><a href="/">全部</a>';
           }
           cates.forEach(function(doc){
                if(cate_title == doc.title){
                    cateStr += '<li class="active"><a href="?cname='+doc.title+'">'+doc.title+'</a>';
                }else{
                    cateStr += '<li><a href="?cname='+doc.title+'">'+doc.title+'</a>';
                }
           });
           var len = slides.length;
           var slide_nums = '';
           var slide_pics = '';
           for(var i = 0; i < len; i++){
                if(i == 0){
                    slide_nums += '<li class="active" data-slide-to="0" data-target="#carousel-example-generic"></li>';
                    slide_pics += '<div class="item active"><a href="/act/show/'+slides[i]._id+'"><img alt="'+slides[i].title+'" data-src="" src="'+slides[i].act_slide+'" width="100%"/></a></div>';
                }else{
                    slide_nums += '<li class="" data-slide-to="'+i+'" data-target="#carousel-example-generic"></li>';
                    slide_pics += '<div class="item"><a href="/act/show/'+slides[i]._id+'"><img alt="'+slides[i].title+'" data-src="" src="'+slides[i].act_slide+'" width="100%"/></a></div>';
                }
           }
           res.render('index',{
            title:'轻活动·易享--技术交流分享平台',
            nav_index:true,
            pages:pages,
            slides:slides,
            slide_nums:slide_nums,
            slide_pics:slide_pics,
            cates:cates,
            cateStr: cateStr,
            acts:acts
           });
        });
        //res.render('index', {title:'轻活动·易享--技术交流分享平台',nav_index:true});
    });
    app.get('/acts',actRoute.acts);
    
    app.get('/act/list',checkIsAdmin, actRoute.list);
    app.get('/act/show/:id', actRoute.show);
    app.get('/act/add',checkIsAdmin, actRoute.add);
    app.post('/act/add',checkIsAdmin, actRoute.add);
    app.get('/act/cate',checkIsAdmin, actRoute.catelist);
    app.get('/act/cateadd',checkIsAdmin, actRoute.cateadd);
    app.post('/act/cateadd',checkIsAdmin, actRoute.cateadd);
    app.get('/act/catedel',checkIsAdmin, actRoute.catedel);
    app.get('/act/actdel',checkIsAdmin, actRoute.actdel);
    app.get('/act/join',actRoute.join);
    app.get('/act/doregister/:id',checkIsLogin, actRoute.doregister);
    app.post('/act/doregister/:id',checkIsLogin, actRoute.doregister);
    app.get('/act/register', actRoute.register);
    app.post('/act/register', actRoute.register);
    app.get('/act/registerdel',checkIsAdmin, actRoute.registerdel);

    app.get('/user/myact',checkIsLogin,userRoute.myact);
    app.get('/user/doact',checkIsLogin,userRoute.doact);
    app.get('/user/addact',checkIsLogin, userRoute.addact);
    app.post('/user/addact',checkIsLogin, userRoute.addact);
    app.get('/user/actmember',checkIsLogin, userRoute.actmember);
    app.get('/login', userRoute.login);
    app.post('/login', userRoute.login);
    app.get('/logout',userRoute.logout);
    app.get('/register', userRoute.logout);
    app.post('/register', userRoute.register);
    app.get('/u/:name',checkIsLogin, userRoute.index);
    app.get('/user/list',checkIsAdmin, userRoute.list);
    app.get('/social_login',userRoute.social_login);
    app.post('/social_login',userRoute.social_login);
    app.get('/head',checkIsLogin,userRoute.head);
    app.post('/head',checkIsLogin,userRoute.head);
    app.get('/password',checkIsLogin,userRoute.password);
    app.post('/password',checkIsLogin,userRoute.password);
    app.get('/userinfo',checkIsLogin,userRoute.userinfo);
    app.post('/userinfo',checkIsLogin,userRoute.userinfo);
    app.get('/userdel/:uid',checkIsAdmin,userRoute.userdel);
    
    app.get('/editor', function(req,res){
        res.render('editor',{
            title:'editor...'
        });
    });
    app.get('/upload', function (req, res) {
        res.render('upload', {
            title: '文件上传',
            user: req.session.user
        });
    });
    app.post('/upload', function (req, res) {
        var fileTypes = ['jpg','jpeg','png','gif'];
        //res.end(util.inspect(req.files));
        var date = new Date();
        var save_dir = './public/uploads/' + date.getFullYear() + (date.getMonth() + 1) + '/';
        if(!fs.existsSync(save_dir)){
            fs.mkdir(save_dir);
        }
        var md5sum;
        
        // 移动文件
        //fs.rename(tmp_path, target_path, function(err) {
        //    if (err) throw err;
            // 删除临时文件夹文件, 
        //    fs.unlink(tmp_path, function() {
                //if (err) throw err;
        //        res.json({error:0,url:(save_dir.substr(8) + sava_name)});
        //    });
        //});
        
        var ret = [];
        var j = 0;
        var ext_name = '';
        var limit_file_size = 2 * 1024 * 1024;//2M
        var sava_name = '';
        var target_path = '';
        var img_url = '';
        for (var i in req.files) {
            if (req.files[i].size == 0){
                // 使用同步方式删除一个文件
                fs.unlinkSync(req.files[i].path);
                //req.flash('success', '文件上传失败!');
                //console.log('Successfully removed an empty file!');
                ret[j] = {'err':1,'url':'','msg':'文件上传失败或未选择文件！','file':req.files[i].name,'tag':i};
            } else {
                ext_name = req.files[i].name.substr(req.files[i].name.lastIndexOf('.') + 1);
                if(req.files[i].size > limit_file_size){
                    //ret[j] = {'err':1,'url':'','msg':'文件不能大于2M！','file':req.files[i].name,'tag':i};
                    //continue;
                }
                md5sum = crypto.createHash('md5');
                sava_name = md5sum.update((new Date()).toString()).digest('hex') + req.files[i].name.substr(req.files[i].name.lastIndexOf('.'));
                target_path = save_dir + sava_name;
                // 使用同步方式重命名一个文件
                fs.renameSync(req.files[i].path, target_path);
                //req.flash('success', '文件上传成功!');
                //console.log('Successfully renamed a file!');
                ret[j] = {'err':0,'url':(save_dir.substr(8) + sava_name),'msg':'文件上传成功！','file':req.files[i].name,'tag':i};
            }
            j++;
        }
        res.json(ret);
        //res.end(util.inspect(ret));
        //res.redirect('/upload');
    });
    
    //uedito image upload
    app.post('/editor_upload',function(req,res){
        var fileTypes = ['jpg','jpeg','png','gif'];
        //res.end(util.inspect(req.files));
        var date = new Date();
        var save_dir = './public/uploads/' + date.getFullYear() + (date.getMonth() + 1) + '/';
        if(!fs.existsSync(save_dir)){
            fs.mkdir(save_dir);
        }
        var md5sum;
        var ret = [];
        var j = 0;
        var ext_name = '';
        var limit_file_size = 2 * 1024 * 1024;//2M
        var sava_name = '';
        var target_path = '';
        var img_url = '';
        for (var i in req.files) {
            if (req.files[i].size == 0){
                // 使用同步方式删除一个文件
                fs.unlinkSync(req.files[i].path);
                img_url = '';
            } else {
                ext_name = req.files[i].name.substr(req.files[i].name.lastIndexOf('.') + 1);
                if(req.files[i].size > limit_file_size){
                    //ret[j] = {'err':1,'url':'','msg':'文件不能大于2M！','file':req.files[i].name,'tag':i};
                    //continue;
                }
                md5sum = crypto.createHash('md5');
                sava_name = md5sum.update((new Date()).toString()).digest('hex') + req.files[i].name.substr(req.files[i].name.lastIndexOf('.'));
                target_path = save_dir + sava_name;
                // 使用同步方式重命名一个文件
                fs.renameSync(req.files[i].path, target_path);
                img_url = save_dir.substr(8) + sava_name;
            }
            j++;
        }
        var str = "<script>parent.UM.getEditor('"+ req.query.editorid+"').getWidgetCallback('image')('" + img_url + "','SUCCESS');</script>";
        res.end(str);
    });
    
    app.use(function (req, res) {
        res.render("404",{layout:false,title:'404,Not Found!'});
    });
    
    // 获取环境变量
    app.get('/env', function(req, res) {
        res.end(util.inspect(process.env));
    });

    /*
    //memcache测试
    app.get('/cache', function(req, res){
        testCache(req, res);
    });

    // mongo数据库测试
    app.get('/mongo', function(req, res) {
        testMongo(req, res);
    });

    // redis数据库测试
    app.get('/redis', function(req, res) {
        testRedis(req, res);
    });

    // sql数据库测试
    app.get('/sql', function(req, res) {
        testSql(req, res);
    });
    */
  
    // image服务：图像变换
    app.get('/image/transform', function(req, res) {
        testImage.transform(req, res);
    });
  
    // image服务：二维码生成
    app.get('/image/qrcode', function(req, res) {
        testImage.qrcode(req, res);
    });

    // image服务: 文字水印
    app.get('/image/annotate', function(req, res) {
        testImage.annotate(req, res); 
    });

    // image服务: 验证码生成
    app.get('/image/vcode', function(req, res) {
        testImage.vcode(req, res);
    });

    // image服务: 图像合成
    app.get('/image/composite', function(req, res) {
        testImage.composite(req, res);
    });
    
    //EventProxy https://github.com/JacksonTian/eventproxy
    app.get('/ep',function(req,res){
        var EventProxy = require('eventproxy');
        var ep = new EventProxy();
        
        
        /*//多类型异步协作
        ep.all('json', 'data', function (json, data) {
            // 在所有指定的事件触发后，将会被调用执行
            // 参数对应各自的事件名
            res.render('ep',{
                title:'EventProxy' + data,
                json:json
            });
        });
        fs.readFile('package.json', 'utf-8', function (err, content) {
            ep.emit('json', content);
        });
        Category.instance.find({state:0},{},{sort:{create_time:1}},function(err,sorts){
            ep.emit('data', '这里是读取分类信息~');
        });*/
        
        /*//重复异步协作
        ep.after('got_file', 3, function (list) {
            // 在所有文件的异步执行结束后将被执行
            // 所有文件的内容都存在list数组中
            console.log('3 times end...');
        });
        for (var i = 0; i < 3; i++) {
            fs.readFile('package.json', 'utf-8', function (err, content) {
                // 触发结果事件
                ep.emit('got_file', content);
            });
        }*/
        
        //持续型异步协作
        ep.tail('tail_1', 'tail_2', function (tail_1, tail_2) {
            // 在所有指定的事件触发后，将会被调用执行
            // 参数对应各自的事件名的最新数据
            console.log(tail_1 + tail_2);
            if(tail_2 >= 5){
                ep.removeAllListeners();
                res.end('end...');
                //res.render('ep',{
                //    title:'EventProxy' + tail_2,
                //    json:tail_1
                //});
            }
        });
        ep.emit('tail_1', 't1...');
        var j = 0;
        setInterval(function () {
            ep.emit('tail_2', j);
            j++;
        }, 1000);
        
    });
}