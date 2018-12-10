/*jshint strict: true */
/*jshint unused: false */
/*jslint node: true */
/*jslint indent: 4 */
/*jslint unparam:true */
/*global IN_CORDOVA, device, localStorage, ons, angular, module, dspRequest, personalNavigator, havePatience, waitNoMore, niceMessage, sendEmail */
"use strict";

/*
Ski Patrol Mobile App
Copyright © 2014-2018, Gary Meyer.
All rights reserved.
*/

/*
Personal patroller stuff.
*/
module.controller('PersonalController', function ($scope, $http, AccessLogService) {
    var email = localStorage.getItem('DspEmail'),
        patroller = angular.fromJson(localStorage.getItem('OnsMyPatroller')),
        patrollerRequest = dspRequest('GET', '/team/_table/Patroller?filter=(email%20%3D%20' + email + ')', null);
    AccessLogService.log('info', 'Personal');
    if (patroller) {
      $scope.name = patroller.name;
      $scope.showPatroller = true;
    } else {
      $scope.showPatroller = false;
    }
    $http(patrollerRequest).
        success(function (data, status, headers, config) {
            if (1 === data.resource.length) {
                $scope.name = data.resource[0].name;
                $scope.showPatroller = true;
                localStorage.setItem('OnsMyPatroller', angular.toJson(data.resource[0]));
            } else {
                AccessLogService.log('warn', 'GetMyPatrollerWarn ' + email);
            }
        }).
        error(function (data, status, headers, config) {
            $scope.showPatroller = false;
            AccessLogService.log('err', 'GetMyPatrollerErr', data);
        });
    ons.ready(function () {
        return;
    });
});

/*
Show patroller demographic details.
*/
module.controller('DemographicsController', function ($scope, $http, AccessLogService) {
    var patrol = angular.fromJson(localStorage.getItem('DspPatrol')),
        patrollers = angular.fromJson(localStorage.getItem('DspPatroller')),
        patroller = angular.fromJson(localStorage.getItem('OnsMyPatroller')),
        i = null;
    AccessLogService.log('info', 'Demographics', patroller.name);
    $scope.name = patroller.name;
    $scope.address = patroller.address;
    $scope.cellPhone = patroller.cellPhone;
    $scope.homePhone = patroller.homePhone;
    $scope.alternatePhone = patroller.alternatePhone;
    $scope.email = patroller.email;
    $scope.additionalEmail = patroller.additionalEmail;
    if (patrol.secretaryPatrollerId) {
        for (i = 0; i < patrollers.length; i += 1) {
            if (patrollers[i].id === patrol.secretaryPatrollerId) {
                $scope.showSecretary = true;
                $scope.secretaryName = patrollers[i].name;
                $scope.secretaryEmail = patrollers[i].email;
            }
        }
    }
    $scope.sendSecretaryEmail = function () {
        sendEmail($scope.secretaryEmail, 'Ski%20Patrol%20Contact%20Info');
    };
    $scope.close = function () {
        personalNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});