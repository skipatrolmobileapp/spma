/*global localStorage, ons, angular, module, dspRequest, personalNavigator, sendEmail */
"use strict";

/*
Ski Patrol Mobile App
Copyright © 2014-2018, Gary Meyer.
All rights reserved.
*/

/*
Build schedule summary.
*/
function buildScheduleSummary(schedule) {
    var i,
        totalCredits = 0,
        summary;
    for (i = 0; i < schedule.length; i++) {
        totalCredits = totalCredits + schedule[i].credits;
    }
    if (totalCredits == 1) {
        summary = totalCredits + ' credit day recorded';
    } else {
        summary = totalCredits + ' credit days recorded';
    }
    return summary;
}

/*
Personal patroller stuff.
*/
module.controller('MyPersonalController', function ($scope, $http, AccessLogService) {
    var email = localStorage.getItem('DspEmail'),
        patroller = angular.fromJson(localStorage.getItem('OnsMyPatroller')),
        schedule = angular.fromJson(localStorage.getItem('OnsMySchedule')),
        patrollerRequest = dspRequest('GET', '/team/_proc/GetPatroller(' + email + ')', null),
        scheduleRequest;
    AccessLogService.log('info', 'Personal');
    if (patroller) {
        $scope.name = patroller.name;
        $scope.showPatroller = true;
    } else {
        $scope.showPatroller = false;
    }
    if (schedule) {
        $scope.scheduleSummary = buildScheduleSummary(schedule);
        $scope.showSchedule = true;
    } else {
        $scope.showSchedule = false;
    }
    $http(patrollerRequest).
        success(function (data, status, headers, config) {
            if (1 === data.length) {
                $scope.name = data[0].name;
                $scope.showPatroller = true;
                localStorage.setItem('OnsMyPatroller', angular.toJson(data[0]));
                scheduleRequest = dspRequest('GET', '/team/_proc/GetPatrollerWorkHistory(' + data[0].id + ')', null);
                $http(scheduleRequest).
                    success(function (data, status, headers, config) {
                        $scope.scheduleSummary = buildScheduleSummary(data);
                        $scope.showSchedule = true;
                        localStorage.setItem('OnsMySchedule', angular.toJson(data));
                    }).
                    error(function (data, status, headers, config) {
                        $scope.showSchedule = false;
                        AccessLogService.log('err', 'GetMyScheduleErr', data);
                    });
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

/*
Work history.
*/
module.controller('WorkHistoryController', function ($scope, $http, AccessLogService) {
    AccessLogService.log('info', 'WorkHistory', null);
    $scope.sendSecretaryEmail = function () {
        sendEmail($scope.secretaryEmail, 'Ski%20Patrol%20Credit%20Days');
    };
    $scope.close = function () {
        personalNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});