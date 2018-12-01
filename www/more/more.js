/*jshint strict: true */
/*jshint unused: false */
/*jslint node: true */
/*jslint indent: 4 */
/*jslint unparam:true */
/*global IN_CORDOVA, device, localStorage, ons, angular, module, dspRequest, moreNavigator, youtube, settingAppName, openAd, havePatience, waitNoMore, niceMessage, sendEmail */
"use strict";

/*
Ski Patrol Mobile App
Copyright © 2014-2018, Gary Meyer.
All rights reserved.
*/

/*
More patroller stuff.
*/
module.controller('MoreController', function ($scope, $http, AccessLogService) {
    var patrolPrefix = localStorage.getItem('DspPatrolPrefix'),
        patrol = angular.fromJson(localStorage.getItem('DspPatrol')),
        role = localStorage.getItem('DspRole'),
        ads = angular.fromJson(localStorage.getItem('DspAd')),
        i;
    AccessLogService.log('info', 'More');
    $scope.enableAd = false;
    /*
    if (('Guest' == role) && (ads) && ('Yes' === patrol.showAds)) {
        for (i = 0; i < ads.length; i += 1) {
            if ('more' === ads[i].slot) {
                $scope.adImageAddress = ads[i].imageAddress;
                $scope.adLinkAddress = ads[i].linkAddress;
                $scope.enableAd = true;
            }
        }
    }
    */
    if ('Guest' === role) {
        $scope.showPatrollerStuff = false;
    } else {
        $scope.showPatrollerStuff = true;
    }
    $scope.termsDocName = 'Terms of Service';
    if ('Demo' === patrolPrefix) {
        $scope.demoMode = true;
    }
    if ('Basic' !== role && 'Power' !== role && 'Leader' !== role) {
        $scope.enableAd = true;
    }
    $scope.adClick = function () {
        AccessLogService.log('info', 'AdClick', $scope.adLinkAddress);
        openAd($scope.adLinkAddress);
    };
    $scope.viewTerms = function () {
        moreNavigator.pushPage('more/terms.html');
    };
    $scope.viewPrivacy = function () {
        moreNavigator.pushPage('more/privacy.html');
    };
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
Show terms of service legal mumbo jumbo.
*/
module.controller('TermsController', function ($scope, AccessLogService) {
    AccessLogService.log('info', 'Terms');
    $scope.close = function () {
        moreNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Show privacy policy legal mumbo jumbo.
*/
module.controller('PrivacyController', function ($scope, AccessLogService) {
    AccessLogService.log('info', 'Privacy');
    $scope.close = function () {
        moreNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Show the user how cool I am and let them send me an email.
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