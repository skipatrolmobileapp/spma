/*jshint strict: true */
/*jshint unused: false */
/*jslint node: true */
/*jslint indent: 4 */
/*jslint unparam:true*/
/*global console, setTimeout, device, onDeviceReady, window, navigator, localStorage, document, Date, ons, module, angular, spinnerModal, moment */
"use strict";

/*
Ski Patrol Mobile App
Copyright © 2014-2015, Gary Meyer.
All rights reserved.
*/

/*
Some globals. Not too many though.
*/
var IN_CORDOVA = false, // Indicator if in Cordova. Assume not.
    havingPatience = false, // Indicates whether or not the user is waiting and watching the spinner.
    DSP_BASE_URL = 'https://api-skipatrol.rhcloud.com:443', // Base URL of the DreamFactory Service Platform (DSP) instance.
    DSP_HOST = 'api-skipatrol.rhcloud.com', // Host name of the DreamFactory Service Platform (DSP) instance.
    DSP_PORT = '443', // Port of the DreamFactory Service Platform (DSP) instance.
    DSP_APP_NAME = 'skipatrolmobileapp', // Suffix for appending after the the DSP API request indicating the application name.
    requestMap = {}; // A map of requests for knowing when the data was last requested so that periodic cache refreshes can be done.

/*
Let iOS status bar fully appear.
TODO: Perhaps there's a way to get the ons-toolbar to display smartly on the iPhone.
*/
ons.disableAutoStatusBarFill();

/*
Initialize Cordova.
*/
document.addEventListener("deviceready", onDeviceReady, false);

/*
Mind the gap, that is the PhoneGap. Or Cordova if you'd prefer.
*/
function onDeviceReady() {
    IN_CORDOVA = true;
}

/*
Initialize Onsen UI and ngTouch.
*/
var module = ons.bootstrap('myApp', ['onsen', 'ngTouch']);

angular.module('myApp')
  .directive('myFocus', function () {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        if (attrs.myFocus == "") {
          attrs.myFocus = "focusElement";
        }
        scope.$watch(attrs.myFocus, function(value) {
          if(value == attrs.id) {
            element[0].focus();
          }
        });
        element.on("blur", function() {
          scope[attrs.myFocus] = "";
          scope.$apply();
        })        
      }
    };
  });


/*
Have patience and watch the spinner for a bit. Sorry buddy.
*/
function havePatience($rootScope) {
    if (!havingPatience) {
        havingPatience = true;
        $rootScope.spinnerUpdate = '';
        spinnerModal.show();
        setTimeout(function () {
            $rootScope.spinnerUpdate = 'Accessing server.';
        }, 3000);
        setTimeout(function () {
            $rootScope.spinnerUpdate = 'Accessing server...';
        }, 6000);
        setTimeout(function () {
            havingPatience = false;
            spinnerModal.hide();
        }, 9000);
    }
}

/*
Wait no more! Put the spinner away.
*/
function waitNoMore() {
    havingPatience = false;
    spinnerModal.hide();
}

/*
Log an event to the browser console.
*/
function browserLogEvent(level, event, $log) {
    switch (level) {
    case 'error':
        $log.error(event);
        break;
    case 'warn':
        $log.warn(event);
        break;
    case 'info':
        $log.info(event);
        break;
    case 'debug':
        $log.debug(event);
        break;
    default:
        $log.log(event);
    }
}

/*
Log data to the browser console.
*/
function browserLogData(level, data, $log) {
    var json = angular.toJson(data);
    if (data) {
        if (json) {
            switch (level) {
            case 'error':
                $log.error(json);
                break;
            case 'warn':
                $log.warn(json);
                break;
            case 'info':
                $log.info(json);
                break;
            case 'debug':
                $log.debug(json);
                break;
            default:
                $log.log(json);
            }
        } else {
            switch (level) {
            case 'error':
                $log.error(data);
                break;
            case 'warn':
                $log.warn(data);
                break;
            case 'info':
                $log.info(data);
                break;
            default:
                break;
            }
        }
    }
}

/*
Send a log event to the server.
Note the SPMA 'app' attribute.
*/
function serverLog(level, event, data, $http) {
    var accessLogData = {
            'user': localStorage.getItem('DspEmail'),
            'patrolPrefix': localStorage.getItem('DspPatrolPrefix'),
            'device': navigator.userAgent,
            'at': new Date(),
            'app': settingLoggingAppId,
            'event': event,
            'level': level,
            'json': angular.toJson(data)
        };
    if (-1 === document.URL.indexOf('http://') && -1 === document.URL.indexOf('https://')) {
        if (IN_CORDOVA) {
            accessLogData.device = device.platform + '/' + device.version + '/' + device.model;
        } else {
            accessLogData.device = 'Native/unknown';
        }
    }
    $http(dspRequest('POST', '/db/AccessLog', accessLogData)).
        success(function (data, status, headers, config) {
            return;
        }).
        error(function (data, status, headers, config) {
            return;
        });
}

/*
Logging service.
*/
module.service('AccessLogService', function ($http, $log) {
    this.log = function (level, event, data) {
        browserLogEvent(level, event, $log);
        browserLogData(level, data, $log);
        if ('error' === level || 'warn' === level || 'info' === level) {
            serverLog(level, event, data, $http);
        }
    };
});

function win(r) {
    console.log("Code = " + r.responseCode);
    console.log("Response = " + r.response);
    console.log("Sent = " + r.bytesSent);
    // alert(r.response);
}

function fail(error) {
    // alert("An error has occurred: Code = " + error.code);
}

/*
File upload service.
From: https://github.com/dreamfactorysoftware/dsp-core/wiki/File-Storage-Services
*/
module.service('PostPhoto', ['$http', function ($http) {
    this.upload = function (filename, imageUri) {
        var patrolPrefix = localStorage.getItem('DspPatrolPrefix'),
            email = localStorage.getItem('DspEmail'),
            password = localStorage.getItem('DspPassword'),
            url = 'https://' + DSP_HOST + ':' + DSP_PORT + '/rest/files/posts/' + patrolPrefix + '/' + filename + '?app_name=' + DSP_APP_NAME,
            options = new FileUploadOptions(),
            ft = new FileTransfer();
        options.fileKey = "files";
        options.fileName = filename;
        options.mimeType = "image/jpeg";
        options.chunkedMode = false;
        ft.upload(imageUri, url, win, fail, options);
        
    };
}]);

/*
Text somebody's phone number.
*/
function sms(number) {
    var strippedNumber = number.replace(" ", "").replace("-", "").replace("(", "").replace(")", "");
    if (typeof device === 'undefined') {
        console.info('Sms: ' + number);
    } else {
        switch (device.platform) {
        case 'Android':
            navigator.app.loadUrl('sms:' + strippedNumber, {
                'openExternal': true
            });
            break;
        case 'iOS':
            window.open('sms:' + strippedNumber, '_system');
            break;
        default:
            window.open('sms:' + strippedNumber, '_system');
            break;
        }
    }
}

/*
Dial somebody's phone number.
*/
function dial(number) {
    var strippedNumber = number.replace(" ", "").replace("-", "").replace("(", "").replace(")", "");
    if (typeof device === 'undefined') {
        console.info('Dial: ' + number);
    } else {
        switch (device.platform) {
        case 'Android':
            navigator.app.loadUrl('tel:' + strippedNumber, {
                'openExternal': true
            });
            break;
        case 'iOS':
            window.open('tel:' + strippedNumber, '_system');
            break;
        default:
            window.open('tel:' + strippedNumber, '_system');
            break;
        }
    }
}

/*
Open in an in-app browser window.
*/
function browse(address) {
    if (typeof device === 'undefined') {
        window.open(address, '_blank', 'location=no, titlebar=yes, menubar=no, toolbar=no, status=no, scrollbars=yes');
    } else {
        switch (device.platform) {
        case 'Android':
            window.open(address, '_blank', 'location=no, titlebar=yes, menubar=no, toolbar=no, status=no, scrollbars=yes');
            // window.open(address, '_system');
            break;
        case 'iOS':
            window.open(address, '_blank', 'location=no, titlebar=yes, menubar=no, toolbar=no, status=no, scrollbars=yes');
            break;
        default:
            window.open(address, '_blank', 'location=no, titlebar=yes, menubar=no, toolbar=no, status=no, scrollbars=yes');
            break;
        }
    }
}

/*
Email somebody.
*/
function sendEmail(address, subject) {
    var url = 'mailto:' + address + '?subject=' + subject;
    if (typeof device === 'undefined') {
        window.open(url, '_system');
    } else {
        switch (device.platform) {
        case 'Android':
            navigator.app.loadUrl(url, {
                'openExternal': true
            });
            break;
        case 'iOS':
            window.open(url, '_system');
            break;
        default:
            window.open(url, '_system');
            break;
        }
    }
}

/*
Open URL in a external browser.
*/
function openInExternalBrowser(address) {
    if (typeof device === 'undefined') {
        window.open(address, '_system');
    } else {
        switch (device.platform) {
        case 'Android':
            navigator.app.loadUrl(address, {
                'openExternal': true
            });
            break;
        case 'iOS':
            window.open(address, '_system');
            break;
        default:
            window.open(address, '_system');
            break;
        }
    }
}

/*
Open a Youtube video.
*/
function youtube(address) {
    openInExternalBrowser(address);
}

/*
Open an ad.
*/
function openAd(address) {
    openInExternalBrowser(address);
}

/*
Make a nice and pretty message.
*/
function niceMessage(data, status) {
    var message = 'Server error';
    if ((data) && (data.error) && (data.error[0]) && (data.error[0].message)) {
        message = data.error[0].message;
    } else if (status) {
        message = 'Status: ' + status;
    }
    return message;
}

/*
Create a DSP request, cached by default with refreshes every 10 minutes for GETs.
*/
function dspRequest(httpMethod, urlPathAndParms, dataContent, refreshSeconds) {
    var email = localStorage.getItem('DspEmail'),
        password = localStorage.getItem('DspPassword'),
        aRequest = {
            'method': httpMethod,
            'cache': true,
            'timeout': 8000,
            'url': DSP_BASE_URL + '/rest' + urlPathAndParms,
            'headers': {
                'X-DreamFactory-Application-Name': DSP_APP_NAME,
            },
            'data': dataContent
        },
        now = moment();
    if (email && password) {
        aRequest.headers.Authorization = 'Basic ' + btoa(email + ':' + password);
    }
    if ('GET' === httpMethod) {
        if (!requestMap[urlPathAndParms]) {
            aRequest.cache = false;
            requestMap[urlPathAndParms] = moment();
        } else {
            if (!refreshSeconds) {
                refreshSeconds = 600;
            }
            if (requestMap[urlPathAndParms].add(refreshSeconds, 'seconds') < now) {
                aRequest.cache = false;
                requestMap[urlPathAndParms] = moment();
            }
        }
    } else {
        aRequest.cache = false;
    }
    return aRequest;
}