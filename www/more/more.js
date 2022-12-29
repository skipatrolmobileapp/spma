/*global window, ons, localStorage, module, moreNavigator, sendEmail */

/*
Ski Patrol Mobile App
Copyright © 2014-2022, Gary Meyer.
All rights reserved.
*/

/*
More patroller stuff.
*/
module.controller('MoreController', function ($scope, $http, AccessLogService) {
    AccessLogService.log('info', 'More');
    ons.ready(function () {
        return;
    });
});

/*
Static content.
*/
module.controller('ContentController', function ($scope, AccessLogService) {
    AccessLogService.log('info', 'Content');
    $scope.close = function () {
        moreNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Let the user send me an email.
*/
module.controller('HelpController', function ($scope, AccessLogService) {
    AccessLogService.log('info', 'Help');
    $scope.email = function () {
        sendEmail('gary@meyer.net', 'Ski%20Patrol%20Mobile%20App');
    };
    $scope.close = function () {
        moreNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});
/*
Log Out/Reset.
*/
module.controller('LogoutController', function ($scope, AccessLogService) {
    AccessLogService.log('info', 'Logout');
    $scope.logout = function () {
        var myEmail = localStorage.getItem('DspEmail');
        AccessLogService.log('info', 'LoggedOut');
        localStorage.clear();
        window.location = 'index.html';

    };
    $scope.close = function () {
        moreNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});