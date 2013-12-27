/**
 * baidu push sdk
 * @author zhangyaodong@baidu.com
 */


baidu.frontia.store = baidu.frontia.store || {};

(function(namespace_){

  var Error = namespace_.error;
  var ErrConst = namespace_.ERR_MSG;
  var PUSHUriPrefixs = namespace_.DomainManager.getFrontiaDomain() + '/push';
  var PBLOGUriPrefixs = namespace_.DomainManager.getPBLogDomain() + '/pushlog';
  
  /** @namespace baidu.frontia.Push*/
  var Push = /** @lends baidu.frontia.Push*/{
    options: {
      error: function(){},
      success: function(){}
    },

    _configure: function(options) {
      options = options || {};
      options.error && (this.options.error = options.error);
      options.success && (this.options.success = options.success);
    },


    /**
     * 消息推送
     *
     * @param {Object} data 需要发送的数据
     * @param {String} data.messages 指定消息内容，单个消息为单独字符串。如果有二进制的消息内容，请先做 BASE64 的编码。
     * @param {String} data.msg_keys 消息标识。指定消息标识，必须和messages一一对应。相同消息标识的消息会自动覆盖
     * @param {Object} options
     * @param {Number} options.push_type 推送类型，取值范围为：1～3
     *    <ol>
     *    1:单个人，必须指定user_id 和 channel_id （指定用户的指定设备）或者user_id（指定用户的所有设备）</br>
     *    2:一群人，必须指定 tag </br>
     *    3:所有人，无需指定tag、user_id、channel_id </br>
     *    </ol>
     * @param {String} [options.user_id] 用户标识，在Android里，channel_id + userid指定某一个特定client。不超过256字节，如果存在此字段，则只推送给此用户。
     * @param {String} [options.tag] 标签名称，不超过128字节
     * @param {Number} [options.channel_id] 通道标识
     * @param {Number} [options.device_type] 设备类型，取值范围为：1～5
     * @param {Number} [options.message_type] 消息类型
     *    <ol>
     *      0：消息（透传给应用的消息体） </br>
     *      1：通知（对应设备上的消息通知）</br>
     *      默认值为0。通知消息格式见example</br>
     *    </ol>
     * @example
     *    通知消息格式及默认值：
     *    <code>
     *    {
     *      // 必选字段
     *      "title" : "hello" ,   
     *      "description": "hello world",
     *
     *      //自定义字段
     *      "custom_content": {
     *        "key1":"value1", 
     *        "key2":"value2"
     *      },  
     * 
     *      //android特有字段，
     *      "android": {"notification_builder_id": 0,
     *        "notification_basic_style": 7,
     *        "open_type":0,
     *        "net_support" : 1,
     *        "user_confirm": 0,
     *        "url": "http://developer.baidu.com",
     *        "pkg_content":"",
     *        "pkg_name" : "com.baidu.bccsclient",
     *        "pkg_version":"0.1",
     *      },
     *
     *      //ios特有字段，
     *      "aps": {
     *        "alert":"Message From Baidu Push",
     *        "Sound":"",
     *        "Badge":0
     *      } 
     *    }
     *    </code>
     * @param {Number} [options.message_expires] 指定消息的过期时间，默认为86400秒。必须和messages一一对应
     * @param {function(result)} [options.success] 删除成功后callback
     * @param {function(error, xhr)} [options.error] 删除失败后callback
     */
    send: function(data, options) {

      var frontia_action = {};
      frontia_action['action_name'] = 'Push.list';
      frontia_action['timestamp'] = _getTimestamp();
      var self = this;

      options = options || {};
      self._configure(options);
      var url = PUSHUriPrefixs;
      var body = {
        method: 'pushmsg',
        messages: data.messages,
        msg_keys: data.msg_keys
      }

      for (var i in options) {
        if (options.hasOwnProperty(i) && (i !== 'success') && (i !== 'error')) {
          body[i] = options[i];
        }
      }

      var requestOpt = self._createAjaxOpt({
        header: {
          authorization: _generateAuth(namespace_.getApiKey())
        },
        contentType: 'application/json'
      })

      var ajax = namespace_.ajax;
      ajax.post(url, JSON.stringify(body), 'json', requestOpt);
    },

    _createAjaxOpt: function(options) {
      var self = this;

      var deafaultOpt =  {
        callback: function(data) {
          if (data.error_code) {
            self.options.error(new Error(data));
          } else if (data && data.error_code) {
            self.options.error(new Error(data));
          } else {
            self.options.success(data);
          }
        },
        onerror: function(xhr, error) {
          try {
            var err_data = namespace_.util.parseJSON(xhr.responseText);
          } catch(ex) {
            self.options.error(ex, xhr);
            return;
          }
          self.options.error(new Error(err_data), xhr);
        }
      }
      return namespace_.util.mix(deafaultOpt, options);
    }
  }

  function _generateAuth(ak) {
    var base64_ak = namespace_.util.toBase64('Application:' + ak);
    return 'Basic' + ' ' + base64_ak;
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

  namespace_.Push = Push;

})(baidu.frontia);