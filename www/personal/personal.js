/*global localStorage, ons, angular, module, dspRequest, personalNavigator, sendEmail, moment */
"use strict";

/*
Ski Patrol Mobile App
Copyright © 2014-2022, Gary Meyer.
All rights reserved.
*/

/*
Personal patroller stuff.
*/
module.controller('MyPersonalController', function ($scope, $http, AccessLogService) {
    var patrolPrefix = localStorage.getItem('DspPatrolPrefix'),
        activity = 'Credit Day',
        today = moment().format('YYYY-MM-DD'),
        isActivityDayRequest = dspRequest('GET',
            '/team/_proc/IsActivityDay(' + patrolPrefix + ',' +
            activity + ',' + today + ')', null),
        patrol = angular.fromJson(localStorage.getItem('DspPatrol')),
        email = localStorage.getItem('DspEmail'),
        patroller = angular.fromJson(localStorage.getItem('OnsMyPatroller')),
        schedule = angular.fromJson(localStorage.getItem('OnsMySchedule')),
        patrollers = angular.fromJson(localStorage.getItem('DspPatroller')),
        patrollersRequest = dspRequest('GET', '/team/_table/Patroller?order=name', null),
        patrollerRequest = dspRequest('GET',  '/team/_proc/GetPatroller(' + email + ')', null),
        scheduleRequest;
    AccessLogService.log('info', 'Personal');
    if (patroller) {
        $scope.name = patroller.name;
        $scope.showPatroller = true;
    } else {
        $scope.showPatroller = false;
    }
    if (schedule) {
        $scope.showSchedule = true;
    } else {
        $scope.showSchedule = false;
    }
    $http(patrollersRequest).
            success(function (data, status, headers, config) {
                patrollers = data.resource;
                localStorage.setItem('DspPatroller', angular.toJson(patrollers));
            }).
            error(function (data, status, headers, config) {
                AccessLogService.log('error', 'GetPatrollerErr', niceMessage(data, status));
            });
    $http(patrollerRequest).
        success(function (data, status, headers, config) {
            if (1 === data.length) {
                $scope.name = data[0].name;
                $scope.showPatroller = true;
                localStorage.setItem('OnsMyPatroller', angular.toJson(data[0]));
                scheduleRequest = dspRequest('GET', '/team/_proc/GetPatrollerWorkHistory(' + data[0].id + ')', null);
                $http(scheduleRequest).
                    success(function (data, status, headers, config) {
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
    var patrol = angular.fromJson(localStorage.getItem('DspPatrol')),
        patrollers = angular.fromJson(localStorage.getItem('DspPatroller')),
        schedules = angular.fromJson(localStorage.getItem('OnsMySchedule')),
        i = null;
    for (i = 0; i < schedules.length; i += 1) {
        schedules[i].quickTeaser = moment(schedules[i].activityDate).format('ddd, MMM D') + ' - ' + schedules[i].activity;
    }
    localStorage.setItem('OnsMySchedule', angular.toJson(schedules));
    $scope.schedules = schedules;
    if (patrol.secretaryPatrollerId) {
        for (i = 0; i < patrollers.length; i += 1) {
            if (patrollers[i].id === patrol.secretaryPatrollerId) {
                $scope.showSecretary = true;
                $scope.secretaryName = patrollers[i].name;
                $scope.secretaryEmail = patrollers[i].email;
            }
        }
    }
    $scope.pickSchedule = function (index) {
        schedules = angular.fromJson(
            localStorage.getItem('OnsMySchedule')),
        localStorage.setItem('OnsMyDay', 
            angular.toJson(schedules[index]));
        personalNavigator.pushPage('personal/workday.html');
    };
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

/*
Work day.
*/
module.controller('WorkDayController', function ($scope, $http, AccessLogService) {
    var patrol = angular.fromJson(localStorage.getItem('DspPatrol')),
        patrollers = angular.fromJson(localStorage.getItem('DspPatroller')),
        day = angular.fromJson(localStorage.getItem('OnsMyDay')),
        i;
    $scope.quickTeaser = moment(day.activityDate).format('ddd, MMM D');
    $scope.activity = day.activity;
    $scope.duty = day.duty;
    $scope.equipment = day.equipment;
    $scope.comments = day.comments;
    $scope.credits = day.credits;
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
        sendEmail($scope.secretaryEmail, 'Ski%20Patrol%20Attendance');
    };
    $scope.close = function () {
        personalNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Patroller directory.
*/
module.controller('DirectoryController', function ($scope, AccessLogService) {
    var patrollers = angular.fromJson(localStorage.getItem('DspPatroller'));
    AccessLogService.log('info', 'Directory');
    $scope.patrollers = patrollers;
    $scope.view = function (index) {
        localStorage.setItem('OnsPatroller', angular.toJson($scope.patrollers[index]));
        personalNavigator.pushPage('personal/patroller.html');
    };
    $scope.close = function () {
        personalNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Search for a patroller.
*/
module.controller('SearchController', function ($scope, AccessLogService) {
    var patrollers = angular.fromJson(localStorage.getItem('DspPatroller'));
    AccessLogService.log('info', 'Search');
    $scope.patrollers = [];
    document.getElementById("name").focus();
    $scope.search = function (name) {
        var n = 0,
            i = 0;
        $scope.patrollers = [];
        name = name.toLowerCase();
        if ((name) && (name.length > 1)) {
            for (i = 0; i < patrollers.length; i += 1) {
                if ((patrollers[i].name) && (patrollers[i].name.toLowerCase().indexOf(name) > -1)) {
                    $scope.patrollers[n] = patrollers[i];
                    n += 1;
                }
            }
        }
    };
    $scope.view = function (index) {
        localStorage.setItem('OnsPatroller', angular.toJson($scope.patrollers[index]));
        personalNavigator.pushPage('personal/patroller.html');
    };
    $scope.close = function () {
        personalNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Show patroller details.
*/
module.controller('PatrollerController', function ($scope, $http, AccessLogService) {
    var patrol = angular.fromJson(localStorage.getItem('DspPatrol')),
        patroller = angular.fromJson(localStorage.getItem('OnsPatroller')),
        patrollers = angular.fromJson(localStorage.getItem('DspPatroller')),
        scheduleRequest = dspRequest('GET', '/team/_table/Schedule?filter=' +
                /*
                encodeURIComponent('activityDate <= '
                        + moment().format('YYYY-MM-DD') + ' and ') +
                */
                encodeURIComponent('patrollerId=' + patroller.id) + '&order=' +
                encodeURIComponent('activityDate,activity'),
                null),
        schedules,
        i;
    AccessLogService.log('info', 'Patroller', patroller.name);
    $scope.name = patroller.name;
    $scope.cellPhone = patroller.cellPhone;
    $scope.homePhone = patroller.homePhone;
    $scope.alternatePhone = patroller.alternatePhone;
    $scope.email = patroller.email;
    $scope.additionalEmail = patroller.additionalEmail;
    scheduleRequest.cache = false;

    console.debug(JSON.stringify(scheduleRequest.headers));
    console.debug(scheduleRequest.url);

    $http(scheduleRequest).
        success(function (data, status, headers, config) {
            schedules = data.resource;
            for (i = 0; i < schedules.length; i += 1) {
                schedules[i].displayDate = moment(schedules[i].activityDate).format('MMM D, YYYY');
                if ((schedules[i].duty.indexOf('OEC') > 0) || (schedules[i].duty.indexOf('CPR') > 0) || (schedules[i].duty.indexOf('Refresher') > 0)  || (schedules[i].duty.indexOf('Course') > 0) || (schedules[i].duty.indexOf('Training') > 0) || (schedules[i].duty.indexOf('Test') > 0) || (schedules[i].duty.indexOf('NSP') > 0)) {
                    schedules[i].summary = schedules[i].duty;
                } else {
                    schedules[i].summary = schedules[i].activity;
                }
            }
            $scope.showSchedule = true;
            $scope.schedules = schedules;
            if ((schedules) && (patrol.secretaryPatrollerId)) {
                for (i = 0; i < patrollers.length; i += 1) {
                    if (patrollers[i].id === patrol.secretaryPatrollerId) {
                        $scope.showSecretary = true;
                        $scope.secretaryName = patrollers[i].name;
                        $scope.secretaryEmail = patrollers[i].email;
                    }
                }
            }            
        }).
        error(function (data, status, headers, config) {
            $scope.message = niceMessage(data, status);
            AccessLogService.log('error', 'GetScheduleErr', niceMessage(data, status));
        });
    $scope.textCellPhone = function () {
        sms($scope.cellPhone);
    };
    $scope.callCellPhone = function () {
        dial($scope.cellPhone);
    };
    $scope.callHomePhone = function () {
        dial($scope.homePhone);
    };
    $scope.callAlternatePhone = function () {
        dial($scope.alternatePhone);
    };
    $scope.sendEmail = function () {
        sendEmail($scope.email, 'Ski%20Patrol');
    };
    $scope.sendAdditionalEmail = function () {
        sendEmail($scope.additionalEmail, 'Ski%20Patrol');
    };
    $scope.sendSecretaryEmail = function () {
        sendEmail($scope.secretaryEmail, 'Ski%20Patrol');
    };
    $scope.close = function () {
        personalNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});