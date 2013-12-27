var mongoose = require('./db');
var util = require('util');

var Schema = mongoose.Schema;
 
var registerSchema = new Schema({
 	//title : {type : String, index : true, unique : true},
    act_title : {type : String},
 	act_id : {type : String},
 	email : {type : String},
    mobile : {type : String},
    address : {type : String},
    state : {type : Number, default : 0},
    create_time : {type : Date, default : Date.now},
    update_time : {type : Date, default : Date.now},
    username : {type: String}
 }, {
    collection: 'register'
});
 
var registerModel = mongoose.model('Register', registerSchema);

function Register(act) {
	this.act_title = act.act_title;
	this.act_id = act.act_id;
    this.email = act.email;
    this.mobile = act.mobile;
	this.address = act.address;
    this.username = act.username;
};

module.exports = Register;

Register.instance = registerModel;

Register.prototype.save = function(callback) {
  var reg = {
      act_title: this.act_title,
      act_id: this.act_id,
      email: this.email,
      mobile: this.mobile,
      address: this.address,
      username: this.username
  };

  var newReg = new registerModel(reg);

  newReg.save(function (err, reg) {
    if (err) {
      return callback(err);
    }
    callback(null, reg);
  });
};