baidu.frontia.storage = baidu.frontia.storage || {};

(function (namespace_) {

  var Error = namespace_.error;
  var ErrConst = namespace_.ERR_MSG;
  var BSSUriPrefixs = namespace_.DomainManager.getFrontiaDomain() + '/bss/document';
  var BCSUriPrefixs = namespace_.DomainManager.getFrontiaDomain() + '/bcs/object';
  var PBLOGUriPrefixs = namespace_.DomainManager.getPBLogDomain() + '/pushlog';


  // File类
  namespace_.File = namespace_.Object.extend(/** @lends baidu.frontia.File.prototype*/{

    /**
     * 创建一个新的File对象实例
     *
     * @name baidu.frontia.File
     * @extends baidu.frontia.Object
     * @constructor
     * @param {File} file 浏览器DOM File对象
     * @param {string} target 上传到云存储上文件名，包含全路径
     * @param {baidu.frontia.ACL} [acl] baidu.frontia.ACL对象
     */
    constructor: function(file, target, acl) {
      if (file && !(file instanceof File)) {
        throw new Error(ErrConst.INVALID_PARAMS, '[baidu.frontia.File.constructor]: file is invalid');
      }
      this.file = file;
      this.target = target;
      this.detail = null;
      namespace_.Object.prototype.constructor.call(this, acl);
    },

    /**
     * 获取具体文件信息
     *
     * @returns {Object}
     */
    getFileInfo: function() {
      return this.detail;
    },

    _getFile: function() {
      return this.file;
    },
    _getTarget:function() {
      return this.target;
    },
    _setFileInfo: function(info) {
      this.detail = info
    }
  });

 
  namespace_.Data = namespace_.Object.extend(/** @lends baidu.frontia.Data.prototype */{
    /**
     * 创建一个新的Data对象实例
     *
     * @name baidu.frontia.Data
     * @extends baidu.frontia.Object
     * @constructor
     * @param {Object} obj 结构化数据内容，与mongodb一致
     * @param {baidu.frontia.ACL} [acl] baidu.frontia.ACL对象
     */
    constructor: function(obj, acl) {
      this.obj = obj || {};
      namespace_.Object.prototype.constructor.call(this, acl);
    },

    /**
     * 获取结构化数据信息
     *
     * @returns {Object} dataInfo
     */
    getData: function() {
      return this.obj;
    }
  });

  /** @namespace baidu.frontia.storage*/
  var storage = /** @lends baidu.frontia.storage*/{
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
               if (elem.type === 'file' && !(elem.value && elem.value instanceof namespace_.File)) {
                 self.options.error(new Error(ErrConst.INVALID_PARAMS, '['+ prompt + ']: file is null or not typeof File of baidu.frontia'));
                 return false;
               }
               if (elem.type === 'string' && !(elem.value && typeof elem.value  === 'string')) {
                 self.options.error(new Error(ErrConst.INVALID_PARAMS, '['+ prompt +']: target is invalid'));
                 return false;
               }
               if (elem.type === 'array' && !(elem.value  && Object.prototype.toString.call(elem.value).slice(8, -1) === 'Array')){
                 self.options.error(new Error(ErrConst.INVALID_PARAMS, '[' + prompt + ']: targets is invalid'));
                 return false;
               }
               if (elem.type === 'query' && !(elem.value && elem.value instanceof storage.Query)) {
                self.options.error(new Error(ErrConst.INVALID_PARAMS, '['+ prompt + ']: query is invalid'));
                return false;
               }
               if (elem.type === 'data' && !(elem.value && elem.value instanceof namespace_.Data)) {
                self.options.error(new Error(ErrConst.INVALID_PARAMS, '['+ prompt +']: data is invalid'));
                return false;
               }
               return true;
             });
    },

    /**
     * 上传文件
     *
     * @param {baidu.frontia.File} file frontia提供的File对象
     * @param {Object} options
     * @param {function(result)} [options.success] 上传成功后callback
     * @param {function(error, xhr)} [options.error] 上传失败后callback
     */
    uploadFile: function(file, options) {

      var frontia_action = {};
      frontia_action['action_name'] = 'storage.uploadFile';
      frontia_action['timestamp'] = _getTimestamp();

      var self = this;

      options = options || {};
      self._configure(options);
      if (!self._checkParams([{value: file, type: 'file'}], 'storage.uploadFile')) return;

      var fileInfo = {
        file: file._getFile(),
        acl: file._getACLInfo(),
        target: file._getTarget()
      }
      var body = self._attachAccount({method: 'getuploadurl'});

      var ajax = namespace_.ajax;
      ajax.post(BCSUriPrefixs, JSON.stringify(body), 'json', {
        header: {
          authorization: _generateAuth(namespace_.getApiKey())
        },
        contentType: 'application/json',
        callback: function(data) {

          if (data.error_code) {
            self.options.error(new Error(data));
          } else {
            var url = data.response_params.url + '&dumpheader=1';

            var reader = new FileReader();
            reader.onload = function(e) {

              var fileResult = reader.result;
              ajax.put(url, fileResult, 'json', {
                contentType: 'application/octet-stream',
                callback: function(data) {
                  if (data.Error.Code !== 0) {
                    self.options.error(new Error(data.Error));
                  } else {
                    var requestOpt = self._createAjaxOpt(frontia_action, {
                      header: {
                        authorization: _generateAuth(namespace_.getApiKey())
                      },
                      contentType: 'application/json'
                    });

                    var bodyPiece = self._attachAccount({
                      method: 'create',
                      md5s: [data['Header']['Content-MD5']],
                      object: fileInfo.target,
                      _acl: fileInfo.acl
                    });
                    ajax.post(BCSUriPrefixs, JSON.stringify(bodyPiece), 'json', requestOpt);
                  }
                },
                onerror: function(xhr, error) {
                  try {
                    var err_data = JSON.parse(xhr.responseText);
                  } catch(ex) {
                    self.options.error(ex, xhr);
                    return;
                  }
                  var error = new Error(err_data.Error);
                  self.options.error(error, xhr);
                  frontia_action.err_code = error.code;
                  frontia_action.err_msg = error.message;
                  frontia_action.restimestamp = _getTimestamp();

                  _sendPBLog(frontia_action);
                }
              });
            }
            reader.readAsArrayBuffer(fileInfo.file);
          }
        },
        onerror: function(xhr, error) {
          try {
            var err_data = JSON.parse(xhr.responseText);
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
        },
      });
    },

    /**
     * 获取云存储文件URL
     * @param {string} target 云存储上文件路径
     * @param {Object} options
     * @param {function(result)} [options.success] 获取成功后callback, result为云存储文件Url
     * @param {function(error, xhr)} [options.error] 获取失败后callback
     */
    getFileUrl: function(target, options) {

      var frontia_action = {};
      frontia_action['action_name'] = 'storage.getFileUrl';
      frontia_action['timestamp'] = _getTimestamp();
      var self = this;

      options = options || {};
      self._configure(options);
      if (!self._checkParams([{value: target, type: 'string'}], 'storage.getFileUrl')) return;

      var body = self._attachAccount({method: 'getdownloadurl', object: target});
      var requestOpt = self._createAjaxOpt(frontia_action, {
        header: {
          authorization: _generateAuth(namespace_.getApiKey())
        },
        contentType: 'application/json'
      })

      var ajax = namespace_.ajax;
      ajax.post(BCSUriPrefixs, JSON.stringify(body), 'json', requestOpt);
    },

    /**
     * 删除云存储上的文件
     *
     * @param {string} target 需要删除的文件路径
     * @param {Object} options
     * @param {function(result)} [options.success] 删除成功后callback
     * @param {function(error, xhr)} [options.error] 删除失败后callback
     */
    deleteFile: function(target, options) {
      var frontia_action = {};
      frontia_action['action_name'] = 'storage.deleteFile';
      frontia_action['timestamp'] = _getTimestamp();
      var self = this;

      options = options || {};
      self._configure(options);
      if (!self._checkParams([{value: target, type: 'string'}], 'storage.deleteFile')) return;

      var body = self._attachAccount({method: 'delete', object: target});
      var requestOpt = self._createAjaxOpt(frontia_action, {
        header: {
          authorization: _generateAuth(namespace_.getApiKey())
        },
        contentType: 'application/json'
      })

      var ajax = namespace_.ajax;
      ajax.post(BCSUriPrefixs, JSON.stringify(body), 'json', requestOpt);
    },

    /**
     * 获取指定路径下的文件列表
     *
     * @param {string} target 云存储上文件路径
     * @param {Object} options
     * @param {function(data)} [options.success] 获取成功后callback, data包括：
     *    {
     *      result: [], // file数组
     *      count: xxx     // file数目
     *    }
     * @param {function(error, xhr)} [options.error] 获取失败后callback
     */
    listFile: function(target, options) {
      var frontia_action = {};
      frontia_action['action_name'] = 'storage.listFile';
      frontia_action['timestamp'] = _getTimestamp();
      var self = this;

      options = options || {};
      self._configure(options);
      if (!self._checkParams([{value: target, type: 'string'}], 'storage.listFile')) return;

      var body = self._attachAccount({method: 'list', object: target});
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
          data.response_params.object_list.forEach(function(elem) {
            var acl = new namespace_.ACL();
            if (elem._acl) {
              acl._setPermission(elem._acl);
              delete elem._acl;
            }
            var file = new namespace_.File(null, null, acl);
            file._setFileInfo(elem);
            result.push(file);
          })
          self.options.success({
            result: result,
            count: data.response_params.object_total
          });
          frontia_action.err_code = 0;
        }
        frontia_action.restimestamp = _getTimestamp();
        _sendPBLog(frontia_action);
      }


      var ajax = namespace_.ajax;
      ajax.post(BCSUriPrefixs, JSON.stringify(body), 'json', requestOpt);
    },

    /**
     * 插入数据
     *
     * @param {baidu.frontia.Data} data baidu.frontia提供的Data类型，表示需要插入的数据
     * @param {Object} options
     * @param {function(result)} [options.success] 插入成功后callback
     * @param {function(error, xhr)} [options.error] 插入失败后callback
     */
    insertData: function(data, options) {
      var frontia_action = {};
      frontia_action['action_name'] = 'storage.insertData';
      frontia_action['timestamp'] = _getTimestamp();

      options = options || {};
      this._configure(options);
      if (!this._checkParams([{value: data, type: 'data'}], 'storage.insertData')) return;
      var dataInfo = data.getData();
      var dataACL = data._getACLInfo();
      if (dataACL) {
        dataInfo['_acl'] = dataACL;
      }
      var body = this._attachAccount({method: 'insert', documents: dataInfo});

      var requestOpt = this._createAjaxOpt(frontia_action, {
        header: {
          authorization: _generateAuth(namespace_.getApiKey())
        },
        contentType: 'application/json'
      });

      var ajax = namespace_.ajax;
      ajax.post(BSSUriPrefixs, JSON.stringify(body), 'json', requestOpt);
    },

    /**
     * 删除数据
     *
     * @param {baidu.frontia.storage.Query} query 删除数据条件
     * @param {Object} options
     * @param {function(result)} [options.success] 下载成功后callback
     * @param {function(error, xhr)} [options.error] 下载失败后callback
     */
    deleteData: function(query, options) {
      var frontia_action = {};
      frontia_action['action_name'] = 'storage.deleteData';
      frontia_action['timestamp'] = _getTimestamp();
      options = options || {};
      this._configure(options);
      if (!this._checkParams([{value: query, type: 'query'}], 'storage.deleteData')) return;

      var body = this._attachAccount({method: 'remove', criteria: query.query});
      var requestOpt = this._createAjaxOpt(frontia_action, {
        header: {
          authorization: _generateAuth(namespace_.getApiKey())
        },
        contentType: 'application/json'
      });

      var ajax = namespace_.ajax;
      ajax.post(BSSUriPrefixs, JSON.stringify(body), 'json', requestOpt);

    },

    /**
     * 更新数据
     *
     * @param {Object(Query)} query 更新数据条件
     * @param {Object(Data)} data 更新数据的内容， baidu.frontia提供的Data类型，默认只更新第一条数据;如果没有任何文档匹配，则不更新
     * @param {Object} options
     * @param {function(result)} [options.success] 下载成功后callback
     * @param {function(error, xhr)} [options.error] 下载失败后callback
     */
    updateData: function(query, data, options) {
      var frontia_action = {};
      frontia_action['action_name'] = 'storage.updateData';
      frontia_action['timestamp'] = _getTimestamp();

      options = options || {};
      this._configure(options);
      if (!this._checkParams([{value: query, type: 'query'}, {value: data, type: 'data'}], 'storage.updateData')) return;
      var dataInfo = data.getData();
      var dataACL = data._getACLInfo();

      if (dataACL) {
        if (dataInfo.hasOwnProperty('$set')) {
          dataInfo['$set']['_acl'] = dataACL;
        } else {
          var tag = 0;
          for (var i in dataInfo) {
            if (dataInfo.hasOwnProperty(i)) {
              if (i[0] === '$') {
                tag = 1;
                dataInfo['$set'] = {};
                dataInfo['$set']['_acl'] = dataACL;
                break;
              }
            }
          }
          if (tag === 0) {
            dataInfo['_acl'] = dataACL;
          }
        }
      }

      var body = this._attachAccount({method: 'update', criteria: query.query, document: dataInfo});

      var requestOpt = this._createAjaxOpt(frontia_action, {
        header: {
          authorization: _generateAuth(namespace_.getApiKey())
        },
        contentType: 'application/json'
      });

      var ajax = namespace_.ajax;
      ajax.post(BSSUriPrefixs, JSON.stringify(body), 'json', requestOpt);
    },

    /**
     * 查询数据
     *
     * @param {Object(Query)} query 查询数据条件
     * @param {Object} options
     * @param {function(data)} [options.success] 下载成功后callback, data包括
     *    {
     *      result: [],    // data数组
     *      count: xxx     // data数目
     *    }
     * @param {function(error, xhr)} [options.error] 下载失败后callback
     */
    findData: function(query, options) {


      var frontia_action = {};
      frontia_action['action_name'] = 'storage.findData';
      frontia_action['timestamp'] = _getTimestamp();
      var self = this;

      options = options || {};
      this._configure(options);
      if (!this._checkParams([{value: query, type: 'query'}], 'storage.findData')) return;

      var body = this._attachAccount({method: 'query', criteria: query.query});

      var requestOpt = this._createAjaxOpt(frontia_action, {
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
          data.response_params.documents.forEach(function(elem) {
            var acl = new namespace_.ACL();
            if (elem._acl) {
              acl._setPermission(elem._acl);
              delete elem._acl;
            }
            var metaData = new namespace_.Data(elem, acl);
            result.push(metaData);
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
      ajax.post(BSSUriPrefixs, JSON.stringify(body), 'json', requestOpt);
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

  
  storage.Query = namespace_.Base.extend(/** @lends baidu.frontia.storage.Query.prototype*/{

    currentKey: null,
    query: null,

    /**
     * 创建数据查询的query
     *
     * @example <code>
     * var query = new baiduf.frontia.storage.Query();
     * query.on('user.age').lessThanEqual(50).greaterThan(20);
     * query.on('user‘).equal({foo: 'bar'});
     * </code>
     *
     * @name baidu.frontia.storage.Query
     * @constructor
     */
    constructor: function() {
    },
    _set: function(field, expression) {
        this.query = this.query || {};

        this.query[field] instanceof Object || (this.query[field] = {});
        for (var i in expression) {
          if (expression.hasOwnProperty(i)) {
            this.query[field][i] = expression[i];
          }
        }
    },
    _build: function(operator, value) {
      if (this.currentKey === null) {
        throw new Error('Query key must not be null');
      }

      switch(operator) {
        case storage.Query.EQUAL:
        this.query = this.query || {};
        this.query[this.currentKey] = value;
        break;
        case storage.Query.LESSTHAN:
        this._set(this.currentKey, {$lt: value});
        break;
        case storage.Query.LESSTHANEQUAL:
        this._set(this.currentKey, {$lte: value});
        break;
        case storage.Query.GREATERTHAN:
        this._set(this.currentKey, {$gt: value});
        break;
        case storage.Query.GREATERTHANEQUAL:
        this._set(this.currentKey, {$gte: value});
        break;

        default:
        throw new Error('Query ' + operator + ' is not supported');
      }
    },

    /**
     * 等于查询
     * @public
     * @param {Object} expected
     * @return {baidu.frontia.storage.Query}
     */
    equal: function(expected) {
      this._build(storage.Query.EQUAL, expected);
      return this;
    },

    /**
     * 小于查询
     *
     * @param {Number} value
     * @return {baidu.frontia.storage.Query}
     */
    lessThan: function(value) {
      this._build(storage.Query.LESSTHAN, value);
      return this;
    },

    /**
     * 小于等于查询
     *
     * @param {Number} value
     * @return {baidu.frontia.storage.Query}
     */
    lessThanEqual: function(value) {
      this._build(storage.Query.LESSTHANEQUAL, value);
      return this;
    },

    /**
     * 大于查询
     *
     * @param {Number} value
     * @return {baidu.frontia.storage.Query}
     */
    greaterThan: function(value) {
      this._build(storage.Query.GREATERTHAN, value);
      return this;
    },

    /**
     * 大于等于查询
     *
     * @param {Number} value
     * @return {baidu.frontia.storage.Query}
     */
    greaterThanEqual: function(value) {
      this._build(storage.Query.GREATERTHANEQUAL, value);
      return this;
    },

    /**
     * 设定需查询数据field
     *
     * @param {string} key
     * @return {baidu.frontia.storage.Query}
     */
    on: function(key) {
      this.currentKey = key;
      return this;
    }
  }, {
    EQUAL: 1,
    LESSTHAN: 2,
    LESSTHANEQUAL: 3,
    GREATERTHAN: 4,
    GREATERTHANEQUAL: 5
  });

  function _generateAuth(ak) {
    var base64_ak = namespace_.util.toBase64('Application:' + ak);
    return 'Basic' + ' ' + base64_ak;
  }
  function _isEmptyObj(obj) {
    for (var i in obj) return false;
    return true;
  }

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

  namespace_.storage = storage;

})(baidu.frontia)
