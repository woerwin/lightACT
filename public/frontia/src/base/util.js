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


baidu.frontia.util = {};

(function (namespace_) {
    
        var now = +new Date();

        /**
         * 工具模块，放一些杂七杂八的东西
         */
        var util = {};

        /**
         * 获取一个唯一的ID
         *
         * @return {number} 一个唯一的ID
         */
        util.guid = function () {
            return 'baidu_frontia_' + now++;
        };

        /**
         * 混合多个对象
         *
         * @param {Object} source 源对象
         * @param {...Object} destinations 用于混合的对象
         * @return 返回混合了`destintions`属性的`source`对象
         */
        util.mix = function (source) {
            for (var i = 1; i < arguments.length; i++) {
                var destination = arguments[i];

                // 就怕有人传**null**之类的进来
                if (!destination) {
                    continue;
                }

                // 这里如果`destination`是字符串的话，会遍历出下标索引来，
                // 认为这是调用者希望的效果，所以不作处理
                for (var key in destination) {
                    if (destination.hasOwnProperty(key)) {
                        source[key] = destination[key];
                    }
                }
            }
            return source;
        };

        /**
         * 空函数
         *
         * @type {function}
         * @const
         */
        util.noop = function () {};


        /**
         * 将一段文本变为JSON对象
         *
         * @param {string} text 文本内容
         * @return {*} 对应的JSON对象
         */
        util.parseJSON = function (text) {
            if (window.JSON && typeof JSON.parse === 'function') {
                return JSON.parse(text);
            }
            else {
                return eval('(' + text + ')');
            }
        };

        var whitespace = /(^[\s\t\xa0\u3000]+)|([\u3000\xa0\s\t]+$)/g;

        /**
         * 移除字符串前后空格字符
         *
         * @param {string} source 源字符串
         * @return {string} 移除前后空格后的字符串
         */
        util.trim = function (source) {
            return source.replace(whitespace, '');
        };

        /**
         * 对字符中进行HTML编码
         *
         * @param {string} 源字符串
         * @param {string} HTML编码后的字符串
         */
        util.encodeHTML = function (source) {
            source = source + '';
            return source
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };


        /**
         * 将参数对象转换为URL字符串
         *
         * @param {Object} query 参数对象
         * @return {string} 转换后的URL字符串，相当于search部分
         */
        util.serializeURL = function (query) {
            if (!query) {
                return '';
            }

            var search = '';
            for (var key in query) {
                if (query.hasOwnProperty(key)) {
                    var value = query[key];
                    // 如果`value`是数组，其`toString`会自动转为逗号分隔的字符串
                    search += '&' + encodeURIComponent(key) 
                        + '=' + encodeURIComponent(value);
                }
            }

            return search.slice(1);
        };


        /**
         * base64 tool
         */
        
        (function(global) {
            'use strict';
            if (global.Base64) return;
            var version = "2.1.2";
            // if node.js, we use Buffer
            var buffer;
            if (typeof module !== 'undefined' && module.exports) {
                buffer = require('buffer').Buffer;
            }
            // constants
            var b64chars
            = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            var b64tab = function(bin) {
                var t = {};
                for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
                    return t;
            }(b64chars);
            var fromCharCode = String.fromCharCode;
            // encoder stuff
            var cb_utob = function(c) {
                if (c.length < 2) {
                    var cc = c.charCodeAt(0);
                    return cc < 0x80 ? c
                    : cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6))
                        + fromCharCode(0x80 | (cc & 0x3f)))
                    : (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
                     + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                     + fromCharCode(0x80 | ( cc         & 0x3f)));
                } else {
                    var cc = 0x10000
                    + (c.charCodeAt(0) - 0xD800) * 0x400
                    + (c.charCodeAt(1) - 0xDC00);
                    return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07))
                        + fromCharCode(0x80 | ((cc >>> 12) & 0x3f))
                        + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                        + fromCharCode(0x80 | ( cc         & 0x3f)));
                }
            };
            var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
            var utob = function(u) {
                return u.replace(re_utob, cb_utob);
            };
            var cb_encode = function(ccc) {
                var padlen = [0, 2, 1][ccc.length % 3],
                ord = ccc.charCodeAt(0) << 16
                | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
                | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
                chars = [
                b64chars.charAt( ord >>> 18),
                b64chars.charAt((ord >>> 12) & 63),
                padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
                padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
                ];
                return chars.join('');
            };
            var btoa = global.btoa || function(b) {
                return b.replace(/[\s\S]{1,3}/g, cb_encode);
            };
            var _encode = buffer
            ? function (u) { return (new buffer(u)).toString('base64') } 
            : function (u) { return btoa(utob(u)) }
            ;
            var encode = function(u, urisafe) {
                return !urisafe 
                ? _encode(u)
                : _encode(u).replace(/[+\/]/g, function(m0) {
                    return m0 == '+' ? '-' : '_';
                }).replace(/=/g, '');
            };
            var encodeURI = function(u) { return encode(u, true) };
            // decoder stuff
            var re_btou = new RegExp([
                '[\xC0-\xDF][\x80-\xBF]',
                '[\xE0-\xEF][\x80-\xBF]{2}',
                '[\xF0-\xF7][\x80-\xBF]{3}'
                ].join('|'), 'g');
            var cb_btou = function(cccc) {
                switch(cccc.length) {
                    case 4:
                    var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                    |    ((0x3f & cccc.charCodeAt(1)) << 12)
                    |    ((0x3f & cccc.charCodeAt(2)) <<  6)
                    |     (0x3f & cccc.charCodeAt(3)),
                    offset = cp - 0x10000;
                    return (fromCharCode((offset  >>> 10) + 0xD800)
                        + fromCharCode((offset & 0x3FF) + 0xDC00));
                    case 3:
                    return fromCharCode(
                        ((0x0f & cccc.charCodeAt(0)) << 12)
                        | ((0x3f & cccc.charCodeAt(1)) << 6)
                        |  (0x3f & cccc.charCodeAt(2))
                        );
                    default:
                    return  fromCharCode(
                        ((0x1f & cccc.charCodeAt(0)) << 6)
                        |  (0x3f & cccc.charCodeAt(1))
                        );
                }
            };
            var btou = function(b) {
                return b.replace(re_btou, cb_btou);
            };
            var cb_decode = function(cccc) {
                var len = cccc.length,
                padlen = len % 4,
                n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
                | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
                | (len > 2 ? b64tab[cccc.charAt(2)] <<  6 : 0)
                | (len > 3 ? b64tab[cccc.charAt(3)]       : 0),
                chars = [
                fromCharCode( n >>> 16),
                fromCharCode((n >>>  8) & 0xff),
                fromCharCode( n         & 0xff)
                ];
                chars.length -= [0, 0, 2, 1][padlen];
                return chars.join('');
            };
            var atob = global.atob || function(a){
                return a.replace(/[\s\S]{1,4}/g, cb_decode);
            };
            var _decode = buffer
            ? function(a) { return (new buffer(a, 'base64')).toString() }
            : function(a) { return btou(atob(a)) };
            var decode = function(a){
                return _decode(
                    a.replace(/[-_]/g, function(m0) { return m0 == '-' ? '+' : '/' })
                    .replace(/[^A-Za-z0-9\+\/]/g, '')
                    );
            };
            // export Base64
            
            
            global.mix(global, {
                VERSION: version,
                atob: atob,
                btoa: btoa,
                fromBase64: decode,
                toBase64: encode,
                utob: utob,
                encode: encode,
                encodeURI: encodeURI,
                btou: btou,
                decode: decode
            });
        })(util);

        util.isBoolean = function(obj) {
            return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
        }
        namespace_.util = util;
    }
    
)(baidu.frontia);
