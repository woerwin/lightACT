/**
 *
 * Baidu frontia JavaScript SDK
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @author baidu frontia group
 *
 */

var baidu = baidu || {};
baidu.frontia = {};

(function(namespace_){
  baidu.frontia.version = "1.0.0";
  baidu.frontia.serviceHost = {
    PCS: 'https://c.pcs.baidu.com',
    Frontia: 'https://frontia.baidu.com',
    PBLog: 'http://frontialog.smrapp.baidu.com',
    Social: 'https://openapi.baidu.com'
  }
  baidu.frontia.currentAccount = null;
  baidu.frontia.apiKey = null;
  baidu.frontia._CURRENT_USER_KEY = 'currentUser';

  if (typeof(localStorage) !== 'undefined') {
    baidu.frontia.localStorage = localStorage;
  }

  baidu.frontia.DomainManager = {
    getSocialDomain: function() {
      return baidu.frontia.serviceHost.Social;
    },
    getPCSDomain: function() {
      return baidu.frontia.serviceHost.PCS;
    },
    getFrontiaDomain: function() {
      return baidu.frontia.serviceHost.Frontia;
    },
    getPBLogDomain: function() {
      return baidu.frontia.serviceHost.PBLog;
    }
  }

  baidu.frontia.Base = Object.defineProperty(function() { }, 'extend', {
    value: function(prototype, properties) {
      // Create class definition
      var constructor = prototype && prototype.hasOwnProperty('constructor') ? prototype.constructor : this;
      var def = function() {
      	constructor.apply(this, arguments);
      };

      // Set prototype by merging child prototype into parents.
      def.prototype = (function(parent, child) {
      	Object.getOwnPropertyNames(child).forEach(function(property) {
      	  Object.defineProperty(parent, property, Object.getOwnPropertyDescriptor(child, property));
      	});
      	return parent;
      }(Object.create(this.prototype), prototype || {}));

      // Set static properties.
      if(properties) {
      	for(var prop in properties) {
      	  if(properties.hasOwnProperty(prop)) {
      	    def[prop] = properties[prop];
      	  }
      	}
      }

      // Add extend to definition.
      Object.defineProperty(def, 'extend', Object.getOwnPropertyDescriptor(this, 'extend'));

      // Return definition.
      return def;
    }
  });

  // 定义baidu.frontia基础对象
  baidu.frontia.Object = baidu.frontia.Base.extend(/** @lends baidu.frontia.Object.prototype*/{
    acl: null,

    /**
     * 创建一个新的baidu.frontia对象
     * 
     * @example <code>
     * var obj = new baidu.frontia.Object();
     * var acl = new baidu.frontia.ACL(); // 详见ACL对象
     * var obj = new baidu.frontia.Object(acl);
     * </code>
     *
     * @name baidu.frontia.Object
     * @constructor
     * @param {baidu.frontia.ACL} [acl] 对象的访问权限
     */
    constructor: function (acl) {
      if (acl && !( acl instanceof namespace_.ACL)) {
	throw new Error('[construct ]: acl is invalid');
      }
      this.acl = acl || null;
    },

    /**
     * 设置对象的访问权限
     *
     * @param {baidu.frontia.ACL} acl 对象的访问权限
     */
    setAcl: function(acl) {
      if (acl && !( acl instanceof namespace_.ACL)) {
	throw new Error('[setAcl ]: acl is invalid');
      }
      this.acl = acl || null;
    },

    /**
     * 获取对象的访问权限信息
     *
     * @return {baidu.frontia.ACL}
     */
    getACL: function() {
      return this.acl;
    },

    _getACLInfo: function() {
      var aclInfo = null;
      if (this.acl instanceof namespace_.ACL) {
        aclInfo = this.acl.toJSON();
      }
      return aclInfo;
    }
  });

  /**
   * 设置当前用户
   *
   * @global
   * @param {Object} account 用户包括User或Role类型
   */
  baidu.frontia.setCurrentAccount = function(account) {
    if (!(account instanceof namespace_.User || account instanceof namespace_.Role)) {
      throw new Error('[setCurrentAccount]: account is invalid');
    }

    // 存储当前账户到本地
    var accountJson = account.toJSON();
    baidu.frontia.localStorage.setItem(baidu.frontia._getLocalStorageKey(baidu.frontia._CURRENT_USER_KEY),
	  	                       JSON.stringify(account));
    baidu.frontia.currentAccount = account;
  }

  /**
   * 退出当前用户
   *
   * @global
   */
  baidu.frontia.logOutCurrentAccount = function() {
    baidu.frontia.currentAccount = null;
    baidu.frontia.localStorage.removeItem(baidu.frontia._getLocalStorageKey(baidu.frontia._CURRENT_USER_KEY))
  }

  /**
   * 获取当前用户
   *
   * @global
   * @return {Object} 返回当前用户，用户包括User或Role类型
   */
  baidu.frontia.getCurrentAccount = function() {
    if (baidu.frontia.currentAccount) {
      return baidu.frontia.currentAccount;
    }

    var accountInfo = baidu.frontia.localStorage.getItem(baidu.frontia._getLocalStorageKey(baidu.frontia._CURRENT_USER_KEY));
    if (!accountInfo) {
      return null;
    }

    var accountData = JSON.parse(accountInfo);
    if (accountData.type === 'user') {
      return new baidu.frontia.User({
	socialId: accountData.socialId,
	accessToken: accountData.accessToken,
	name: accountData.name,
	mediaType: accountData.mediaType,
	expiresIn: accountData.expiresIn
      });
    } else {
      return new baidu.frontia.Role(accountData.roleId);
    }
  }

  /**
   * baidu.frontia初始化, 调用baidu.frontia接口之前，必须调用该接口进行初始化
   *
   * @global
   * @param {string} apiKey 开发者的apiKey，从BAE开放平台获取
   */
  baidu.frontia.init = function(apiKey) {
    if (!apiKey) {
      throw new Error('[init]: apiKey is invaild')
    }
    baidu.frontia.apiKey = apiKey;
  }

  /**
   * 获取开发者初始化的apiKey
   *
   * @global
   * @return {string} 开发者设置的apiKey
   */
  baidu.frontia.getApiKey = function(apiKey) {
    return baidu.frontia.apiKey;
  }

  baidu.frontia._getLocalStorageKey = function(userKey) {
    if (!baidu.frontia.apiKey) {
      throw "Should call baidu.frontia.init before using baidu.frontia"
    }
    if (!userKey) {
      userKey = '';
    }
    if (typeof userKey !== 'string') {
      throw "userKey must be a string when getting localStorage key"
    }
    return "baidu.frontia/" + baidu.frontia.apiKey + '/' + userKey;
  }

})(baidu.frontia);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = baidu;
}
