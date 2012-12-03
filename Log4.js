/* Log4.js an implementation of Log for javascript
 * version: 0.1
 * By Ali Najafizadeh, http://morezilla.net
 * MIT Licensed.
 */
(function(win) {
    var Log4js = {},
        _debug = false,
        _info = true,
        _error = false;

    function Logger(name) {
        this.name = name;
        this.appenders = [];
        this._debug = null;
        this._info = null;
        this._error = null;
    }
    Logger.prototype.addAppender = function(appender){
        this.appenders.push(appender);
    };
    Logger.prototype.log = function(lvl, log) {
        for(var i = 0; i < this.appenders.length; i++) {
            this.appenders[i].log(this.name, lvl, log);
        }
    };
    Logger.prototype.info = function(log) {
        if(this._info === true || (this._info === null && _info)) {
            this.log('INFO', log);
        }
    };
    Logger.prototype.debug = function(log) {
        if(this._debug === true || (this._debug === null && _debug)) {
            this.log('DEBUG', log);
        }
    };
    Logger.prototype.error = function(log) {
        if(this._error === true || (this._error === null && _error)) {
            this.log('ERROR', log);
        }
    };
    Logger.prototype.setLevel = function(options) {
        this._debug = (options.debug)? options.debug : this._debug;
        this._info = (options.info)? options.info : this._info;
        this._error = (options.error)? options.error : this._error;
    };

    function DefaultFormatter() {}
    DefaultFormatter.prototype.format = function(name, lvl, log) {
        if(typeof log === 'object' || typeof log === 'array') {
            log = JSON.stringify(log);
        }
        return lvl + ' [' + name + ']: ' +  log;
    };

    function FrameAppender(formatter) {
        this.formatter = formatter || new DefaultFormatter();
    }
    FrameAppender.prototype.log = function(name, lvl, log) {
        var output = this.formatter.format(name, lvl, log);
        parent.postMessage(output, '*');
    };

    function AlertAppender(formatter) {
        this.formatter = formatter || new DefaultFormatter();
    }
    AlertAppender.prototype.log = function(name, lvl, log) {
        var output = this.formatter.format(name, lvl, log);
        alert(output);
    };

    function ConsoleAppender(formatter) {
        this.formatter = formatter || new DefaultFormatter();
    }
    ConsoleAppender.prototype.log = function(name, lvl, log) {
        var output = this.formatter.format(name, lvl, log);
        if(console && console.log) {
            console.log(output);
        }
    };

    function AjaxAppender(formatter) {
        this.formatter = formatter || new DefaultFormatter();
    }
    AjaxAppender.prototype.log = function(name, lvl, log) {
        var output = this.formatter.format(name, lvl, log);
        AjaxAppender._cache.push({messgae: output, url: this.url});
        if(AjaxAppender._ajax === null) {
            AjaxAppender.process();
        }
    };
    AjaxAppender._cache = [];
    AjaxAppender._ajax = null;
    AjaxAppender.process = function() {
        var that = this;
        if(AjaxAppender._cache.length > 0) {
            var data = AjaxAppender._cache.shift();
            AjaxAppender._ajax = AjaxAppender.ajaxEngine({
                url: data.url,
                type: 'POST',
                data: data.message,
                success: function() {
                    that.process();
                }
            });
        } else {
            AjaxAppender._ajax = null;
        }
    };
    AjaxAppender.ajaxEngine = function (options) {
        var xmlHttpReq = false;
        var self = this;
        if (window.XMLHttpRequest) {
            self.xmlHttpReq = new XMLHttpRequest();
        }
        if(self.xmlHttpReq === false) return;
        self.xmlHttpReq.open('POST', options.url, true);
        self.xmlHttpReq.setRequestHeader('Content-Type', 'application/json');
        self.xmlHttpReq.onreadystatechange = function() {
            if(this.status == 200 && this.readyState == 4) {
                //call the callback just to make sure that we are not running callback recursivly.
                setTimeout(function() { options.done(); }, 13);
            }
        };
        self.xmlHttpReq.send(options.data);
        return xmlHttpReq;
    };

    function initLogger(appender) {
        var that = this;
        return function(name) {
            var logger = new Logger(name);
            logger.addAppender(new that.Appender[appender]());
            return logger;
        };
    }

    Log4js.Appender = {
        Console: ConsoleAppender,
        Alert: AlertAppender,
        Frame: FrameAppender,
        Ajax: AjaxAppender
    };
    Log4js.getLogger = function(name) { return new Logger(name); };
    Log4js.getConsoleLogger = initLogger.call(Log4js, 'Console');
    Log4js.getAlertLogger = initLogger.call(Log4js, 'Alert');
    Log4js.getFrameLogger = initLogger.call(Log4js, 'Frame');
    Log4js.getAjaxLogger = initLogger.call(Log4js, 'Ajax');
    Log4js.setLevel = function(options) {
        _debug = (options.debug)? options.debug : this._debug;
        _info = (options.info)? options.info : this._info;
        _error = (options.error)? options.error : this._error;
    };

    win.Log4js = Log4js;
})(window);