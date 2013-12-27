var mongoose = require('./db');
var util = require('util');

var Schema = mongoose.Schema;
 
var actSchema = new Schema({
 	title : {type : String, index : true, unique : true},
    act_time : {type : String},
    end_time : {type : String},
 	address : {type : String},
    act_pic : {type:String},
    act_slide : {type:String},
 	description : {type : String},
    content : {type : String},
    act_man : {type : Number, Default : 120},
    act_reg : {type : Number, Default : 0},
 	post_count : {type : Number, default : 0},
    reply_count : {type : Number, default : 0},
    state : {type : Number, default : 0},
    is_recommend : {type : Number, default : 0},
    create_time : {type : Date, default : Date.now},
    update_time : {type : Date, default : Date.now},
    username : {type: String},
    cate_title : {type: String}
 }, {
    collection: 'acts'
});
 
var actModel = mongoose.model('Act', actSchema);

function Act(act) {
	this.title = act.title;
	this.act_time = act.act_time;
    this.end_time = act.end_time;
    this.address = act.address;
    this.act_pic = act.act_pic;
	this.act_slide = act.act_slide;
    this.description = act.description;
    this.content = act.content;
	this.act_man = act.act_man;
    this.state = act.state;
    this.is_recommend = act.is_recommend;
    this.username = act.username;
    this.cate_title = act.cate_title;
};

module.exports = Act;

Act.instance = actModel;

Act.prototype.save = function(callback) {
  var act = {
      title: this.title,
      act_time: this.act_time,
      end_time: this.end_time,
      address: this.address,
      act_pic: this.act_pic,
      act_slide: this.act_slide,
      description: this.description,
      content: this.content,
      act_man: this.act_man,
      state: this.state,
      is_recommend: this.is_recommend,
      username: this.username,
      cate_title: this.cate_title
  };

  var newAct = new actModel(act);

  newAct.save(function (err, act) {
    if (err) {
      return callback(err);
    }
    callback(null, act);
  });
};