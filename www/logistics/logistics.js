/*jshint strict: true */
/*jshint unused: false */
/*jslint node: true */
/*jslint indent: 4 */
/*jslint unparam:true */
/*global window, document, navigator, localStorage, ons, angular, module, moment, Math, LatLon, google, dspRequest, logisticsNavigator, dial, browse, niceMessage, havePatience, waitNoMore, numberWithCommas */
"use strict";

/*
Ski Patrol Mobile App
Copyright © 2014-2022, Gary Meyer.
All rights reserved.
*/

var sampling = false;

/*
Logistics.
*/
module.controller('LogisticsController', function ($rootScope, $scope, $http, AccessLogService) {
    var patrol = angular.fromJson(localStorage.getItem('DspPatrol')),
        role = localStorage.getItem('DspRole'),
        maps = angular.fromJson(localStorage.getItem('DspMap')),
        mapRequest = dspRequest('GET', '/team/_table/Map?order=name', null),
        i;
    AccessLogService.log('info', 'Logistics');
    sampling = false;
    $scope.maps = maps;
    if ((maps) && maps.length > 0) {
        $scope.showMaps = true;
    } else {
        $scope.showMaps = false;
    }
    $http(mapRequest).
        success(function (data, status, headers, config) {
            $scope.maps = data.resource;
            if ((data.resource) && data.resource.length > 0) {
                $scope.showMaps = true;
            } else {
                $scope.showMaps = false;
            }
            localStorage.setItem('DspMap', angular.toJson(data.resource));
        }).
        error(function (data, status, headers, config) {
            AccessLogService.log('error', 'GetMapErr', niceMessage(data, status));
        });
    $scope.viewMap = function (index) {
        var maps = angular.fromJson(localStorage.getItem('DspMap'));
        if (maps && maps[index]) {
            localStorage.setItem('OnsMap', angular.toJson(maps[index]));
            logisticsNavigator.pushPage('logistics/map.html');
        }
    };
    ons.ready(function () {
        return;
    });
});

/*
Map.
*/
module.controller('MapController', function ($scope, $http, AccessLogService) {
    var map = angular.fromJson(localStorage.getItem('OnsMap'));
    AccessLogService.log('info', 'Map', map.name);
    $scope.name = map.name;
    $scope.address = map.address;
    // https://res.cloudinary.com/skipatrol/image/upload/c_scale,r_0,w_300/v1444166196/WinterParkGuestMap.jpg
    if (map.address.indexOf('res.cloudinary.com')  > 0) {
        $scope.thumbnailAddress = map.address.replace("/upload/", "/upload/c_scale,r_0,w_300/");        
    } else {
        // $scope.thumbnailAddress = 'https://api.thumbalizr.com/?url=' + map.address;
        $scope.thumbnailAddress = map.address;
    }
    $scope.view = function () {
        browse($scope.address);
    };
    $scope.close = function () {
        logisticsNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});