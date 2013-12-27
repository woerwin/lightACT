
baidu.frontia.personalStorage = baidu.frontia.personalStorage || {};

(function(namespace_){

  var Error = baidu.frontia.error;
  var ErrConst = baidu.frontia.ERR_MSG;
  var PCSUriPrefixs = namespace_.DomainManager.getPCSDomain() + '/rest/2.0/pcs/';
  var PBLOGUriPrefixs = namespace_.DomainManager.getPBLogDomain() + '/pushlog';
  var apiKey = namespace_.apiKey;
  var personalStorage = {}
  
  /** @namespace baidu.frontia.personalStorage */
  personalStorage = /** @lends baidu.frontia.personalStorage*/{

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

      /*
      if (!accessToken) {
          self.options.error(new Error(ErrConst.INVALID_PARAMS, '[' + prompt + ']: accessToken is invaild'));
          return false;
      }
      */

      return params.every(function(elem) {
        if (elem.type === 'file' && !(elem.value && elem.value instanceof File)) {
          self.options.error(new Error(ErrConst.INVALID_PARAMS, '['+ prompt + ']: file is null or not typeof File of DOM'));
          return false;
        }
        if (elem.type === 'string' && !(elem.value && typeof elem.value  === 'string')) {
          self.options.error(new Error(ErrConst.INVALID_PARAMS, '['+ prompt +']: target is invalid'));
          return false;
        }
        if ( elem.type === 'array' && !(elem.value  && Object.prototype.toString.call(elem.value).slice(8, -1) === 'Array')){
          self.options.error(new Error(ErrConst.INVALID_PARAMS, '[' + prompt + ']: targets is invalid'));
          return false;
        }
        return true;
      });
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
    },


    /**
     * 上传文件
     *
     * @param {Object(window.File)} file 本地浏览器DOM的file对象
     * @param {string} target 上传到云存储上文件名，包含全路径
     * @param {Object} options
     * @param {string(personalStorage.Constant)} [options.ondup] 如果ondup值为constant.ONDUP_OVERWRITE,表示同名覆盖; 为constant.ONDUP_NEWCOPY, 表示生成文件副本并进行重命名，命名规则为“文件名_日期.后缀”
     * @param {function(result)} [options.success] 上传成功后callback
     * @param {function(error, xhr)} [options.error] 上传失败后callback
     */
    uploadFile: function(file, target, options) {
      var frontia_action = {};
      frontia_action['action_name'] = 'personalStorage.uploadFile';
      frontia_action['timestamp'] = _getTimestamp();

      var self = this;
    
      options = options || {};
      self._configure(options);
      if (!self._checkParams([{value: file, type: 'file'}, {value: target, type: 'string'}], 'personalStorage.uploadFile')) return;

      options.method = 'upload';
      
      var access_token = '';
      var currentAccount = namespace_.getCurrentAccount();
      if (currentAccount) {
        accessToken = currentAccount.getAccessToken();
      }

      options.access_token = accessToken;
      var request = _createRequest(target, options, ['success', 'error']);
      var url = _generatePCSUrl('file?', request.query);

      var ajaxOpt = self._createAjaxOpt(frontia_action, {
        contentType: 'multipart/form-data'
      });

      var ajax = namespace_.ajax;
      var formData = new FormData();
      formData.append('baidu_frontia_file', file);
      ajax.post(url, formData, 'json', ajaxOpt);
    },

    /**
     * 获取云存储文件URL
     *
     * @param {string} target 云存储上文件路径
     * @param {Object} options
     * @param {function(result)} [options.success] 下载成功后callback, result为云存储文件Url
     * @param {function(error, xhr)} [options.error] 下载失败后callback
     */
    getFileUrl: function(target, options) {
      var frontia_action = {};
      frontia_action['action_name'] = 'personalStorage.getFileUrl';
      frontia_action['timestamp'] = _getTimestamp();

      var self = this;

      options = options || {};
      self._configure(options);
      if (!self._checkParams([{value: target, type: 'string'}], 'personalStorage.getFileUrl')) return;

      var access_token = '';
      var currentAccount = namespace_.getCurrentAccount();
      if (currentAccount) {
        accessToken = currentAccount.getAccessToken();
      }
      options.access_token = accessToken;

      options.method = 'download';
      var request = _createRequest(target, options, ['success', 'error']);
      var download_url = _generatePCSUrl('file?', request.query);

      options.method = 'meta';
      request = _createRequest(target, options, ['success', 'error']);
      var meta_url = _generatePCSUrl('file?', request.query);

      var ajaxOpt =  {
        callback: function(data) {
          if (data.error_code) {
            var error = new Error(data);
            self.options.error(error);
            frontia_action.err_code = error.code;
            frontia_action.err_msg = error.message;
          } else {
            self.options.success(download_url);
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
        },
        dataType: 'json'
      }

      var ajax = namespace_.ajax;
      ajax.get(meta_url, {}, ajaxOpt);
    },

    /**
     * 删除目录或文件
     *
     * @param {Array} targets 需要删除的文件或目录数组，targets.length长度大于等于1
     * @param {Object} options
     * @param {function(result)} [options.success] 删除成功后callback
     * @param {function(error, xhr)} [options.error] 删除失败后callback
     */
    deleteFile: function(targets, options) {
      var frontia_action = {};
      frontia_action['action_name'] = 'personalStorage.deleteFile';
      frontia_action['timestamp'] = _getTimestamp();

      var self = this;

      options = options || {};
      self._configure(options);
      if (!self._checkParams([{value: targets, type: 'array'}], 'personalStorage.deleteFile')) return;

      options.method = 'delete';
      var access_token = '';
      var currentAccount = namespace_.getCurrentAccount();
      if (currentAccount) {
        accessToken = currentAccount.getAccessToken();
      }
      options.access_token = accessToken;
      var request = _createRequest(targets, options, ['success', 'error']);
      var url = _generatePCSUrl('file?', request.query);

      var ajaxOpt = self._createAjaxOpt(frontia_action);

      var ajax = namespace_.ajax;
      ajax.post(url, {param:request.body}, 'json', ajaxOpt);
    },

    /**
     * 获取指定路径下的文件列表
     *
     * @param {string} target 云存储上文件路径
     * @param {Object} options
     * @param {Number} [options.limit] 返回条目控制，参数格式为：n1-n2. 返回结果集的[n1, n2)之间的条目，缺省返回所有条目；n1从0开始
     * @param {string(personalStorage.constant)} [options.by] 返回列表按指定type排序，包括time(修改时间)/name(文件名)/size(注意文件名没有大小)，默认按类型排序. 取值类型：constant.BY_TIME/constant.BY_NAME/constant.BY_SIZE
     * @param {string(personalStorage.constant)} [options.order] 返回列表的是升序/降序排列，默认是降序. 取值类型：constant.ORDER_ASC/constant.ORDER_DESC
     * @param {function(result)} [options.success] 下载成功后callback
     * @param {function(error, xhr)} [options.error] 下载失败后callback
     */
    listFile: function(target, options) {
      var frontia_action = {};
      frontia_action['action_name'] = 'personalStorage.listFile';
      frontia_action['timestamp'] = _getTimestamp();
      var self = this;

      options = options || {};
      self._configure(options);
      if (!self._checkParams([{value: target, type: 'string'}], 'personalStorage.listFile')) return;

      options.method = 'list';
      var access_token = '';
      var currentAccount = namespace_.getCurrentAccount();
      if (currentAccount) {
        accessToken = currentAccount.getAccessToken();
      }
      options.access_token = accessToken;
      var request = _createRequest(target, options, ['success', 'error']);
      var url = _generatePCSUrl('file?', request.query);

      var ajaxOpt = self._createAjaxOpt(frontia_action, {
        dataType: 'json'
      });

      var ajax = namespace_.ajax;
      ajax.get(url, {}, ajaxOpt);
    },

    /**
     * 获取所有的流式文件列表，包括视频、音频、图片及文档四种类型的视图
     *
     * @param {Object} options
     * @param {Number} [options.start] 返回列表的起始位置, 默认为0
     * @param {Number} [options.limit] 返回列表的数目, 默认为1000
     * @param {Number} [options.filter_path] 需过滤的前缀路径, 即不会列出该路径下的文件
     * @param {string(personalStorage.constant)} options.type 返回列表的类型，包括video(视频)/audio(音频)/image(图片)/doc(文档) 4种类型. 取值类型：constant.TYPE_STREAM_VIDEO/constant.TYPE_STREAM_AUDIO/constant.TYPE_STREAM_IMAGE/constant.TYPE_STREAM_DOC
     * @param {function(result)} [options.success] 获取成功后callback
     * @param {function(error, xhr)} [options.error] 获取失败后callback
     */
    listStreamFile: function(options) {
      var frontia_action = {};
      frontia_action['action_name'] = 'personalStorage.listStreamFile';
      frontia_action['timestamp'] = _getTimestamp();
      var self = this;

      options = options || {};
      self._configure(options);

      options.method = 'list';
      var access_token = '';
      var currentAccount = namespace_.getCurrentAccount();
      if (currentAccount) {
        accessToken = currentAccount.getAccessToken();
      }
      options.access_token = accessToken;
      var request = _createRequest(null, options, ['success', 'error']);
      if (options.filter_path) {
        request.query.filter_path = options.filter_path;
      } 
      
      var url = _generatePCSUrl('stream?', request.query);

      var ajaxOpt = self._createAjaxOpt(frontia_action, {
        dataType: 'json'
      });

      var ajax = namespace_.ajax;
      ajax.get(url, {}, ajaxOpt);
    },

    /**
     * 创建目录
     *
     * @param {string} target 待创建云存储上的目录路径
     * @param {Object} options
     * @param {function(result)} [options.success] 下载成功后callback, result为云存储文件Url
     * @param {function(error, xhr)} [options.error] 下载失败后callback
     */
    makeDir: function(target, options) {
      var frontia_action = {};
      frontia_action['action_name'] = 'personalStorage.makeDir';
      frontia_action['timestamp'] = _getTimestamp();
      var self = this;

      options = options || {};
      self._configure(options);
      if (!self._checkParams([{value: target, type: 'string'}], 'personalStorage.makeDir')) return;

      options.method = 'mkdir';
      var access_token = '';
      var currentAccount = namespace_.getCurrentAccount();
      if (currentAccount) {
        accessToken = currentAccount.getAccessToken();
      }
      options.access_token = accessToken;
      var request = _createRequest(target, options, ['success', 'error']);
      var url = _generatePCSUrl('file?', request.query);

      var ajaxOpt = self._createAjaxOpt({
        dataType: 'json'
      });

      var ajax = namespace_.ajax;
      ajax.post(url, {}, 'json', ajaxOpt);
    },

    /**
     * 获取当前用户空间配额信息
     *
     * @param {Object} options
     * @param {function(result)} [options.success] 下载成功后callback, result为云存储文件Url
     * @param {function(error, xhr)} [options.error] 下载失败后callback
     */
    getQuota: function(options) {
      var frontia_action = {};
      frontia_action['action_name'] = 'personalStorage.getQuota';
      frontia_action['timestamp'] = _getTimestamp();
      var self = this;

      options = options || {};
      self._configure(options);
      if (!self._checkParams([], 'psersonalStorage.getQuota')) return;

      options.method = 'info';
      var access_token = '';
      var currentAccount = namespace_.getCurrentAccount();
      if (currentAccount) {
        accessToken = currentAccount.getAccessToken();
      }
      options.access_token = accessToken;
      var request = _createRequest(null, options, ['success', 'error']);
      var url = _generatePCSUrl('quota?', request.query);

      var ajaxOpt = self._createAjaxOpt(frontia_action, {
        dataType: 'json'
      });

      var ajax = namespace_.ajax;
      ajax.get(url, {}, ajaxOpt);
    }
  }

  /**
   * personalStorage常量
   * 
   * @name baidu.frontia.personalStorage.constant
   * @property {string} ONDUP_OVERWRITE 覆盖当前同名文件
   * @property {string} ONDUP_NEWCOPY 新建一份拷贝
   * @property {string} BY_NAME 名字排序
   * @property {string} BY_TIME 时间排序
   * @property {string} BY_SIZE 大小排序
   * @property {string} ORDER_ASC 升序
   * @property {string} ORDER_DESC 降序
   * @property {string} TYPE_STREAM_VIDEO 视频
   * @property {string} TYPE_STREAM_AUDIO 音频
   * @property {string} TYPE_STREAM_IMAGE 图像
   * @property {string} TYPE_STREAM_DOC 文档
   */
   personalStorage.constant = /** @lends baidu.frontia.personalStorage.constant */{

     ONDUP_OVERWRITE: 'overwrite',
     ONDUP_NEWCOPY: 'newcopy',
     BY_NAME: 'name',
     BY_TIME: 'time',
     BY_SIZE: 'size',
     ORDER_ASC: 'asc',
     ORDER_DESC: 'desc',
     TYPE_STREAM_VIDEO: 'video',
     TYPE_STREAM_AUDIO: 'audio',
     TYPE_STREAM_IMAGE: 'image',
     TYPE_STREAM_DOC: 'doc'
  };

  function _generateAuth(ak) {
    var base64_ak = namespace_.util.toBase64('Application:' + ak);
    return 'Basic' + ' ' + base64_ak;
  }

  function _createRequest(target, options, except) {
    var opt = {}, i;
    var path = null;
    var data = null;
    options = options || {};

    if (typeof target === 'string') {
      path = target.slice(0, 1) === '/' ? target : '/'.concat(target);
      opt.path = path;
    } else if (!target) {
      // do nothing

    } else {
      data = {list:[]};
      target.forEach(function(ele) {
        path = ele.slice(0, 1) === '/' ? ele : '/'.concat(ele);
        data.list.push({path: path});
      })
      data = JSON.stringify(data);
    }

    for(i in options) {
      if (options.hasOwnProperty(i) && except.indexOf(i) === -1) {
        opt[i] = options[i];
      }
    }
    return {query: opt, body: data};
  }

  function _generatePCSUrl(op, options) {
    var url = [PCSUriPrefixs, op, namespace_.util.serializeURL(options)].join('');
    return url;
  }

  function _generateMCSUrl(op, options) {
    var url = [MCSUriPrefixs, op, namespace_.util.serializeURL(options)].join('');
    return url;
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
  
  namespace_.personalStorage = personalStorage;
})(baidu.frontia);