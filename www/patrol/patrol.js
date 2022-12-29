/*jshint strict: true */
/*jshint unused: false */
/*jslint node: true */
/*jslint indent: 4 */
/*jslint unparam:true */
/*global document, window, localStorage, ons, angular, module, moment, dspRequest, dial, sendEmail, niceMessage, patrolNavigator, havePatience, waitNoMore, sms, browse, encodeURIComponent */
"use strict";

/*
Ski Patrol Mobile App
Copyright © 2014-2022, Gary Meyer.
All rights reserved.
*/

/*
Club together my upcoming stuff from shared events and my schedule.
*/
function upcomingEvents(events) {
    var i = 0,
        n = 0,
        stuff = [],
        yesterday = moment().subtract(24, 'hours');
    if (!events) {
        return [];
    }
    for (i = 0; i < events.length; i += 1) {
        if (moment(events[i].start) >= yesterday) {
            stuff[n] = events[i];
            stuff[n].quickTeaser = moment(events[i].start).format('ddd, MMM D') + ' - ' + events[i].activity;
            n += 1;
        }
    }
    stuff.sort(function (a, b) {
        var sortValue = 0;
        if (a.start < b.start) {
            sortValue = -1;
        } else if (a.start > b.start) {
            sortValue = 1;
        }
        return sortValue;
    });
    return stuff;
}

/*
Show patrol info.
*/
module.controller('PatrolController', function ($scope, $http, AccessLogService) {
    var patrol = angular.fromJson(localStorage.getItem('DspPatrol')),
        role = localStorage.getItem('DspRole'),
        events = angular.fromJson(localStorage.getItem('DspEvent')),
        eventRequest = dspRequest('GET', '/team/_table/Event?order=start,activity', null),
        activities = angular.fromJson(localStorage.getItem('DspActivity')),
        activityRequest = dspRequest('GET', '/team/_table/Activity?order=activity', null),
        callRequest = dspRequest('GET', '/team/_table/Phone?order=territory,name', null),
        i;
    AccessLogService.log('info', 'Patrol');
    if ('Leader' === role) {
        $scope.enableSignIn = true;
    }
    if ('Basic' === role || 'Power' === role || 'Leader' === role) {
        $scope.events = upcomingEvents(events);
        eventRequest.cache = false;
        $http(eventRequest).
            success(function (data, status, headers, config) {
                events = data.resource;
                localStorage.setItem('DspEvent', angular.toJson(events));
                $scope.events = upcomingEvents(events);
            }).
            error(function (data, status, headers, config) {
                AccessLogService.log('error', 'GetEventErr', niceMessage(data, status));
            });
        $http(activityRequest).
            success(function (data, status, headers, config) {
                activities = data.resource;
                localStorage.setItem('DspActivity', angular.toJson(activities));
            }).
            error(function (data, status, headers, config) {
                AccessLogService.log('error', 'GetActivityErr', niceMessage(data, status));
            });
    } else {
        $scope.aGuest = true;
        $scope.items = angular.fromJson(localStorage.getItem('DspCall'));
        $http(callRequest).
            success(function (data, status, headers, config) {
                $scope.items = data.resource;
                localStorage.setItem('DspCall', angular.toJson(data.resource));
            }).
            error(function (data, status, headers, config) {
                AccessLogService.log('error', 'GetCallErr', niceMessage(data, status));
            });
    }
    $scope.call = function (index) {
        AccessLogService.log('info', 'Call', $scope.items[index].number);
        dial($scope.items[index].number);
    };
    $scope.showEvent = function (index) {
        var role = localStorage.getItem('DspRole');
        localStorage.setItem('OnsEvent', angular.toJson($scope.events[index]));
        if ('Power' === role || 'Leader' === role) {
            patrolNavigator.pushPage('patrol/sheet.html');
        } else if ('Basic' === role) {
            patrolNavigator.pushPage('patrol/schedule.html');
        }
    };
    ons.ready(function () {
        return;
    });
});

/*
Get all events.
*/
function patrolAllEvents(events) {
    var i = 0,
        n = 0,
        stuff = [];
    if (!events) {
        return [];
    }
    for (i = 0; i < events.length; i += 1) {
        stuff[n] = events[i];
        stuff[n].checked = false;
        stuff[n].quickTeaser = moment(events[i].start).format('ddd, MMM D') + ' - ' + events[i].activity;
        n = n + 1;
    }
    stuff.sort(function (a, b) {
        var sortValue = 0;
        if (a.start < b.start) {
            sortValue = -1;
        } else if (a.start > b.start) {
            sortValue = 1;
        }
        return sortValue;
    });
    return stuff;
}

/*
Edit the calendar.
*/
module.controller('CalendarController', function ($rootScope, $scope, $http, AccessLogService) {
    var events = angular.fromJson(localStorage.getItem('DspEvent')),
        eventRequest = dspRequest('GET', '/team/_table/Event?order=start,activity', null);
    AccessLogService.log('info', 'Calendar');
    eventRequest.cache = false;
    havePatience($rootScope);
    $http(eventRequest).
        success(function (data, status, headers, config) {
            events = data.resource;
            localStorage.setItem('DspEvent', angular.toJson(events));
            if (!events) {
                patrolNavigator.popPage();
            } else {
                $scope.events = patrolAllEvents(events);
            }
            waitNoMore();
        }).
        error(function (data, status, headers, config) {
            AccessLogService.log('error', 'GetEventErr', niceMessage(data, status));
            waitNoMore();
        });
    $scope.pickEvent = function (index) {
        localStorage.setItem('OnsEvent', angular.toJson($scope.events[index]));
        patrolNavigator.pushPage('patrol/event.html');
    };
    $scope.close = function () {
        patrolNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Add a calendar event.
*/
module.controller('AddEventController', function ($rootScope, $scope, $http, AccessLogService) {
    var activities = angular.fromJson(localStorage.getItem('DspActivity')),
        now = moment(),
        i,
        activityList = [],
        n = 0;
    AccessLogService.log('info', 'AddEvent');
    $scope.date = now.format('ddd, MMM D');
    $scope.startDate = now.format('YYYY-MM-DD');
    $scope.endDate = now.format('YYYY-MM-DD');
    $scope.allDay = true;
    $scope.startAt = 0;
    $scope.startTime = null;
    $scope.endAt = 0;
    $scope.endTime = null;
    $scope.activity = {};
    for (i = 0; i < activities.length; i += 1) {
        activityList[n] = activities[i].activity;
        if ('Credit Day' === activityList[n]) {
            $scope.activity.activity = 'Credit Day';
        }
        n += 1;
    }
    if (!$scope.activity.activity) {
        $scope.activity.activity = $scope.activities[0];
    }
    $scope.description = null;
    $scope.location = null;
    $scope.address = null;
    $scope.activities = activityList;
    $scope.getDate = function () {
        var options = {
            date : moment($scope.startDate + ' 00:00:00').toDate(),
            mode : 'date',
            allowOldDates : true
        };
        window.plugins.datePicker.show(options, function (returnDate) {
            if (returnDate) {
                $scope.date = moment(returnDate).format('ddd, MMM D');
                $scope.startDate = moment(returnDate).format('YYYY-MM-DD');
                $scope.endDate = moment(returnDate).format('YYYY-MM-DD');
                $scope.$apply();
            }
        });
    };
    $scope.toggleAllDay = function () {
        $scope.allDay = !$scope.allDay;
    };
    $scope.getStartTime = function () {
        var options = {
            date : moment($scope.startDate + ' 00:00:00').toDate(),
            mode : 'time',
            allowOldDates : true
        };
        if ($scope.startAt) {
            options.date = moment($scope.startDate + ' ' + $scope.startAt).toDate();
        }
        window.plugins.datePicker.show(options, function (returnDate) {
            if (returnDate) {
                $scope.startAt = moment(returnDate).format('HH:mm:ss');
                $scope.startTime = moment(returnDate).format('h:mmA');
                $scope.$apply();
            }
        });
    };
    $scope.getEndTime = function () {
        var options = {
            date : moment($scope.endDate + ' 00:00:00').toDate(),
            mode : 'time',
            allowOldDates : true
        };
        if ($scope.endAt) {
            options.date = moment($scope.endDate + ' ' + $scope.endAt).toDate();
        }
        window.plugins.datePicker.show(options, function (returnDate) {
            if (returnDate) {
                $scope.endAt = moment(returnDate).format('HH:mm:ss');
                $scope.endTime = moment(returnDate).format('h:mmA');
                $scope.$apply();
            }
        });
    };
    $scope.add = function () {
        var patrolPrefix = localStorage.getItem('DspPatrolPrefix'),
            body = {
                tenantId: patrolPrefix,
                start: $scope.startDate + ' 00:00:00 UTC',
                end: null,
                allDay: 'Yes',
                activity: $scope.activity.activity,
                description: $scope.description,
                location: $scope.location,
                address: $scope.address
            },
            eventRequest,
            postResource = {
                resource: []
            };
        if (!$scope.allDay) {
            body.start = $scope.startDate + ' ' + $scope.startAt + ' UTC';
            body.end = $scope.endDate + ' ' + $scope.endAt + ' UTC';
            body.allDay = 'No';
        }
        postResource.resource.push(body);
        eventRequest = dspRequest('POST', '/team/_table/Event', postResource);
        havePatience($rootScope);
        $scope.message = '';
        $http(eventRequest).
            success(function (data, status, headers, config) {
                waitNoMore();
                patrolNavigator.pushPage('patrol/calendar.html');
            }).
            error(function (data, status, headers, config) {
                $scope.message = niceMessage(data, status);
                AccessLogService.log('error', 'PostEventErr', niceMessage(data, status));
                waitNoMore();
            });
    };
    $scope.close = function () {
        patrolNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Calendar event.
*/
module.controller('EventController', function ($rootScope, $scope, $http, AccessLogService) {
    var event = angular.fromJson(localStorage.getItem('OnsEvent')),
        activities = angular.fromJson(localStorage.getItem('DspActivity')),
        i,
        activityList = [];
    AccessLogService.log('info', 'Event');
    $scope.date = moment(event.start).format('ddd, MMM D');
    $scope.startDate = moment(event.start).format('YYYY-MM-DD');
    if ('No' === event.allDay) {
        $scope.endDate = moment(event.end).format('YYYY-MM-DD');
        $scope.allDay = false;
    } else {
        $scope.endDate = moment(event.start).format('YYYY-MM-DD');
        $scope.allDay = true;
    }
    $scope.startAt = moment(event.start).format('HH:mm:ss');
    $scope.startTime = moment(event.start).format('h:mmA');
    if (event.end) {
        $scope.endAt = moment(event.end).format('HH:mm:ss');
        $scope.endTime = moment(event.end).format('h:mmA');    
    } else {
        $scope.endAt = moment(event.start).format('HH:mm:ss');
        $scope.endTime = moment(event.start).format('h:mmA');    
    }
    for (i = 0; i < activities.length; i += 1) {
        activityList[i] = activities[i].activity;
    }
    $scope.activities = activityList;
    $scope.activity = {};
    $scope.activity.activity = event.activity;
    $scope.description = event.description;
    $scope.location = event.location;
    $scope.address = event.address;
    $scope.getDate = function () {
        var options = {
            date : moment($scope.startDate + ' 00:00:00').toDate(),
            mode : 'date',
            allowOldDates : true
        };
        window.plugins.datePicker.show(options, function (returnDate) {
            if (returnDate) {
                $scope.date = moment(returnDate).format('ddd, MMM D');
                $scope.startDate = moment(returnDate).format('YYYY-MM-DD');
                $scope.endDate = moment(returnDate).format('YYYY-MM-DD');
                $scope.$apply();
            }
        });
    };
    $scope.toggleAllDay = function () {
        $scope.allDay = !$scope.allDay;
    };
    $scope.getStartTime = function () {
        var options = {
            date : moment($scope.startDate + ' 00:00:00').toDate(),
            mode : 'time',
            allowOldDates : true
        };
        if ($scope.startAt) {
            options.date = moment($scope.startDate + ' ' + $scope.startAt).toDate();
        }
        window.plugins.datePicker.show(options, function (returnDate) {
            if (returnDate) {
                $scope.startAt = moment(returnDate).format('HH:mm:ss') + ' UTC';
                $scope.startTime = moment(returnDate).format('h:mmA');
                $scope.$apply();
            }
        });
    };
    $scope.getEndTime = function () {
        var options = {
            date : moment($scope.endDate + ' 00:00:00').toDate(),
            mode : 'time',
            allowOldDates : true
        };
        if ($scope.endAt) {
            options.date = moment($scope.endDate + ' ' + $scope.endAt).toDate();
        }
        window.plugins.datePicker.show(options, function (returnDate) {
            if (returnDate) {
                $scope.endAt = moment(returnDate).format('HH:mm:ss') + ' UTC';
                $scope.endTime = moment(returnDate).format('h:mmA');
                $scope.$apply();
            }
        });
    };
    $scope.update = function () {
        var patrolPrefix = localStorage.getItem('DspPatrolPrefix'),
            body = {
                id: event.id,
                tenantId: patrolPrefix,
                start: $scope.startDate + ' 00:00:00 UTC',
                end: null,
                allDay: 'Yes',
                activity: $scope.activity.activity,
                description: $scope.description,
                location: $scope.location,
                address: $scope.address
            },
            eventResource = {
                resource: []
            },
            eventRequest;
        if (!$scope.allDay) {
            body.start = $scope.startDate + ' ' + $scope.startAt + ' UTC';
            body.end = $scope.endDate + ' ' + $scope.endAt + ' UTC';
            body.allDay = 'No';
        }
        eventResource.resource.push(body);
        eventRequest = dspRequest('PUT', '/team/_table/Event', eventResource);
        havePatience($rootScope);
        $scope.message = '';
        console.log(JSON.stringify(eventResource));
        $http(eventRequest).
            success(function (data, status, headers, config) {
                waitNoMore();
                patrolNavigator.pushPage('patrol/calendar.html');
            }).
            error(function (data, status, headers, config) {
                $scope.message = niceMessage(data, status);
                AccessLogService.log('error', 'PutEventErr', niceMessage(data, status));
                waitNoMore();
            });
    };
    $scope.delete = function () {
        var eventRequest = dspRequest('DELETE', '/team/_table/Event/' + event.id, null);
        havePatience($rootScope);
        $scope.message = '';
        $http(eventRequest).
            success(function (data, status, headers, config) {
                waitNoMore();
                patrolNavigator.pushPage('patrol/calendar.html');
            }).
            error(function (data, status, headers, config) {
                $scope.message = niceMessage(data, status);
                AccessLogService.log('error', 'DelEventErr', niceMessage(data, status));
                waitNoMore();
            });
    };
    $scope.close = function () {
        patrolNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Get the past events.
*/
function patrolPastEvents(events) {
    var i = 0,
        n = 0,
        stuff = [],
        thePresent = moment();
    if (!events) {
        return [];
    }
    for (i = 0; i < events.length; i += 1) {
        if (moment(events[i].start) <= thePresent) {
            stuff[n] = events[i];
            stuff[n].checked = false;
            stuff[n].quickTeaser = moment(events[i].start).format('ddd, MMM D') + ' - ' + events[i].activity;
            n = n + 1;
        }
    }
    stuff.sort(function (a, b) {
        var sortValue = 0;
        if (a.start > b.start) {
            sortValue = -1;
        } else if (a.start < b.start) {
            sortValue = 1;
        }
        return sortValue;
    });
    return stuff;
}

/*
Pick a day for a sign in sheet to edit.
*/
module.controller('SheetsController', function ($scope, AccessLogService) {
    var events = angular.fromJson(localStorage.getItem('DspEvent'));
    AccessLogService.log('info', 'Sheets');
    if (!events) {
        patrolNavigator.popPage();
    } else {
        $scope.events = patrolPastEvents(events);
    }
    $scope.pickEvent = function (index) {
        localStorage.setItem('OnsEvent', angular.toJson($scope.events[index]));
        patrolNavigator.pushPage('patrol/sheet.html');
    };
    $scope.close = function () {
        patrolNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Pick a patroller to edit on the sign in sheet.
*/
module.controller('SheetController', function ($rootScope, $scope, $http, AccessLogService) {
    var event = angular.fromJson(localStorage.getItem('OnsEvent')),
        schedules = null,
        scheduleRequest = dspRequest('GET', '/team/_table/Schedule?filter=' +
                encodeURIComponent('activityDate = ' + event.start + '" AND activity = '
                        + event.activity) + '&order=name', null);
    havePatience($rootScope);
    AccessLogService.log('info', 'Sheet', event.start);
    $scope.quickTeaser = moment(event.start).format('ddd, MMM D') + ' - ' + event.activity;
    scheduleRequest.cache = false;
    $http(scheduleRequest).
        success(function (data, status, headers, config) {
            schedules = data.resource;
            $scope.attendees = schedules;
            $scope.showAttendees = (schedules.length > 0);
            waitNoMore();
        }).
        error(function (data, status, headers, config) {
            AccessLogService.log('error', 'GetScheduleErr', niceMessage(data, status));
            waitNoMore();
        });
    $scope.edit = function (index) {
        localStorage.setItem('OnsSchedule', angular.toJson($scope.attendees[index]));
        patrolNavigator.pushPage('patrol/editsignin.html');
    };
    $scope.close = function () {
        patrolNavigator.pushPage('patrol/sheets.html');
    };
    $scope.back = function () {
        patrolNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Show an event.
*/
module.controller('ScheduleController', function ($rootScope, $scope, $http, AccessLogService) {
    var event = angular.fromJson(localStorage.getItem('OnsEvent'));
    AccessLogService.log('info', 'Schedule', event.start);
    $scope.quickTeaser = moment(event.start).format('ddd, MMM D') + ' - ' + event.activity;
    if ('No' === event.allDay) {
        $scope.times = moment(event.start).format('h:mmA') + ' - ' + moment(event.end).format('h:mmA');
    }
    $scope.description = event.description;
    $scope.location = event.location;
    $scope.address = event.address;
    $scope.close = function () {
        patrolNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Do a patroller sign in.
*/
module.controller('SignUpController', function ($rootScope, $scope, $http, AccessLogService) {
    var event = angular.fromJson(localStorage.getItem('OnsEvent')),
        activities = angular.fromJson(localStorage.getItem('DspActivity')),
        duty = angular.fromJson(localStorage.getItem('OnsDuty')),
        i,
        patrollers = angular.fromJson(localStorage.getItem('DspPatroller')),
        dutyList;
    AccessLogService.log('info', 'SignUp', event.start);
    $scope.quickTeaser = event.quickTeaser;
    for (i = 0; i < activities.length; i += 1) {
        if (activities[i].activity === event.activity) {
            $scope.credits = activities[i].defaultCredits;
            dutyList = activities[i].dutyListCsv.split(',');
        }
    }
    if (!duty && dutyList && dutyList.length > 0) {
        duty = dutyList[0];
    }
    $scope.duty = {};
    $scope.duty.duty = duty;
    if ($scope.duties && $scope.duties.length === 1) {
        $scope.duty.duty = $scope.duties[0];
    }
    document.getElementById('name').focus();
    $scope.showDutyList = function (name) {
        $scope.duties = dutyList;
        $scope.patrollers = [];
    };
    $scope.dutyPicked = function () {
        $scope.duties = [];
    };
    $scope.searchName = function (name) {
        var n = 0,
            i = 0;
        $scope.patrollers = [];
        if ((name) && (name.length > 1)) {
            name = name.toLowerCase();
            for (i = 0; i < patrollers.length; i += 1) {
                if ((patrollers[i].name) && (patrollers[i].name.toLowerCase().indexOf(name) > -1)) {
                    $scope.patrollers[n] = patrollers[i];
                    n = n + 1;
                }
            }
        }
    };
    $scope.listNames = function () {
        $scope.searchName($scope.name);
    };
    $scope.clearNames = function () {
        $scope.patrollers = [];
    };
    $scope.namePicked = function (patroller) {
        $scope.patrollerId = patroller.id;
        $scope.name = patroller.name;
        $scope.patrollers = [];
    };
    $scope.add = function () {
        var patrolPrefix = localStorage.getItem('DspPatrolPrefix'),
            body = { resource: [{
                tenantId: patrolPrefix,
                patrollerId: $scope.patrollerId,
                name: $scope.name,
                activityDate: event.start,
                activity: event.activity,
                duty: $scope.duty.duty,
                equipment: $scope.equipment,
                comments: $scope.comments,
                credits: $scope.credits
            }]},
            scheduleRequest = dspRequest('POST', '/team/_table/Schedule', body);
        if (!$scope.name) {
            $scope.message = 'Name is required.';
        } else {
            havePatience($rootScope);
            $scope.message = '';
            $http(scheduleRequest).
                success(function (data, status, headers, config) {
                    $scope.patrollerId = null;
                    $scope.name = null;
                    $scope.equipment = null;
                    $scope.comments = null;
                    waitNoMore();
                }).
                error(function (data, status, headers, config) {
                    $scope.message = niceMessage(data, status);
                    AccessLogService.log('error', 'PostScheduleErr', niceMessage(data, status));
                    waitNoMore();
                });
        }
    };
    $scope.cancel = function () {
        patrolNavigator.pushPage('patrol/sheet.html');
    };
    $scope.close = function () {
        patrolNavigator.pushPage('patrol/sheet.html');
    };
    $scope.back = function () {
        patrolNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Do a patroller sign in.
*/
module.controller('EditSignInController', function ($rootScope, $scope, $http, AccessLogService) {
    var event = angular.fromJson(localStorage.getItem('OnsEvent')),
        activities = angular.fromJson(localStorage.getItem('DspActivity')),
        duty,
        i,
        dutyList,
        scheduleId = angular.fromJson(localStorage.getItem('OnsSchedule')).id,
        scheduleRequest = dspRequest('GET', '/team/_table/Schedule?filter=' +
                encodeURIComponent('id = ' + scheduleId), null),
        schedule;
    AccessLogService.log('info', 'EditSignIn', scheduleId);
    havePatience($rootScope);
    $scope.quickTeaser = event.quickTeaser;
    for (i = 0; i < activities.length; i += 1) {
        if (activities[i].activity === event.activity) {
            dutyList = activities[i].dutyListCsv.split(',');
        }
    }
    if ($scope.duties && $scope.duties.length === 1) {
        $scope.duty.duty = $scope.duties[0];
    }
    scheduleRequest.cache = false;
    $http(scheduleRequest).
        success(function (data, status, headers, config) {
            schedule = data.resource[0];
            $scope.name = schedule.name;
            $scope.equipment = schedule.equipment;
            $scope.comments = schedule.comments;
            $scope.credits = schedule.credits;
            duty = schedule.duty;
            if (!duty && dutyList && dutyList.length > 0) {
                duty = dutyList[0];
            }
            $scope.duty = {};
            $scope.duty.duty = duty;
            waitNoMore();
        }).
        error(function (data, status, headers, config) {
            AccessLogService.log('error', 'GetScheduleErr', niceMessage(data, status));
            waitNoMore();
        });
    $scope.showDutyList = function (name) {
        $scope.duties = dutyList;
        $scope.patrollers = [];
    };
    $scope.dutyPicked = function () {
        $scope.duties = [];
    };
    $scope.update = function () {
        var patrolPrefix = localStorage.getItem('DspPatrolPrefix'),
            body = { resource: [{
                id: schedule.id,
                tenantId: patrolPrefix,
                patrollerId: schedule.patrollerId,
                name: schedule.name,
                activityDate: schedule.activityDate,
                activity: schedule.activity,
                duty: $scope.duty.duty,
                equipment: $scope.equipment,
                comments: $scope.comments,
                credits: $scope.credits
            }]},
            scheduleRequest = dspRequest('PUT', '/team/_table/Schedule', body);
        havePatience($rootScope);
        $scope.message = '';
        $http(scheduleRequest).
            success(function (data, status, headers, config) {
                waitNoMore();
                patrolNavigator.pushPage('patrol/sheet.html');
            }).
            error(function (data, status, headers, config) {
                $scope.message = niceMessage(data, status);
                AccessLogService.log('error', 'PostScheduleErr', niceMessage(data, status));
                waitNoMore();
            });
    };
    $scope.remove = function () {
        var scheduleRequest = dspRequest('DELETE', '/team/_table/Schedule/' + schedule.id, null);
        havePatience($rootScope);
        $scope.message = '';
        $http(scheduleRequest).
            success(function (data, status, headers, config) {
                waitNoMore();
                patrolNavigator.pushPage('patrol/sheet.html');
            }).
            error(function (data, status, headers, config) {
                $scope.message = niceMessage(data, status);
                AccessLogService.log('error', 'DeleteScheduleErr', niceMessage(data, status));
                waitNoMore();
            });
    };
    $scope.close = function () {
        patrolNavigator.pushPage('patrol/sheet.html');
    };
    $scope.back = function () {
        patrolNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});