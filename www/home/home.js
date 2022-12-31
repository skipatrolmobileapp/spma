/*jshint strict: true */
/*jshint unused: false */
/*jslint node: true */
/*jslint indent: 4 */
/*jslint unparam:true */
/*global navigator, localStorage, ons, angular, module, DSP_BASE_URL, DSP_API_KEY, dspRequest, homeNavigator, havePatience, waitNoMore, browse, niceMessage */
"use strict";

/*
Ski Patrol Mobile App
Copyright © 2014-2022, Gary Meyer.
All rights reserved.
*/

var haveInitializedApp = false;

/*
Start the app. Direct the user to register, login, or just show the live home screen.
*/
module.controller('HomeController', function ($rootScope, $scope, $http, AccessLogService) {
    var patrolPrefix = localStorage.getItem('DspPatrolPrefix'),
        role = localStorage.getItem('DspRole'),
        email = localStorage.getItem('DspEmail'),
        password = localStorage.getItem('DspPassword'),
        introDone = localStorage.getItem('OnsIntroDone'),
        body = {
            email: email,
            password: password,
            duration: 31104000
        },
        regBody = {
            email: email,
            password: 'Password=' + password,
            first_name: localStorage.getItem('DspName'),
            last_name: localStorage.getItem('DspPatrolPrefix'),
            name: localStorage.getItem('DspName') + ' (' + localStorage.getItem('DspPatrolPrefix') + ')',
            display_name: localStorage.getItem('DspName') + ' (' + localStorage.getItem('DspPatrolPrefix') + ')'
        },
        registrationRequest = dspRequest('POST', '/user/register?login=true', regBody),
        sessionRequest = dspRequest('POST', '/user/session', body),
        patrolRequest = dspRequest('GET', '/team/_table/PatrolOrg?filter=tenantId="' + patrolPrefix + '"', null);
    AccessLogService.log('info', 'Home', 'Load');
    $rootScope.homeTab = true;
    $rootScope.logisticsTab = null;
    if (haveInitializedApp) {
        $rootScope.hideTabs = false;
        homeNavigator.resetToPage('home/live.html', {animation: 'none'});
    } else {
        if (!password) {
            if (!email) {
                $rootScope.hideTabs = true;
                homeNavigator.resetToPage('home/intro.html', {animation: 'none'});
            } else if (email === '') {
                $rootScope.hideTabs = true;
                homeNavigator.resetToPage('home/intro.html', {animation: 'none'});
            } else {
                $rootScope.hideTabs = true;
                homeNavigator.resetToPage('home/login.html', {animation: 'none'});
            }
        } else {
          $http(sessionRequest).
              success(function (data, status, headers, config) {
                  $scope.loading = '';
                  localStorage.setItem('DspUserId', data.id);
                  localStorage.setItem('DspEmail', body.email);
                  localStorage.setItem('DspPassword', body.password);
                  localStorage.setItem('DspRole', data.role);
                  localStorage.setItem('DspName', data.first_name);
                  localStorage.setItem('DspPatrolPrefix', data.last_name);
                  AccessLogService.log('info', 'Session', data.first_name);
                  $http(patrolRequest).
                      success(function (data, status, headers, config) {
                          var alertRoles,
                              i;
                          localStorage.setItem('DspPatrol', angular.toJson(data.resource[0]));
                          $scope.loading = '';
                          haveInitializedApp = true;
                          $rootScope.hideTabs = false;
                          homeNavigator.resetToPage('home/live.html', {animation: 'none'});
                          waitNoMore();
                          if (data.resource[0].alert) {
                              alertRoles = data.resource[0].alertRolesCsv.split(',');
                              for (i = 0; i < alertRoles.length; i += 1) {
                                  if ((alertRoles[i] === role) && (data.resource[0].alert)) {
                                      ons.notification.alert({
                                          "title": "Notice",
                                          "message": data.resource[0].alert
                                      });
                                  }
                              }
                          }
                      }).
                      error(function (data, status, headers, config) {
                          AccessLogService.log('info', 'PatrolErr', data);
                          $rootScope.hideTabs = false;
                          homeNavigator.resetToPage('home/live.html', {animation: 'none'});
                          waitNoMore();
                      });
              }).
              error(function (data, status, headers, config) {
                  AccessLogService.log('info', 'SessionErr', data);
                  if (data.error && data.error.code && (401 === data.error.code)) {
                    localStorage.removeItem('DspPassword');
                    $rootScope.hideTabs = true;
                    homeNavigator.resetToPage('home/reconfirm.html', {animation: 'none'});
                  } else {
                    $rootScope.hideTabs = false;
                    homeNavigator.resetToPage('home/live.html', {animation: 'none'});
                  }
              });
        }
    }

    ons.ready(function () {
        return;
    });
});

/*
Let the user register with the new, simple email-based registration scheme.
*/
module.controller('IntroController', function ($rootScope, $scope, $http, AccessLogService) {
    var apiRequest = dspRequest('GET', '/', null),
        databaseRequest = dspRequest('GET', '/team/_proc/Ping', null);
    AccessLogService.log('info', 'Intro');
    localStorage.removeItem('DspPatrolPrefix');
    localStorage.removeItem('DspPassword');
    $scope.email = localStorage.getItem('DspEmail');
    $scope.focusElement = "email";
    $scope.happy = true;
    if(navigator.connection.type === 'none') {
        AccessLogService.log('error', 'UnhappyInternet', niceMessage(data, status));
        $scope.message = 'Oops! An error has occured. Please try again later.';
        $scope.unhappyinternet = 'Internet error: Connection type = ' + navigator.connection.type;
        $scope.happy = false;
    }
    $http(apiRequest).
        success(function (data, status, headers, config) {
            AccessLogService.log('info', 'HappyApi', niceMessage(data, status));
        }).
        error(function (data, status, headers, config) {
            AccessLogService.log('error', 'UnhappyApi', niceMessage(data, status));
            $scope.message = 'Oops! An error has occured. Please try again later.';
            $scope.unhappyapi = 'API error: ' + niceMessage(data, status);
            $scope.happy = false;
        });
    $http(databaseRequest).
        success(function (data, status, headers, config) {
            AccessLogService.log('info', 'HappyDatabase', niceMessage(data, status));
        }).
        error(function (data, status, headers, config) {
            AccessLogService.log('error', 'UnhappyDatabase', niceMessage(data, status));
            $scope.message = 'Oops! An error has occured. Please try again later.';
            $scope.unhappydatabase = 'Database error: ' + niceMessage(data, status);
            $scope.happy = false;
        });
    $scope.setup = function () {
        var email = $scope.email,
            getPatrollerRequest = dspRequest('GET', '/team/_proc/GetPatroller(' + email + ')', null);
        $scope.message = 'Checking email...';
        if (!email) {
            $scope.message = 'Email address is required for set up.';
        } else if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
            $scope.message = 'Enter a properly formatted email address.';
        } else {
            localStorage.setItem('DspEmail', email);
            $http(getPatrollerRequest).
                success(function (data, status, headers, config) {
                    var patrolPrefix = null,
                        body = {
                            email: email,
                            first_name: '',
                            last_name: '',
                            display_name: ''
                        },
                        registrationRequest = null;
                    AccessLogService.log('info', 'GetPatroller');
                    if (1 === data.length) {
                        patrolPrefix = data[0].tenantId;
                        localStorage.setItem('DspPatrolPrefix', patrolPrefix);
                        body.first_name = data[0].name;
                        body.last_name = patrolPrefix;
                        body.display_name = data[0].name + ' (' + patrolPrefix + ')';
                        registrationRequest = dspRequest('POST', '/user/register', body);
                        $scope.message = 'Sending confirmation email...';
                        $http(registrationRequest).
                            success(function (data, status, headers, config) {
                                AccessLogService.log('info', 'Registration');
                                homeNavigator.pushPage('home/login.html');
                                waitNoMore();
                            }).
                            error(function (data, status, headers, config) {
                                var resetBody = {
                                  email: $scope.email
                                },
                                passwordResetRequest = dspRequest('POST', '/user/password?reset=true', resetBody);
                                AccessLogService.log('warn', 'RegistrationErr', niceMessage(data, status));
                                if ($scope.email !== 'jklugnut@hotmail.com') {
                                    $http(passwordResetRequest).
                                        success(function (data, status, headers, config) {
                                            AccessLogService.log('info', 'LostPassword');
                                            homeNavigator.pushPage('home/login.html');
                                            localStorage.removeItem('DspPassword');
                                            waitNoMore();
                                        }).
                                        error(function (data, status, headers, config) {
                                            AccessLogService.log('error', 'LostPasswordErr', niceMessage(data, status));
                                            $scope.message = niceMessage(data, status);
                                            waitNoMore();
                                        });
                                } else {
                                    AccessLogService.log('info', 'TestLogin');
                                    homeNavigator.pushPage('home/login.html');
                                    localStorage.removeItem('DspPassword');
                                    waitNoMore();
                                }
                            });
                    } else {
                        $scope.message = 'App is available only to registered patrollers.';
                        email = null;
                        localStorage.removeItem('DspPatrolPrefix');
                        localStorage.removeItem('DspEmail');
                        localStorage.removeItem('DspPassword');
                    }
                    waitNoMore();
                }).
               error(function (data, status, headers, config) {
                    AccessLogService.log('warn', 'GetPatrollerErr', niceMessage(data, status));
                    $scope.message = niceMessage(data, status);
                    waitNoMore();
                });
        }
    };
    ons.ready(function () {
        return;
    });
});

/*
Let the user send me an email for help.
*/
module.controller('RegErrorController', function ($scope, AccessLogService) {
    AccessLogService.log('info', 'RegError');
    $scope.email = function () {
        sendEmail('gary@meyer.net', 'Ski%20Patrol%20Mobile%20App%20Registration%20Error');
    };
    $scope.exit = function () {
        navigator.app.exitApp();
    };
    ons.ready(function () {
        return;
    });
});

/*
Log in the user.
*/
module.controller('LoginController', function ($rootScope, $scope, $http, AccessLogService) {
    var user = localStorage.getItem('DspEmail');
    AccessLogService.log('info', 'Login');
    $rootScope.hideTabs = true;
    $scope.focusElement = "password";
    $scope.login = function () {
        var body = {
                email: user,
                password: $scope.password,
                duration: 31104000
            },
            sessionRequest = dspRequest('POST', '/user/session', body);
        if (!$scope.password) {
            $scope.message = 'Confirmation code is required. Try again.';
        } else {
            havePatience($rootScope);
            $http(sessionRequest).
                success(function (data, status, headers, config) {
                    AccessLogService.log('info', 'Authenticated', data.first_name);
                    localStorage.setItem('DspUserId', data.id);
                    localStorage.setItem('DspPassword', body.password);
                    localStorage.setItem('DspRole', data.role);
                    localStorage.setItem('DspName', data.first_name);
                    localStorage.setItem('DspPatrolPrefix', data.last_name);
                    if (!localStorage.getItem('OnsIntroDone')) {
                        localStorage.setItem('OnsIntroDone', new Date());
                    }
                    $rootScope.hideTabs = false;
                    waitNoMore();
                    homeNavigator.resetToPage('home/home.html');
                }).
                error(function (data, status, headers, config) {
                    AccessLogService.log('warn', 'LoginErr', $scope.message);
                    $scope.message = niceMessage(data, status);
                    waitNoMore();
                });
        }
    };
    $scope.resetPassword = function () {
        var body = {
                email: user
            },
            passwordResetRequest = dspRequest('POST', '/user/password?reset=true', body);
          havePatience($rootScope);
          $http(passwordResetRequest).
              success(function (data, status, headers, config) {
                  AccessLogService.log('info', 'LostPassword');
                  $scope.message = ('Check your email for a link to generate a new confirmation code.');
                  localStorage.removeItem('DspPassword');
                  waitNoMore();
              }).
              error(function (data, status, headers, config) {
                  AccessLogService.log('error', 'LostPasswordErr', niceMessage(data, status));
                  $scope.message = niceMessage(data, status);
                  waitNoMore();
              });
    };
    $scope.register = function () {
        AccessLogService.log('info', 'StartOver');
        localStorage.clear();
        window.location = 'index.html';
    };
    $scope.exit = function () {
        navigator.app.exitApp();
    };
    ons.ready(function () {
        return;
    });
});

/*
Live feeds.
*/
module.controller('LiveController', function ($scope, $http, AccessLogService) {
    var patrolPrefix = localStorage.getItem('DspPatrolPrefix'),
        role = localStorage.getItem('DspRole'),
        patrol = angular.fromJson(localStorage.getItem('DspPatrol')),
        categories = [],
        priorCategory,
        contents = angular.fromJson(localStorage.getItem('DspContent')),
        contentRequest = dspRequest('GET', '/team/_table/Content?order=category,title', null),
        settings = angular.fromJson(localStorage.getItem('DspSetting')),
        settingRequest = dspRequest('GET', '/team/_table/Setting?order=name', null),
        territories = angular.fromJson(localStorage.getItem('DspTerritory')),
        territoryRequest = dspRequest('GET', '/team/_table/Territory?order=code', null),
        openWeatherMap = angular.fromJson(localStorage.getItem('DspOpenWeatherMap')),
        openWeatherMapRequest = dspRequest('GET', '/openweathermap?lat=' + patrol.latitude + '&lon=' + patrol.longitude, null),
        days = [],
        n = 0,
        i = 0,
        liveCam = angular.fromJson(localStorage.getItem('DspLiveCam')),
        liveCamRequest = dspRequest('GET', '/team/_table/LiveCam', null),
        isMountainCam,
        mountainCamCount = 0,
        travelCamCount = 0,
        email = localStorage.getItem('DspEmail'),
        patrollerRequest = dspRequest('GET',  '/team/_proc/GetPatroller(' + email + ')', null);
    AccessLogService.log('info', 'Live');
    $scope.role = role;
    $http(territoryRequest).
        success(function (data, status, headers, config) {
            territories = data.resource;
            localStorage.setItem('DspTerritory', angular.toJson(territories));
        }).
        error(function (data, status, headers, config) {
            AccessLogService.log('error', 'GetTerritoryErr', niceMessage(data, status));
        });
    if ('Basic' === role || 'Power' === role || 'Leader' === role) {
        $http(settingRequest).
            success(function (data, status, headers, config) {
                settings = data.resource;
                localStorage.setItem('DspSetting', angular.toJson(settings));
            }).
            error(function (data, status, headers, config) {
                AccessLogService.log('error', 'GetSettingErr', niceMessage(data, status));
            });
    }
    $scope.days = [];
    $scope.areas = [];
    if (openWeatherMap) {
        if ((openWeatherMap.main) && (openWeatherMap.main.temp)) {
            if ('USA' === patrol.country) {
                $scope.openWeather = Math.round(openWeatherMap.main.temp) + '°F';
            } else {
                $scope.openWeather = Math.round((openWeatherMap.main.temp - 32) * 0.5556) + '°C';
            }
            if (openWeatherMap.name) {
                $scope.town = openWeatherMap.name;
            } else {
                $scope.town = 'town';
            }
        }
    }
    if (liveCam && territories) {
        mountainCamCount = 0;
        travelCamCount = 0;
        for (i = 0; i < liveCam.length; i += 1) {
            isMountainCam = false;
            for (n = 0; n < territories.length; n += 1) {
                if (liveCam[i].territory === territories[n].code) {
                    if (territories[n].onResort === 'Yes') {
                        isMountainCam = true;
                    }
                }
            }
            if (isMountainCam) {
                mountainCamCount += 1;
            } else {
                travelCamCount += 1;
            }
        }
        if (mountainCamCount > 0) {
            $scope.liveCams = 'On-Mountain Live Cams';                
        } else {
            $scope.liveCams = null;
        }
        if (travelCamCount > 0) {
            $scope.travelCams = 'Road Live Cams';                
        } else {
            $scope.travelCams = null;
        }
    } else {
        $scope.liveCams = null;
        $scope.travelCams = null;
    }
    if ((patrol.latitude) && (patrol.longitude)) {
        $http(openWeatherMapRequest).
            success(function (data, status, headers, config) {
                if ((data.main) && (data.main.temp)) {
                    if ('USA' === patrol.country) {
                        $scope.openWeather = Math.round(data.main.temp) + '°F';
                    } else {
                        $scope.openWeather = Math.round((data.main.temp - 32) * 0.5556) + '°C';
                    }
                    if (data.name) {
                        $scope.town = data.name;
                    } else {
                        $scope.town = 'town';
                    }
                }
                localStorage.setItem('DspOpenWeatherMap', angular.toJson(data));
            }).
            error(function (data, status, headers, config) {
                AccessLogService.log('error', 'GetOpenWeatherMapErr', niceMessage(data, status));
            });
    }
    if (!contents) {
        contents = [];
    }
    for (i = 0; i < contents.length; i += 1) {
        if ((!priorCategory) || (priorCategory !== contents[i].category)) {
            categories.push({
                "category": contents[i].category
            });
            priorCategory = contents[i].category;
        }
    }
    $scope.categories = categories;
    $http(patrollerRequest).
        success(function (data, status, headers, config) {
            if (1 === data.length) {
                localStorage.setItem('OnsMyPatroller', angular.toJson(data[0]));
            } else {
                AccessLogService.log('warn', 'GetMyPatrollerWarn ' + email);
            }
        }).
        error(function (data, status, headers, config) {
            AccessLogService.log('err', 'GetMyPatrollerErr', data);
        });
    $http(liveCamRequest).
        success(function (data, status, headers, config) {
            liveCam = data.resource;
            if (liveCam && territories) {
                mountainCamCount = 0;
                travelCamCount = 0;
                for (i = 0; i < liveCam.length; i += 1) {
                    isMountainCam = false;
                    for (n = 0; n < territories.length; n += 1) {
                        if (liveCam[i].territory === territories[n].code) {
                            if (territories[n].onResort === 'Yes') {
                                isMountainCam = true;
                            }
                        }
                    }
                    if (isMountainCam) {
                        mountainCamCount += 1;
                    } else {
                        travelCamCount += 1;
                    }
                }
                if (mountainCamCount > 0) {
                    $scope.liveCams = 'On-Mountain Live Cams';                
                } else {
                    $scope.liveCams = null;
                }
                if (travelCamCount > 0) {
                    $scope.travelCams = 'Road Live Cams';                
                } else {
                    $scope.travelCams = null;
                }
            } else {
                $scope.liveCams = null;
                $scope.travelCams = null;
            }
            localStorage.setItem('DspLiveCam', angular.toJson(data.resource));
        }).
        error(function (data, status, headers, config) {
            AccessLogService.log('error', 'GetLiveCamErr', niceMessage(data, status));
        });
        $http(contentRequest).
            success(function (data, status, headers, config) {
                contents = data.resource;
                priorCategory = null;
                categories = [];
                localStorage.setItem('DspContent', angular.toJson(contents));
                for (i = 0; i < contents.length; i += 1) {
                    if ((!priorCategory) || (priorCategory !== contents[i].category)) {
                        categories.push({
                            "category": contents[i].category
                        });
                        priorCategory = contents[i].category;
                    }
                }
                $scope.categories = categories;
            }).
            error(function (data, status, headers, config) {
                AccessLogService.log('error', 'GetEventErr', niceMessage(data, status));
            });


    $scope.viewCategory = function (index) {
        localStorage.setItem('OnsCategory', categories[index].category);
        homeNavigator.pushPage('home/contentcategory.html');
    };
    ons.ready(function () {
        return;
    });
});

/*
Current weather, from OpenWeatherMap.
*/
module.controller('OpenWeatherController', function ($scope, AccessLogService) {
    var patrol = angular.fromJson(localStorage.getItem('DspPatrol')),
        openWeatherMap = angular.fromJson(localStorage.getItem('DspOpenWeatherMap'));
    AccessLogService.log('info', 'OpenWeather');
    if ((openWeatherMap) && (openWeatherMap.main) && (openWeatherMap.main.temp)) {
        if ('USA' === patrol.country) {
            $scope.currentTemperature = Math.round(openWeatherMap.main.temp) + '°F';
            $scope.windSpeed = 'Wind speed: ' + Math.round(openWeatherMap.wind.speed) + ' mph';
        } else {
            $scope.currentTemperature = Math.round((openWeatherMap.main.temp - 32) * 0.5556) + '°C';
            $scope.windSpeed = 'Wind speed: ' + Math.round(1.60934 * Number(openWeatherMap.wind.speed)) + ' km/h';
        }
        $scope.windDirection = 'Wind direction: ' + writeOutBearing(openWeatherMap.wind.deg);
        $scope.humidity = 'Humidity: ' + Math.round(openWeatherMap.main.humidity) + '%';
        $scope.reportDate = 'Updated: ' + new Date(openWeatherMap.dt * 1000);
    }
    $scope.close = function () {
        homeNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Live mountain cams.
*/
module.controller('LiveCamsController', function ($scope, AccessLogService) {
    var liveCam = angular.fromJson(localStorage.getItem('DspLiveCam')),
        territories = angular.fromJson(localStorage.getItem('DspTerritory')),
        mountainCamCount = 0,
        isMountainCam = false,
        i = 0,
        n = 0,
        liveCams = [];
    AccessLogService.log('info', 'LiveCams');
    if (liveCam && territories) {
        mountainCamCount = 0;
        for (i = 0; i < liveCam.length; i += 1) {
            isMountainCam = false;
            for (n = 0; n < territories.length; n += 1) {
                if (liveCam[i].territory === territories[n].code) {
                    if (territories[n].onResort === 'Yes') {
                        isMountainCam = true;
                    }
                }
            }
            if (isMountainCam) {
                liveCams[mountainCamCount] = liveCam[i];
                mountainCamCount += 1;
            }
        }
    }
    $scope.liveCams = [];
    liveCams.sort(function (a, b) {
        var sortVal = 0;
        if (a.name < b.name) {
            sortVal = -1;
        } else if (a.name > b.name) {
            sortVal = 1;
        }
        return sortVal;
    });
    $scope.liveCams = liveCams;
    $scope.logoAddress = angular.fromJson(localStorage.getItem('DspPatrol')).logoWebAddress;
    $scope.patrolName = angular.fromJson(localStorage.getItem('DspPatrol')).patrolName;
    $scope.view = function (index) {
        browse(liveCams[index].address);        
    };
    $scope.close = function () {
        homeNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Live Travel Cams.
*/
module.controller('TravelCamsController', function ($scope, AccessLogService) {
    var liveCam = angular.fromJson(localStorage.getItem('DspLiveCam')),
        territories = angular.fromJson(localStorage.getItem('DspTerritory')),
        travelCamCount = 0,
        isTravelCam = false,
        i = 0,
        n = 0,
        liveCams = [];
    AccessLogService.log('info', 'LiveCams');
    if (liveCam && territories) {
        travelCamCount = 0;
        for (i = 0; i < liveCam.length; i += 1) {
            isTravelCam = false;
            for (n = 0; n < territories.length; n += 1) {
                if (liveCam[i].territory === territories[n].code) {
                    if (territories[n].onResort !== 'Yes') {
                        isTravelCam = true;
                    }
                }
            }
            if (isTravelCam) {
                liveCams[travelCamCount] = liveCam[i];
                travelCamCount += 1;
            }
        }
    }
    $scope.liveCams = [];
    liveCams.sort(function (a, b) {
        var sortVal = 0;
        if (a.name < b.name) {
            sortVal = -1;
        } else if (a.name > b.name) {
            sortVal = 1;
        }
        return sortVal;
    });
    $scope.liveCams = liveCams;
    $scope.logoAddress = DSP_BASE_URL + '/api/v2' + angular.fromJson(localStorage.getItem('DspPatrol')).travelCamsLogoPath + '?api_key=' + DSP_API_KEY;
    $scope.patrolName = angular.fromJson(localStorage.getItem('DspPatrol')).patrolName;
    $scope.view = function (index) {
        browse(liveCams[index].address);        
    };
    $scope.close = function () {
        homeNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Content category.
*/
module.controller('ContentCategoryController', function ($scope, $http, AccessLogService) {
    var category = localStorage.getItem('OnsCategory'),
        contents = angular.fromJson(localStorage.getItem('DspContent')),
        categoryContents = [],
        i;
    AccessLogService.log('info', 'ContentCategory', category);
    for (i = 0; i < contents.length; i += 1) {
        if (contents[i].category === category) {
            categoryContents.push(contents[i]);
        }
    }
    $scope.category = category;
    $scope.contents = categoryContents;
    $scope.viewContent = function (index) {
        localStorage.setItem('OnsContent', angular.toJson(categoryContents[index]));
        homeNavigator.pushPage('home/patrolcontent.html');
    };
    $scope.close = function () {
        homeNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Content.
*/
module.controller('PatrolContentController', function ($scope, $http, $sce, AccessLogService) {
    var content = angular.fromJson(localStorage.getItem('OnsContent')),
        patroller = angular.fromJson(localStorage.getItem('OnsMyPatroller'));
    AccessLogService.log('info', 'PatrolContent', content.title);
    $scope.title = content.title;
    $scope.icon = content.icon;
    $scope.body = $sce.trustAsHtml(content.body.replace(/(\r\n|\n|\r)/g, "<br />"));
    $scope.attachmentAddress = content.attachmentAddress;
    if (content.supportsSso === 'Yes') {
        $scope.attachmentAddress += '&id=' + patroller.id;
    }
    if (content.attachmentName) {
        $scope.attachmentName = content.attachmentName;
    } else {
        $scope.attachmentName = content.attachmentAddress;
    }
    $scope.close = function () {
        homeNavigator.popPage();
    };
    $scope.openAttachment = function () {
        AccessLogService.log('info', 'Attachment', $scope.attachmentAddress);
        browse($scope.attachmentAddress);
    };
    ons.ready(function () {
        return;
    });
});

/*
Show terms of service legal mumbo jumbo.
*/
module.controller('RegTermsController', function ($scope, AccessLogService) {
    AccessLogService.log('info', 'RegTerms');
    $scope.close = function () {
        homeNavigator.popPage();            
    };
    ons.ready(function () {
        return;
    });
});

/*
Show privacy policy legal mumbo jumbo.
*/
module.controller('RegPrivacyController', function ($scope, AccessLogService) {
    AccessLogService.log('info', 'RegPrivacy');
    $scope.close = function () {
        homeNavigator.popPage();            
    };
    ons.ready(function () {
        return;
    });
});