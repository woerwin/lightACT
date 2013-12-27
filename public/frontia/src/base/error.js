/*
 * Error defination
 */

baidu.frontia.error = baidu.frontia.error || {};
(function(namespace_) {
    
  baidu.frontia.error = function(errType, prompt) {
    prompt = prompt || 'error';
    this.code = errType.error_code || errType.Code;
    this.message = errType.error_msg || errType.Message;
    this.message += ' [' + prompt + ']'; 
  };

  baidu.frontia.ERR_MSG = {
    NO_AK:              {error_code: -1, error_msg: 'No AK found, please config AK by calling BaiduFrontia.init(yourak) at first'},
    INVALID_AK:         {error_code: -1, error_msg: 'Invalid AK'},
    INVALID_PARAMS:     {error_code: -1, error_msg: 'Invalid params'},
    INVALID_RES_TYPE:   {error_code: -1, error_msg: 'Invalid params: response_type'},
    INVALID_MEDIA_TYPE: {error_code: -1, error_msg: 'Invalid params: media_type'}
  }

})(baidu.frontia);
