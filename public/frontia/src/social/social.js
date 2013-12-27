

baidu.frontia.social = baidu.frontia.social || {};
(function(namespace_) {

  var Error = namespace_.error;
  var SOCIAL_AUTH_URL_PREFIX = namespace_.DomainManager.getSocialDomain() + '/social/oauth/2.0/authorize';
  var SOCAIL_GET_INFO_URL_PREFIX = namespace_.DomainManager.getSocialDomain() + '/social/api/2.0/user/info';
  var PBLOGUriPrefixs = namespace_.DomainManager.getPBLogDomain() + '/pushlog';
  var USERUriPrefixs = namespace_.DomainManager.getFrontiaDomain() + '/user';
  /**
   * Indicates the way of grant
   *
   * @constant
   */
  var RESPONSE_TYPE = {
    /* Implicit grant */
    TOKEN: 'token',
    /* Authorization code */
    CODE: 'code'
  };

  /**
   * Encode URL
   */
  function urlencode (str) {
    return encodeURIComponent(str + '');
  }

  /**
   * URL generator
   */
  function buildURL(ak, res_type, media_type, redirect_uri, state, display, client_type, scope) {

    var url = SOCIAL_AUTH_URL_PREFIX + '?' +
          'response_type=' + res_type + '&' +
          'client_id=' + ak + '&' +
          'media_type=' + media_type + '&' +
          'redirect_uri=' + urlencode(redirect_uri);

    if (state) {
      url += '&state=' + state;
    }
    if (display) {
      url += '&display=' + display;
    }
    if (client_type) {
      url += '&client_type=' + client_type;
    }
    if (scope) {
      url +='&scope=' + scope;
    }

    return url + '&secure=1';
  }

  /**
   * Build Auth URL: Authorization code
   */
  function getAuthURL(option) {
    var apiKey = namespace_.getApiKey();
    var url = buildURL(apiKey, option.response_type, option.media_type,
                       option.redirect_uri, option.state, option.display, option.client_type, option.scope);
    return url;
  }

  function getAccessTokenFromHash () {
    var lochash = location.hash;
    function getAuthRetParams() {
      var paramsObj = {};
      if (lochash) {
        var startIndex = lochash.indexOf('#');
        if (startIndex !== -1) {
          var subStr = lochash.slice(startIndex + 1);
          if (subStr) {
            var params = subStr.split('&');
            params.forEach(function(elem) {
              var elems = elem.split('=');
              paramsObj[elems[0]] = elems[1];
            })
          }
        }
      }
      return paramsObj;
    }

    var retObj = getAuthRetParams();
    return {
      'access_token': retObj['access_token'],
      'expires_in': retObj['expires_in'],
      'media_type': retObj['media_type']
    }

  }

  /** @namespace baidu.frontia.social*/
  var social = /** @lends baidu.frontia.social*/{
    /**
     * 设置社会化登录后的回调函数, 登录后会自动将当前用户设置为social登录帐户
     * @param {Object} options
     * @param {function(result)} [options.success] 登录成功后callback, result为User对象
     * @param {function(error, xhr)} [options.error] 登录失败后callback
     */
    setLoginCallback: function (options) {
      var retAuthObj = getAccessTokenFromHash();
      if (!(namespace_.getCurrentAccount()) && retAuthObj['access_token'] && options) {
        var frontia_action = {};
        frontia_action['action_name'] = 'social.login';
        frontia_action['timestamp'] = _getTimestamp();

        options.success || (options.success = function(){});
        options.error || (options.error = function(){});

        namespace_.jsonp.get(SOCAIL_GET_INFO_URL_PREFIX, { access_token: retAuthObj['access_token'] }, function(data){
          if (data.error_code) {
            var error = new Error(data);
            options.error(error);
            frontia_action.err_code = error.code;
            frontia_action.err_msg = error.message;
          } else {
            var user = new namespace_.User({
              socialId: data['social_uid'],
              name: data['username'],
              accessToken: retAuthObj['access_token'],
              expiresIn: retAuthObj['expires_in'],
              mediaType: retAuthObj['media_type']
            });

            namespace_.setCurrentAccount(user);

            var body = _attachAccount({method: 'register'});
            var ajaxOpt = {
              header: {
              authorization: _generateAuth(namespace_.getApiKey())
            },
            contentType: 'application/json'
          }
          var ajax = namespace_.ajax;
          ajax.post(USERUriPrefixs, JSON.stringify(body), 'json', ajaxOpt);

          options.success(user);
          frontia_action.err_code = 0;
        }
          frontia_action.restimestamp = _getTimestamp();
          _sendPBLog(frontia_action);
        }, function(ex){
           });
      }
    },

  /**
   * social登录函数
   *
   * @param {Object} options
   * @param {string} options.response_type 目前只支持token
   * @param {string} options.media_type 媒体类型，支持baidu/sinaweibo/qqweibo/qqdenglu/kaixin
   * @param {string(url)} options.redirect_uri 登录成功后的重定向网址
   * @param {string} [options.client_type] 登录端类型，支持web
   */
    login: function(options) {
      namespace_.logOutCurrentAccount();

      if (!options) {
        throw new baidu.frontia.error(baidu.frontia.ERR_MSG.INVALID_PARAMS);
      }
      options.error = options.error || function () {};

      if (!options.response_type) {
        throw new baidu.frontia.error(baidu.frontia.ERR_MSG.INVALID_PARAMS);
      }
      if (!options.media_type) {
        throw new baidu.frontia.error(baidu.frontia.ERR_MSG.INVALID_PARAMS);
      }

      if (options.response_type != RESPONSE_TYPE.TOKEN) {
        throw new baidu.frontia.error(baidu.frontia.ERR_MSG.INVALID_PARAMS);
      } else {
        var url = getAuthURL(options);
        location.href = url;
      }
    }
  }

  function _attachAccount(body) {
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

  namespace_.social = social;
})(baidu.frontia);
