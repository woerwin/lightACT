var mongoose = require('./db');
var util = require('util');

var Schema = mongoose.Schema;
 
var categorySchema = new Schema({
 	title : {type : String, index : true, unique : true},
    cate_pic : {type:String},
    act_slide : {type:String},
 	description : {type : String},
 	act_count : {type : Number, default : 0},
    state : {type : Number, default : 0},
    create_time : {type : Date, default : Date.now},
    update_time : {type : Date, default : Date.now}
 }, {
    collection: 'categories'
});
 
var categoryModel = mongoose.model('Category', categorySchema);

function Category(cate) {
	this.title = cate.title;
    this.cate_pic = cate.cate_pic;
    this.description = cate.description;
    this.state = cate.state;
};

module.exports = Category;

Category.instance = categoryModel;

Category.prototype.save = function(callback) {
  var cate = {
      title: this.title,
      cate_pic: this.cate_pic,
      description: this.description,
      state: this.state
  };

  var newCate = new categoryModel(cate);

  newCate.save(function (err, cate) {
    if (err) {
      return callback(err);
    }
    callback(null, cate);
  });
};