/*
* Lightweight JSONP fetcher
* Copyright 2010-2012 Erik Karlsson. All rights reserved.
* BSD licensed
*/

/**
 * 
 * Modified on June 2013
 * To fit in the Baidu frontia JS SDK framework.
 * tongyao@baidu.com
 */


/*
* Usage:
* 
* baidu.frontia.jsonp.get( 'someUrl.php', {param1:'123', param2:'456'}, function(data){
*   //do something with data, which is the JSON object you should retrieve from someUrl.php
* }, function(ex){
*     //something goes wrong.
* });
* 
* baidu.frontia.jsonp.init({
*   error : function(ex){
*       
*   },
*   
*   callbackName : 'customCallbackName'
* })
*/


baidu.frontia.jsonp = {};
(function(namespace_){

    namespace_.jsonp = (function(){
        var counter = 0, head, window = this, config = {};
        
        function load(url, pfnError) {
            var script = document.createElement('script'),
                done = false;
            script.src = url;
            script.async = true;
     
            var errorHandler = pfnError || config.error;
            if ( typeof errorHandler === 'function' ) {
                script.onerror = function(ex){
                    errorHandler({url: url, event: ex});
                };
            }
    
            script.onload = script.onreadystatechange = function() {
                if ( !done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") ) {
                    done = true;
                    script.onload = script.onreadystatechange = null;
                    if ( script && script.parentNode ) {
                        script.parentNode.removeChild( script );
                    }
                }
            };
    
            if ( !head ) {
                head = document.getElementsByTagName('head')[0];
            }
            head.appendChild( script );
        }
        function encode(str) {
            return encodeURIComponent(str);
        }
        function jsonp(url, params, callback, onerror, callbackName) {
            var query = (url||'').indexOf('?') === -1 ? '?' : '&', key;
    
            callbackName = (callbackName||config['callbackName']||'callback');
            var uniqueName = 'baidu_frontia_' + callbackName + "_json" + (++counter);
    
            params = params || {};
            for ( key in params ) {
                if ( params.hasOwnProperty(key) ) {
                    query += encode(key) + "=" + encode(params[key]) + "&";
                }
            }   
    
            window[ uniqueName ] = function(data){
                callback(data);
                try {
                    delete window[ uniqueName ];
                } catch (e) {}
                window[ uniqueName ] = null;
            };
     
            load(url + query + callbackName + '=' + uniqueName, onerror);
            return uniqueName;
        }
        function setDefaults(obj){
            config = obj;
        }
        return {
            get:jsonp,
            init:setDefaults
        };
    }());
})(baidu.frontia);