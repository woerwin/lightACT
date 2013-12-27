/**
 * ER (Enterprise RIA)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 杂而乱的工具对象
 * @author otakustay, errorrik
 */

/**
 * 
 * Modified on June 2013
 * To fit in the Baidu frontia JS SDK framework.
 * @author tongyao@baidu.com
 */


baidu.frontia.ajax = {};

(function(namespace_){
    
    var ajax = {};
    
    var util = namespace_.util;
    /**
     * 生成XMLHttpRequest请求的最终URL
     *
     * @param {string} url 请求的目标URL
     * @param {Object=} data 需要添加的参数
     */
    function resolveURL(url, data) {
        var query = util.serializeURL(data);
        if (query) {
            var delimiter = (url.indexOf('?') >= 0 ? '&' : '?');
            return url + delimiter + query;
        }
        else {
            return url;
        }
    }
    
    ajax.hooks = {};

    ajax.hooks.serializeData = function (data) {
        return serializeValue('', data);
    };

    function serializeValue(key, value) {
        if (value == null) {
            value = '';
        }
        var getKey = ajax.hooks.serializeData.getKey;
        var encodedKey = key ? encodeURIComponent(key) : '';

        var type = Object.prototype.toString.call(value);
        switch (type) {
            case '[object Array]':
                var encoded = [];
                for (var i = 0; i < value.length; i++) {
                    var item = value[i];
                    encoded[i] = serializeValue('', item);
                }
                return encodedKey
                    ? encodedKey + '=' + encoded.join(',')
                    : encoded.join(',');
            case '[object Object]':
                var result = [];
                for (var name in value) {
                    var propertyKey = getKey(name, key);
                    var propertyValue = 
                        serializeValue(propertyKey, value[name]);
                    result.push(propertyValue);
                }
                return result.join('&');
            default:
                return encodedKey 
                    ? encodedKey + '=' + encodeURIComponent(value)
                    : encodeURIComponent(value);
        }
    }

    ajax.hooks.serializeData.getKey = function (propertyName, parentKey) {
        return parentKey ? parentKey + '.' + propertyName : propertyName;
    };

    
    /**
     * 发起XMLHttpRequest请求
     *
     * @param {Object} options 相关配置
     * @param {string} options.url 请求的地址
     * @param {string=} options.method 请求的类型
     * @param {Object=} options.data 请求的数据
     * @param {string=} options.dataType 返回数据的类型，
     * 可以为**json**或**text**，默认为**responseText**
     * @param {number=} options.timeout 超时时间
     * @param {boolean=} options.cache 决定是否允许缓存
     */
    ajax.request = function (options) {
        var defaults = {
            method: 'POST',
            data: {},
            cache: true,
            callback : function(data){},
            onerror : function(xhr, error){}
        };
        options = util.mix(defaults, options);

        var xhr = window.XMLHttpRequest
            ? new XMLHttpRequest()
            : new ActiveXObject('Microsoft.XMLHTTP');

        var tick;
        
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                
                clearTimeout(tick);
                
                var status = xhr.status;
                // `file://`协议下状态码始终为0
                if (status === 0) {
                    status = 200;
                }
                // IE9会把204状态码变成1223
                else if (status === 1223) {
                    status = 204;
                }

                // 如果请求不成功，也就不用再分解数据了，直接丢回去就好
                if (status < 200 || (status >= 300 && status !== 304)) {
                    options.onerror(xhr);
                    return;
                }

                var data = xhr.responseText;
                if (options.dataType === 'json') {
                    try {
                        data = util.parseJSON(data);
                    }
                    catch (ex) {
                        // 服务器返回的数据不符合JSON格式，认为请求失败
                        options.onerror(xhr, ex)
                        return;
                    }
                }

                // 数据处理成功后，进行回调
                options.callback(data);
            }
        };

      
        var method = options.method.toUpperCase();
        
        var data = {};
        if (method === 'GET') {
            util.mix(data, options.data);
        }
        if (options.cache === false) {
            data['_'] = +new Date();
        }

                
        var url = resolveURL(options.url, data);

        
        xhr.open(method, url, true);

        // add set header function
        
        if (options.header) {
            var i; 
            for(i in options.header) {
                if (options.header.hasOwnProperty(i)) {
                 xhr.setRequestHeader(i, options.header[i]); 
                }
            }

        }
        // xhr.setRequestHeader('X-Frontia-Agent', 'platform=js'); 
        
        if (method === 'GET') {
            xhr.send();
        }
        else {

            var contentType = 
                options.contentType || 'application/x-www-form-urlencoded';
            xhr.setRequestHeader('Content-type', contentType);
            var query = ajax.hooks.serializeData(options.data);
            xhr.send(query);
            xhr.send(options.data);
        }

        if (options.timeout > 0) {
            tick = setTimeout(
                function () {
                    xhr.status = 408; // HTTP 408: Request Timeout
                    options.onerror(xhr);
                },
                options.timeout
            );
        }

        return xhr;
    };


    

    /**
     * 发起一个GET请求
     *
     * @param {string} url 请求的地址
     * @param {Object=} data 请求的数据
     * @param {Object=} options 相关配置
     */
    ajax.get = function (url, data, options) {
        var defaults = {
            method: 'GET',
            url: url,
            data: data,
            cache: false
        };
        options = util.mix(defaults, options);
        
        return ajax.request(options);
    };

    /**
     * 发起一个GET请求并获取JSON数据
     *
     * @param {string} url 请求的地址
     * @param {Object=} data 请求的数据
     * @param {Object=} options 相关配置
     */
    ajax.getJSON = function (url, data, options) {
        var defaults = {
            method: 'GET',
            url: url,
            data: data,
            dataType: 'json',
            cache: cache || false
        };
        
        options = util.mix(defaults, options);
        
        return ajax.request(options);
    };
    
    ajax.request1 = function (options) {

        var defaults = {
            method: 'POST',
            data: {},
            cache: true,
            callback : function(data){},
            onerror : function(xhr, error){}
        };
        options = util.mix(defaults, options);

        var xhr = window.XMLHttpRequest
            ? new XMLHttpRequest()
            : new ActiveXObject('Microsoft.XMLHTTP');

        var tick;
        
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                
                clearTimeout(tick);
                
                var status = xhr.status;
                // `file://`协议下状态码始终为0
                if (status === 0) {
                    status = 200;
                }
                // IE9会把204状态码变成1223
                else if (status === 1223) {
                    status = 204;
                }

                
                // 如果请求不成功，也就不用再分解数据了，直接丢回去就好
                if (status < 200 || (status >= 300 && status !== 304)) {
                    options.onerror(xhr);
                    return;
                }
                

                var data = xhr.responseText;
                if (options.dataType === 'json' && data) {
                    try {
                        data = util.parseJSON(data);
                    }
                    catch (ex) {
                        // 服务器返回的数据不符合JSON格式，认为请求失败
                        options.onerror(xhr, ex)
                        return;
                    }
                }

                // 数据处理成功后，进行回调
                // var responeseHeader = xhr.getAllResponseHeaders();
                // options.callback(data, responeseHeader);
                options.callback(data);
            }
        };

        var method = options.method.toUpperCase();
        var data = {};
        if (method === 'GET') {
            util.mix(data, options.data);
        }
        if (options.cache === false) {
            data['_'] = +new Date();
        }

        
        var url = resolveURL(options.url, data);

        xhr.open(method, url, true);

        // add set header function
        if (options.header) {
            var i; 
            for(i in options.header) {
                if (options.header.hasOwnProperty(i)) {
                 xhr.setRequestHeader(i, options.header[i]); 
                }
            }

        }
        // xhr.setRequestHeader('X-Frontia-Agent', 'platform=js'); 


        if (method === 'GET') {
            xhr.send();
        }
        else {

            if (options.contentLength) {
                xhr.setRequestHeader('Content-Length', options.contentLength);
            }
            if(options.contentType === 'multipart/form-data') {
                xhr.send(options.data);
            } else if (options.contentType === 'application/json') {
                xhr.setRequestHeader('Content-type', options.contentType);
                xhr.send(options.data);
            } else if (options.contentType === 'application/octet-stream') {
                xhr.setRequestHeader('Content-type', options.contentType);
                xhr.send(options.data);
            }
            else {
                var contentType = 
                options.contentType || 'application/x-www-form-urlencoded';
                xhr.setRequestHeader('Content-type', contentType);
                var query = ajax.hooks.serializeData(options.data);

                xhr.send(query);
            }
            
        }

        if (options.timeout > 0) {
            tick = setTimeout(
                function () {
                    xhr.status = 408; // HTTP 408: Request Timeout
                    options.onerror(xhr);
                },
                options.timeout
            );
        }

        return xhr;
    };


    /**
     * 发起一个POST请求
     *
     * @param {string} url 请求的地址
     * @param {Object=} data 请求的数据
     * @param {string=} dataType 指定w响应的数据格式，可为**text**或**json**
     * @param {Object=} options 相关配置
     */
    ajax.post = function (url, data, dataType, options) {
        var defaults = {
            method: 'POST',
            url: url, 
            data: data,
            dataType: dataType || 'json'
        };
        
        
        options = util.mix(defaults, options);
        
        return ajax.request1(options);
    };


    /**
     * 发起一个POST请求
     *
     * @param {string} url 请求的地址
     * @param {Object=} data 请求的数据
     * @param {string=} dataType 指定w响应的数据格式，可为**text**或**json**
     * @param {Object=} options 相关配置
     */
    ajax.put = function (url, data, dataType, options) {
        var defaults = {
            method: 'PUT',
            url: url, 
            data: data,
            dataType: dataType || 'json'
        };
        
        
        options = util.mix(defaults, options);
        
        return ajax.request1(options);
    };
    
    namespace_.ajax = ajax;
    
})(baidu.frontia);