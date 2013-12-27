//mongodb

var configs = require('../config/config');

/*
var Db = require('mongodb').Db;
var Connection =  require('mongodb').Connection;
var Server = require('mongodb').Server;

//Connection.DEFAULT_PORT
module.exports = new Db(configs.dbName, new Server(configs.dbHost, configs.dbPort, {
	auto_reconnect : true
}));
*/

var mongoose = require('mongoose');
mongoose.connect(configs.dbHost,configs.dbName,configs.dbPort,{server: { auto_reconnect: true }, user: configs.dbUser, pass: configs.dbPWD}, function(err){
    if(err){
    	console.log('Connect Is Error: ', settings.db, err.message);
    	process.exit(1);
    }
});

module.exports = mongoose;