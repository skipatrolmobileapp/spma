/*global ons, module, moreNavigator, youtube, sendEmail */

/*
Ski Patrol Mobile App
Copyright © 2014-2018, Gary Meyer.
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
Knots.
*/
module.controller('KnotsController', function ($scope, AccessLogService) {
    AccessLogService.log('info', 'Knots');
    $scope.close = function () {
        moreNavigator.popPage();
    };
    $scope.youtube = function (address) {
        youtube(address);
    };
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
        sendEmail('skipatrolmobileapp@gmail.com', 'Ski%20Patrol%20Mobile%20App');
    };
    $scope.close = function () {
        moreNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});