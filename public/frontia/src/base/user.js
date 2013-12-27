baidu.frontia.Account = baidu.frontia.Account || {};
baidu.frontia.User = baidu.frontia.User || {};
baidu.frontia.Role = baidu.frontia.Role || {};
baidu.frontia.ACL = baidu.frontia.ACL || {};

(function (namespace_) {

  var Error = namespace_.error;
  var ErrConst = namespace_.ERR_MSG;
  var ROLEUriPrefixs = namespace_.DomainManager.getFrontiaDomain() + '/role';
  var USERUriPrefixs = namespace_.DomainManager.getFrontiaDomain() + '/user';
  var PBLOGUriPrefixs = namespace_.DomainManager.getPBLogDomain() + '/pushlog';

  // 定义Account对象
  namespace_.Account = namespace_.Object.extend(/** @lends baidu.frontia.Account.prototype */{
    accountId: null,
    accountType: null,
    accountName: null,

    /**
     * 创建一个新的baidu.frontia.Account对象，继承于baidu.frontia.Object
     *
     * @name baidu.frontia.Account
     * @constructor
     * @extends baidu.frontia.Object
     * @param {string|Number} accountId 帐户ID
     * @param {string} accountType 帐户类型
     * @param {string} accountName 帐户名称
     */
    constructor: function(accountId, accountType, accountName) {
      if (!(accountId && (typeof accountId === 'string' || typeof accountId === 'number'))) {
        throw new Error(ErrConst.INVALID_PARAMS, '[construct Role/User]: accountId is invalid, the typeof accountId is string or number');
      }
      this.accountType = accountType;
      this.accountId = accountId;
      this.accountName = accountName;
    },

    /**
     * 获取帐户ID
     *
     * @return {string|Number}
     */
    getId: function() {
      return this.accountId;
    },

    /**
     * 获取账户类型
     *
     * @return {string} 返回帐户类型'user'或者'role'
     */
    getType: function() {
      return this.accountType
    },

    /**
     * 获取帐户名称
     *
     * @return {string} 返回账户名称
     */
    getName: function() {
      return this.accountName
    }

  });

  namespace_.User = namespace_.Account.extend(/** @lends baidu.frontia.User.prototype*/{
    accessToken: null,
    expirationIn: null,
    mediaType: null,

    /**
     * 创建一个用户，继承baidu.frontia.Account
     *
     * @constructor
     * @name baidu.frontia.User
     * @extends baidu.frontia.Account
     * @param {Object} options 创建用户选项
     * @param {Number} options.socialId 用户社会化平台id
     * @param {string} options.accessToken 从social获取的用户token
     * @param {string} options.name 用户名
     * @param {Number} options.expiresIn accessToken有效期，单位秒
     * @param {string} options.mediaType 社会化平台名称，支持 baidu/qqweibo/sinaweibo/qqdenglu/kaixin
     *
     */
    constructor: function(options) {
      options = options || {};
      this.accessToken = options.accessToken;
      this.expiresIn = options.expiresIn;
      this.mediaType = options.mediaType;
      namespace_.Account.prototype.constructor.call(this, options.socialId, 'user', options.name);
    },

    /**
     * 获取用户accessToken
     *
     * @return {string} 返回用户accessToken
     */
    getAccessToken: function() {
      return this.accessToken;
    },

    /**
     * 获取用户accessToken 有效期
     *
     * @return {Number}
     */
    getExpiresIn: function() {
      return this.expiresIn;
    },

    /**
     * 获取用户媒体类型
     *
     * @return {string} mediaType
     */
    getMediaType: function() {
      return this.mediaType;
    },

    /**
     * 获取用户具体信息
     *
     * @param {function(result)} [options.success] 获取成功后callback
     * @param {function(error, xhr)} [options.error] 获取失败后callback
     */
    getDetailInfo: function(options) {
      options = options || {};

      options.error || (options.error = function(){});
      options.success || (options.success = function(){});

      namespace_.User.find({userId: this.accountId}, {
        error: function(err) {
          options.error(err);
        },
        success: function(data) {
          if (data.count === 0) {
            options.error(new Error({Code: '1701', Message: 'user not exists'}))
          } else {
            options.success(data.result[0]);
          }

        }
      });
    },

    /**
     * 返回User信息的JSON对象
     *
     * @return {Object}
     */
    toJSON: function() {
      return {
        socialId: this.getId(),
        name: this.getName(),
        type: this.getType(),
        mediaType: this.getMediaType(),
        expiresIn: this.getExpiresIn(),
        accessToken: this.getAccessToken()
      }
    }
  });

  var userCloud = /** @lends baidu.frontia.User*/{

    options: {
      error: function(){},
      success: function(){}
    },

    _configure: function(options) {
      options = options || {};
      options.error && (this.options.error = options.error);
      options.success && (this.options.success = options.success);
    },

    _checkParams: function(params, prompt) {
      var self = this;

      return params.every(function(elem) {

               if (elem.type === 'string' && !(elem.value && typeof elem.value  === 'string')) {
                 self.options.error(new Error(ErrConst.INVALID_PARAMS, '['+ prompt +']: target is invalid'));
                 return false;
               }
               if (elem.type === 'role' && !(elem.value  &&  elem.value instanceof namespace_.Role)){
                 self.options.error(new Error(ErrConst.INVALID_PARAMS, '[' + prompt + ']: role is invalid'));
                 return false;
               }
               if (elem.type === 'array' && !(elem.value  && Object.prototype.toString.call(elem.value).slice(8, -1) === 'Array')){
                 self.options.error(new Error(ErrConst.INVALID_PARAMS, '[' + prompt + ']: targets is invalid'));
                 return false;
               }
               return true;
             });
    },

    /**
     * 按条件查询云上所有用户信息
     *
     * @param {Object} [query] 需要查询的用户信息
     * @param {string} query.mediaType 用户媒体类型，如baidu/sinaweibo
     * @param {string} query.sex 用户性别，“0”表示女，“1”表示男
     * @param {Number} query.userId 用户id(social id), 平台唯一
     * @param {string} query.userName 用户名
     * @param {Object} options
     * @param {function(data)} [options.success] 查询成功后callback，data包括:
     *    {
     *      result: [], // user数组
     *      count: xxx     // user数目
     *    }
     * @param {function(error)} [options.error] 查询失败后callback
     */
    find: function(query, options) {

     var frontia_action = {};
      frontia_action['action_name'] = 'User.list';
      frontia_action['timestamp'] = _getTimestamp();

      var self = this;
      if (arguments.length === 1 ) {
        var options = query;
      }
      options || (options = {});
      self._configure(options);

      var conn = {};
      if (query.mediaType) {
        conn.media_type = query.mediaType;
      }
      if (query.sex) {
        conn.sex = query.sex;
      }
      if (query.userId) {
        conn.user_id = query.userId;
      }
      if (query.userName) {
        conn.username = query.userName;
      }

      var body = self._attachAccount({
        method: 'list',
        criteria: conn
      });

      var requestOpt = self._createAjaxOpt(frontia_action, {
        header: {
          authorization: _generateAuth(namespace_.getApiKey())
        },
        contentType: 'application/json'
      });

      // recreate callback
      requestOpt.callback = function(data) {
        if (data.error_code) {
          var error = new Error(data);
          self.options.error(error);
          frontia_action.err_code = error.code;
          frontia_action.err_msg = error.message;
        } else {
          var result = [];
          data.response_params.users.forEach(function(elem) {

            var user = new namespace_.User({
              socialId: elem.user_id,
              mediaType: elem.media_type,
              name: elem.username
            });
            result.push(user);
          })
          self.options.success({
            result: result,
            count: data.response_params.count
          });
          frontia_action.err_code = 0;
        }
        frontia_action.restimestamp = _getTimestamp();
        _sendPBLog(frontia_action);
      }

      var ajax = namespace_.ajax;
      ajax.post(USERUriPrefixs, JSON.stringify(body), 'json', requestOpt);
    },

    _attachAccount: function(body) {
      var self = this;
      var account = null;
      if (namespace_.currentAccount && namespace_.currentAccount instanceof namespace_.Role && namespace_.currentAccount.getId()) {
        account = 'requester';
        body[account] = namespace_.currentAccount.getType() + ':' + namespace_.currentAccount.getId();
      } else if (namespace_.currentAccount && namespace_.currentAccount instanceof namespace_.User && namespace_.currentAccount.getAccessToken()) {
        account = 'requester';
        body[account] = namespace_.currentAccount.getType() + ':' + namespace_.currentAccount.getAccessToken();
      }
      return body;
    },

    _createAjaxOpt: function(frontia_action, options) {
      var self = this;

      var deafaultOpt =  {
        callback: function(data) {
          if (data.error_code) {
            var error = new Error(data);
            self.options.error(error);
            frontia_action.err_code = error.code;
            frontia_action.err_msg = error.message;
          } else {
            self.options.success(data);
            frontia_action.err_code = 0;
          }
          frontia_action.restimestamp = _getTimestamp();
          _sendPBLog(frontia_action);
        },
        onerror: function(xhr, error) {
          try {
            var err_data = namespace_.util.parseJSON(xhr.responseText);
          } catch(ex) {
            self.options.error(ex, xhr);
            return;
          }
          var error = new Error(err_data);
          self.options.error(new Error(err_data), xhr);
          frontia_action.err_code = error.code;
          frontia_action.err_msg = error.message;
          frontia_action.restimestamp = _getTimestamp();

          _sendPBLog(frontia_action);
        }
      }
      return namespace_.util.mix(deafaultOpt, options);
    }
  }
  namespace_.util.mix(namespace_.User, userCloud);

  namespace_.Role = namespace_.Account.extend(/** @lends baidu.frontia.Role.prototype */{

    roleList: {},

    /**
     * 创建一个角色, Role继承与baidu.frontia.Account, 一个角色可以包含多个成员，成员由User或Role构成
     *
     * @constructor
     * @name baidu.frontia.Role
     * @extends baidu.frontia.Account
     * @param {string} roleId 角色ID
     * @param {Array} [accounts] 角色成员list，其组成可以是Role或User
     */
    constructor: function(roleId, accounts) {
      this.roleList = {};
      if (Array.isArray(accounts)) {
        accounts.forEach(function(account) {
          if (!(account instanceof namespace_.User || account instanceof namespace_.Role)) {
            throw new Error(ErrConst.INVALID_PARAMS, '[construct Role]: account is invalid');
          }
          this.roleList[account.getId()] = account;
        });
      }
      namespace_.Account.prototype.constructor.call(this, roleId, 'role', roleId);
    },

    /**
     * 添加一个Role或者User
     *
     * @param {baidu.frontia.Account} account 需添加的角色成员(Role或User)
     */
    add: function(account) {
      if (!(account instanceof namespace_.User || account instanceof namespace_.Role)) {
        throw new Error(ErrConst.INVALID_PARAMS, '[add Role]: account is invalid');
      }
      this.roleList[account.getId()] = account;
    },

    /**
     * 删除一个Role或者User
     *
     * @param {string} accountId 需删除的角色成员的ID
     */
    delete: function(accountId) {
      delete this.roleList[accountId];
    },

    /**
     * 获取角色成员信息
     *
     * @return {Object}
     */
    getInfo: function() {
      var accountsInfo = [];
      for (var i in this.roleList) {
        if (this.roleList.hasOwnProperty(i)) {
          accountsInfo.push(this.roleList[i].getType() + ':' + this.roleList[i].getId());
        }
      }
      return accountsInfo;
    },

    /**
     * 返回Role信息的JSON对象
     *
     * @return {Object}
     */
    toJSON: function() {
      return {
        roleId: this.getId(),
        name: this.getName(),
        memberList: this.getInfo()
      }
    }
  });

  var roleCloud = /** @lends baidu.frontia.Role*/{
    options: {
      error: function(){},
      success: function(){}
    },
    _configure: function(options) {
      options = options || {};
      options.error && (this.options.error = options.error);
      options.success && (this.options.success = options.success);
    },

    _checkParams: function(params, prompt) {
      var self = this;

      return params.every(function(elem) {

               if (elem.type === 'string' && !(elem.value && typeof elem.value  === 'string')) {
                 self.options.error(new Error(ErrConst.INVALID_PARAMS, '['+ prompt +']: target is invalid'));
                 return false;
               }
               if (elem.type === 'role' && !(elem.value  &&  elem.value instanceof namespace_.Role)){
                 self.options.error(new Error(ErrConst.INVALID_PARAMS, '[' + prompt + ']: role is invalid'));
                 return false;
               }
               if (elem.type === 'array' && !(elem.value  && Object.prototype.toString.call(elem.value).slice(8, -1) === 'Array')){
                 self.options.error(new Error(ErrConst.INVALID_PARAMS, '[' + prompt + ']: targets is invalid'));
                 return false;
               }
               return true;
             });
    },

    /**
     * 删除云上创建的角色
     *
     * @param {string} roleId 角色ID
     * @param {Object} options
     * @param {function(result)} [options.success] 删除成功后callback
     * @param {function(error, xhr)} [options.error] 删除失败后callback
     */
    remove: function(roleId, options) {

      var frontia_action = {};
      frontia_action['action_name'] = 'Role.remove';
      frontia_action['timestamp'] = _getTimestamp();

      var self = this;

      options = options || {};
      self._configure(options);
      if (!self._checkParams([{value: roleId, type: 'string'}], 'Role remove')) return;

      var body = self._attachAccount({
        method: 'remove',
        role_id: roleId
      });
      var requestOpt = self._createAjaxOpt(frontia_action, {
        header: {
          authorization: _generateAuth(namespace_.getApiKey())
        },
        contentType: 'application/json'
      });

      var ajax = namespace_.ajax;
      ajax.post(ROLEUriPrefixs, JSON.stringify(body), 'json', requestOpt);
    },

    /**
     * 获取云上已创建的角色
     *
     * @param {string} roleId 角色ID
     * @param {Object} options
     * @param {function(result)} [options.success] 获取成功后callback
     * @param {function(error, xhr)} [options.error] 获取失败后callback
     */
    get: function(roleId, options) {

      var frontia_action = {};
      frontia_action['action_name'] = 'Role.get';
      frontia_action['timestamp'] = _getTimestamp();

      var self = this;

      options = options || {};
      self._configure(options);
      if (!self._checkParams([{value: roleId, type: 'string'}], 'Role get')) return;

      var body = self._attachAccount({
        method: 'describe',
        role_id: roleId
      });
      var requestOpt = self._createAjaxOpt(frontia_action, {
        header: {
          authorization: _generateAuth(namespace_.getApiKey())
        },
        contentType: 'application/json'
      });

      var ajax = namespace_.ajax;
      ajax.post(ROLEUriPrefixs, JSON.stringify(body), 'json', requestOpt);
    },

    /**
     * 将角色保存到云上
     *
     * @param {Role} role 创建的角色
     * @param {Object} options
     * @param {function(result)} [options.success] 保存成功后callback
     * @param {function(error, xhr)} [options.error] 保存失败后callback
     */
    save: function(role, options) {

      var frontia_action = {};
      frontia_action['action_name'] = 'Role.save';
      frontia_action['timestamp'] = _getTimestamp();

      var self = this;

      options = options || {};
      self._configure(options);
      if (!self._checkParams([{value: role, type: 'role'}], 'Role save')) return;
      var roleInfo = role.getInfo();

      var body = self._attachAccount({
        method: 'create',
        role_id: role.getId(),
        child: roleInfo,
      });

      var acl = role.getACL();
      if (acl) {
        body['_acl'] = acl.toJSON();
      }
      var requestOpt = self._createAjaxOpt(frontia_action, {
        header: {
          authorization: _generateAuth(namespace_.getApiKey())
        },
        contentType: 'application/json'
      });

      var ajax = namespace_.ajax;
      ajax.post(ROLEUriPrefixs, JSON.stringify(body), 'json', requestOpt);
    },

    /**
     * 更新云上角色的成员
     *
     * @param {string} roleId 角色的ID
     * @param {Object} options
     * @param {ACL} [options.acl] ACL对象, 设置Role权限
     * @param {string} [options.update_type] 更新类型，包括del/add/set 角色成员
     * @param {Array} [options.accounts] 需更新的角色成员列表，由Role|User组成
     * @param {function(result)} [options.success] 保存成功后callback
     * @param {function(error, xhr)} [options.error] 保存失败后callback
     */
    update: function(roleId, options) {

      var frontia_action = {};
      frontia_action['action_name'] = 'Role.update';
      frontia_action['timestamp'] = _getTimestamp();

      var self = this;
      var type = null;
      options = options || {};
      self._configure(options);
      if (!self._checkParams([{value: roleId, type: 'string'}], 'Role update')) return;

      var body = self._attachAccount({
        method: 'modify',
        role_id: roleId
      });
      if (options.acl && (options.acl instanceof namespace_.ACL)) {
        body['_acl'] = options.acl.toJSON();
      }

      if (options.update_type === 'add') {
        type = 'push_child';
      } else if (options.update_type === 'del') {
        type = 'pull_child';
      } else if (options.update_type === 'set'){
        type = 'set_child';
      } else {
        type = null;
      }

      if (type) {
        var childs = [];
        options.accounts.forEach(function(account) {
          if (!(account instanceof namespace_.User || account instanceof namespace_.Role)) {
            throw new Error(ErrConst.INVALID_PARAMS, '[update Role]: account is invalid');
          }
          childs.push(account.getType() + ':' + account.getId());
        });
        body[type] = childs;
      }

      var requestOpt = self._createAjaxOpt(frontia_action, {
        header: {
          authorization: _generateAuth(namespace_.getApiKey())
        },
        contentType: 'application/json'
      });

      var ajax = namespace_.ajax;
      ajax.post(ROLEUriPrefixs, JSON.stringify(body), 'json', requestOpt);
    },

    /**
     * 获取云上所有角色信息
     *
     * @param {Object} options
     * @param {function(data)} [options.success] 获取成功后callback, data包括：
     *    {
     *      result: [],    // role数组
     *      count: xxx     // role数目
     *    }
     * @param {function(error, xhr)} [options.error] 获取失败后callback
     */
    list: function(options) {

      var frontia_action = {};
      frontia_action['action_name'] = 'Role.list';
      frontia_action['timestamp'] = _getTimestamp();

      var self = this;

      options = options || {};
      self._configure(options);

      var body = self._attachAccount({
        method: 'list'
      });
      var requestOpt = self._createAjaxOpt(frontia_action, {
        header: {
          authorization: _generateAuth(namespace_.getApiKey())
        },
        contentType: 'application/json'
      });

       // recreate callback
      requestOpt.callback = function(data) {
        if (data.error_code) {
          var error = new Error(data);
          self.options.error(error);
          frontia_action.err_code = error.code;
          frontia_action.err_msg = error.message;
        } else {
          var result = [];
          data.response_params.roles.forEach(function(elem) {
            var acl = new namespace_.ACL();
            if (elem._acl) {
              acl._setPermission(elem._acl);
              delete elem._acl;
            }
            var role = new namespace_.Role(elem.role_id);

            elem.child.forEach(function(child) {
              var typeAndId = child.split(':');
              if (typeAndId[0] === 'user') {
                role.add(new namespace_.User({
                  socialId: typeAndId[1]
                }));
              } else {
                role.add(new namespace_.Role(typeAndId[1]));
              }
            });
            result.push(role);
          })
          self.options.success({
            result: result,
            count: data.response_params.count
          });
          frontia_action.err_code = 0;
        }
        frontia_action.restimestamp = _getTimestamp();
        _sendPBLog(frontia_action);
      }

      var ajax = namespace_.ajax;
      ajax.post(ROLEUriPrefixs, JSON.stringify(body), 'json', requestOpt);
    },

    _attachAccount: function(body) {
       var self = this;
      var account = null;
      if (namespace_.currentAccount && namespace_.currentAccount instanceof namespace_.Role && namespace_.currentAccount.getId()) {
        account = 'requester';
        body[account] = namespace_.currentAccount.getType() + ':' + namespace_.currentAccount.getId();
      } else if (namespace_.currentAccount && namespace_.currentAccount instanceof namespace_.User && namespace_.currentAccount.getAccessToken()) {
        account = 'requester';
        body[account] = namespace_.currentAccount.getType() + ':' + namespace_.currentAccount.getAccessToken();
      }
      return body;
    },

    _createAjaxOpt: function(frontia_action, options) {
      var self = this;

      var deafaultOpt =  {
        callback: function(data) {
          if (data.error_code) {
            var error = new Error(data);
            self.options.error(error);
            frontia_action.err_code = error.code;
            frontia_action.err_msg = error.message;
          } else {
            self.options.success(data);
            frontia_action.err_code = 0;
          }
          frontia_action.restimestamp = _getTimestamp();
          _sendPBLog(frontia_action);
        },
        onerror: function(xhr, error) {
          try {
            var err_data = namespace_.util.parseJSON(xhr.responseText);
          } catch(ex) {
            self.options.error(ex, xhr);
            return;
          }
          var error = new Error(err_data);
          self.options.error(error, xhr);
          frontia_action.err_code = error.code;
          frontia_action.err_msg = error.message;
          frontia_action.restimestamp = _getTimestamp();

          _sendPBLog(frontia_action);

        }
      }
      return namespace_.util.mix(deafaultOpt, options);
    }

  }

  namespace_.util.mix(namespace_.Role, roleCloud);

  function _generateAuth(ak) {
    var base64_ak = namespace_.util.toBase64('Application:' + ak);
    return 'Basic' + ' ' + base64_ak;
  }


  namespace_.ACL = namespace_.Base.extend(/** @lends baidu.frontia.ACL.prototype*/{
    permissions: null,


    /**
     * 创建一个ACL
     *
     * @constructor
     * @name baidu.frontia.ACL
     */
    constructor: function() {
      this.permissions = {};
    },

    _setAccess: function(accessType, account, allowed) {
      if (!(account instanceof namespace_.User || account instanceof namespace_.Role)) {
        throw new Error(ErrConst.INVALID_PARAMS, '[setAccess]: account is invalid');
      }
      if (!namespace_.util.isBoolean(allowed)) {
        throw new Error(ErrConst.INVALID_PARAMS, '[setAccess]: allowed is invalid');
      }
      var uniqueAccountId = [account.getType(), ':', account.getId()].join('');
      this.permissions[uniqueAccountId] = this.permissions[uniqueAccountId] || {};
      this.permissions[uniqueAccountId][accessType] = allowed;
    },

    _isAccess: function(accessType, account) {
      if (!(account instanceof namespace_.User || account instanceof namespace_.Role)) {
        throw new Error(ErrConst.INVALID_PARAMS, '[isAccess]: account is invalid');
      }
      if (this.permissions['role:*'] && this.permissions['role:*'][accessType]) {
        return true;
      }

      var uniqueAccountId = [account.getType(), ':', account.getId()].join('');
      var permission = this.permissions[uniqueAccountId];
      if (!permission) {
        return false;
      }
      return permission[accessType];
    },

    _setPermission: function(acl) {
      this.permissions = {};
      for (var i in acl) {
        if (acl.hasOwnProperty(i)) {
          switch(acl[i]) {
            case 1:
            this.permissions[i] = this.permissions[i] || {};
            this.permissions[i]['write'] = true;
            break;
            case 2:
            this.permissions[i] = this.permissions[i] || {};
            this.permissions[i]['read'] = true;
            break;
            case 3:
            this.permissions[i] = this.permissions[i] || {};
            this.permissions[i]['write'] = true;
            this.permissions[i]['read'] = true;
            break;
            default:
          }
        }
      }
    },

    /**
     * 设置账户可读权限
     *
     * @param {Role|User} account 需设置的账户
     * @param {boolean} allowed 设置是否可读
     *
     */
    setReadAccess: function(account, allowed) {
      this._setAccess('read', account, allowed);
    },

    /**
     * 设置公共读权限
     *
     * @param {boolean} allowed 设置是否可读
     */

    setPublicReadAccess: function(allowed) {
      var account = new namespace_.Role('*');
      this._setAccess('read', account, allowed);
    },

    /**
     * 设置账户可写权限
     *
     * @param {Role|User} account 需设置的账户
     * @param {boolean} allowed 设置是否可写
     */
    setWriteAccess: function(account, allowed) {
      this._setAccess('write', account, allowed);
    },

    /**
     * 设置公共写权限
     *
     * @param {boolean} allowed 设置是否可写
     */
    setPublicWriteAccess: function(allowed) {
      var account = new namespace_.Role('*');
      this._setAccess('write', account, allowed);
    },

    /**
     * 检查账户可读权限
     * 
     * @param {Role|User} account 需检查的账户
     */
    isReadAccess: function(account) {
      this._isAccess('read', account);
    },

    /**
     * 检查账户可写权限
     * @param {Role|User} account 需检查的账户
     */
    isWriteAccess: function(account) {
      this._isAccess('write', account);
    },

    /**
     * 返回ACL信息的JSON对象
     *
     * @return {Object}
     */
    toJSON: function() {
      var acl = {};
      for(var i in this.permissions) {
        if (this.permissions.hasOwnProperty(i)) {
          var permission = this.permissions[i];
          acl[i] = (permission['read'] ? 2 : 0) + (permission['write'] ? 1 : 0);
        }
      }
      return acl;
    }
  });

  function _sendPBLog(action) {
    var frontiaClient = {
      application_info: [{
        app_frontia_version: namespace_.version,
        app_appid: namespace_.getApiKey(),
        user_id: namespace_.getCurrentAccount().getId() || '',
        frontia_action: [{
          action_name: '',
          timestamp: null,
          restimestamp: null,
          err_code: '',
          err_msg: ''
        }]
      }]
    }
    frontiaClient['application_info'][0]['frontia_action'][0] = action;
    var body = {};
    var deflate = new Zlib.Gzip(new Uint8Array(JSON.stringify(frontiaClient).split("").map(function(c) {
      return c.charCodeAt(0); })));
    var deflate_str = deflate.compress();

    body['stats'] = btoa(String.fromCharCode.apply(null, deflate_str));
    var ajax = namespace_.ajax;
    ajax.post(PBLOGUriPrefixs, JSON.stringify(body), 'json', { contentType: 'application/json'});
  }


  function _getTimestamp() {
    var timestamp = Math.floor(new Date().getTime() / 1000);
    return timestamp;
  }

})(baidu.frontia)
