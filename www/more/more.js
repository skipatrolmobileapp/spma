/*jshint strict: true */
/*jshint unused: false */
/*jslint node: true */
/*jslint indent: 4 */
/*jslint unparam:true*/
/*global localStorage, ons, angular, module, dspRequest, moreNavigator, youtube */
"use strict";

/*
Ski Patrol Mobile App
Copyright © 2014-2015, Gary Meyer.
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
        adRequest = dspRequest('GET', '/db/Ad', null),
        role = localStorage.getItem('DspRole'),
        i;
    AccessLogService.log('info', 'More');
    $scope.enableAd = false;
    if (('Guest' == role) && (ads) && ('Yes' === patrol.showAds)) {
        for (i = 0; i < ads.length; i += 1) {
            if ('more' === ads[i].slot) {
                $scope.adImageAddress = ads[i].imageAddress;
                $scope.adLinkAddress = ads[i].linkAddress;
                $scope.enableAd = true;
            }
        }
    }
    if ('WinterPark' === patrolPrefix) {
        $scope.termsDocName = 'Terms of Service';
    } else {
        $scope.termsDocName = 'Acceptable Use Policy';
    }
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
        if ('WinterPark' === patrolPrefix) {
            moreNavigator.pushPage('more/terms.html');
        } else {
            moreNavigator.pushPage('more/termsm52.html');
        }
    };
    $scope.viewPrivacy = function () {
        if ('WinterPark' === patrolPrefix) {
            moreNavigator.pushPage('more/privacy.html');
        } else {
            moreNavigator.pushPage('more/privacym52.html');
        }
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
Let the user update their profile.
*/
module.controller('ProfileController', function ($rootScope, $scope, $http, AccessLogService) {
    var patrolPrefix = localStorage.getItem('DspPatrolPrefix'),
        role = localStorage.getItem('DspRole'),
        profileRequest = dspRequest('GET', '/user/profile', null),
        getPatrollerRequest = null;    
    AccessLogService.log('info', 'Profile');
    havePatience($rootScope);
    profileRequest.cache = false;
    $http(profileRequest).
        success(function (data, status, headers, config) {
            $scope.email = data.email;
            $scope.name = data.first_name;
            $scope.phone = data.phone;
            localStorage.setItem('DspName', data.first_name);
            getPatrollerRequest = dspRequest('GET', '/db/Patroller?filter=email%3D"' + data.email + '"', null);
            getPatrollerRequest.cache = false;
            $http(getPatrollerRequest).
                success(function (data, status, headers, config) {
                    if ((data.record) && (data.record.length > 0)) {
                        localStorage.setItem('OnsPatroller', angular.toJson(data.record[0]));
                        waitNoMore();
                    } else {
                        localStorage.removeItem('OnsPatroller');
                    }
                }).
                error(function (data, status, headers, config) {
                    AccessLogService.log('error', 'GetPatrollerErr', niceMessage(data, status));
                    $scope.message = data.error[0].message;
                    waitNoMore();
                });
        }).
        error(function (data, status, headers, config) {
            AccessLogService.log('warn', 'GetProfileErr', data);
            localStorage.removeItem('DspPassword');
            $scope.message = data.error[0].message;
            waitNoMore();
        });
    $scope.update = function () {
        var body = {
                'email': $scope.email,
                'first_name': $scope.name,
                'phone': $scope.phone
            },
            postProfileRequest = dspRequest('POST', '/user/profile', body),
            patroller = angular.fromJson(localStorage.getItem('OnsPatroller')),
            patrollerRequest = null;
        if (!$scope.email) {
            $scope.message = 'Email is required. Try again.';
        } else {
            $scope.message = '';
            havePatience($rootScope);
            $http(postProfileRequest).
                success(function (data, status, headers, config) {
                    if (patroller) {
                        patroller.name = $scope.name;
                        patroller.cellPhone = $scope.phone;
                        patroller.tenantId = patrolPrefix;
                        patrollerRequest = dspRequest('PUT', '/db/Patroller', patroller);
                        $http(patrollerRequest).
                            success(function (data, status, headers, config) {
                                localStorage.setItem('DspName', $scope.name);
                                waitNoMore();
                                moreNavigator.popPage();
                            }).
                            error(function (data, status, headers, config) {
                                AccessLogService.log('error', 'PutPatrollerErr', niceMessage(data, status));
                                $scope.message = niceMessage(data, status);
                                waitNoMore();
                            });
                    } else {
                        patroller = {
                            'tenantId': patrolPrefix,
                            'email': $scope.email,
                            'name': $scope.name,
                            'status': '',
                            'cellPhone': $scope.phone,
                            'homePhone': '',
                            'alternatePhone': '',
                            'scheduleIndicator': '',
                            'additionalEmail': ''
                        };
                        if ('Guest' !== role) {
                            patrollerRequest = dspRequest('POST', '/db/Patroller', patroller);
                            $http(patrollerRequest).
                                success(function (data, status, headers, config) {
                                    $scope.message = 'Profile created.';
                                    localStorage.setItem('DspName', $scope.name);
                                    waitNoMore();
                                }).
                                error(function (data, status, headers, config) {
                                    $scope.message = niceMessage(data, status);
                                    AccessLogService.log('error', 'PostPatrollerErr', niceMessage(data, status));
                                });
                        }
                    }
                }).
                error(function (data, status, headers, config) {
                    $scope.message = niceMessage(data, status);
                    AccessLogService.log('error', 'PostProfileErr', niceMessage(data, status));
                });
        }
    };
    $scope.close = function () {
        moreNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Let the user change their password.
*/
module.controller('PasswordController', function ($rootScope, $scope, $http, AccessLogService) {
    var profileRequest = dspRequest('GET', '/user/profile', null);
    AccessLogService.log('info', 'Password');
    havePatience($rootScope);
    profileRequest.cache = false;
    $http(profileRequest).
        success(function (data, status, headers, config) {
            waitNoMore();
        }).
        error(function (data, status, headers, config) {
            AccessLogService.log('warn', 'GetProfileErr', data);
            localStorage.removeItem('DspPassword');
            $scope.message = data.error[0].message;
            waitNoMore();
        });
    $scope.update = function () {
        var body = {
                'old_password': $scope.currentPassword,
                'new_password': $scope.newPassword
            },
            passwordRequest = dspRequest('POST', '/user/password', body);
        if (!$scope.currentPassword) {
            $scope.message = 'Current password is required. Try again.';
        } else if (!$scope.newPassword) {
            $scope.message = 'New password is required. Try again.';
        } else if (!$scope.repeatNewPassword) {
            $scope.message = 'Repeat new password is required. Try again.';
        } else if ($scope.newPassword !== $scope.repeatNewPassword) {
            $scope.message = 'Passwords do not match. Try again.';
        } else {
            $scope.message = '';
            havePatience($rootScope);
            $http(passwordRequest).
                success(function (data, status, headers, config) {
                    AccessLogService.log('info', 'ChangePassword');
                    $scope.message = 'Password changed.';
                    waitNoMore();
                    moreNavigator.popPage();
                }).
                error(function (data, status, headers, config) {
                    AccessLogService.log('warn', 'PostPasswordErr', $scope.message);
                    $scope.message = niceMessage(data, status);
                    waitNoMore();
                });
        }
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

/*
Dump the diagnostics.
*/
module.controller('DiagnosticsController', function ($scope, AccessLogService) {
    AccessLogService.log('info', 'Diagnostics');
    try {
        if (IN_CORDOVA) {
            $scope.platform = device.platform;
            $scope.version = device.version;
            $scope.model = device.model;
        } else {
            $scope.platform = navigator.userAgent;
            $scope.version = '';
            $scope.model = '';
        }
        $scope.userId = localStorage.getItem('DspUserId');
        $scope.email = localStorage.getItem('DspEmail');
        $scope.password = null !== localStorage.getItem('DspPassword');
        $scope.patrolPrefix = localStorage.getItem('DspPatrolPrefix');
        $scope.patrolName = angular.fromJson(localStorage.getItem('DspSettings')).patrolName;
        AccessLogService.log('info', 'DxEmail', localStorage.getItem('DspEmail'));
        AccessLogService.log('info', 'DxPatrolPrefix', localStorage.getItem('DspPatrolPrefix'));
        AccessLogService.log('info', 'DxSettings', localStorage.getItem('DspSettings'));
        AccessLogService.log('info', 'DxCall', localStorage.getItem('DspCall'));
        AccessLogService.log('info', 'DxMyWeather2', localStorage.getItem('DspMyWeather2'));
        AccessLogService.log('info', 'DxOpenSnow', localStorage.getItem('DspOpenSnow'));
        AccessLogService.log('info', 'DxFacilities', localStorage.getItem('DspFacilities'));
        AccessLogService.log('info', 'DxLiveCam', localStorage.getItem('DspLiveCam'));
        AccessLogService.log('info', 'DxTerritory', localStorage.getItem('DspTerritory'));
        AccessLogService.log('info', 'DxMap', localStorage.getItem('DspMap'));
    } catch (err) {
        AccessLogService.log('error', 'DxErr', err);
    }
    $scope.close = function () {
        moreNavigator.popPage();
    };
    ons.ready(function () {
        return;
    });
});

/*
Log the user out.
*/
module.controller('LogoutController', function ($rootScope, $scope, $http, AccessLogService) {
    var sessionRequest = dspRequest('DELETE', '/user/session', null);
    AccessLogService.log('info', 'Logout');
    localStorage.removeItem('DspPassword');
    localStorage.removeItem('DspRole');
    localStorage.removeItem('DspActivity');
    localStorage.removeItem('DspPost');
    localStorage.removeItem('DspAed');
    localStorage.removeItem('DspEvent');
    localStorage.removeItem('DspFacilities');
    localStorage.removeItem('DspLiveCam');
    localStorage.removeItem('DspMap');
    localStorage.removeItem('DspMyWeather2');
    localStorage.removeItem('DspNickname');
    localStorage.removeItem('DspOpenSnow');
    localStorage.removeItem('DspPatroller');
    localStorage.removeItem('DspPhone');
    localStorage.removeItem('DspSchedule');
    localStorage.removeItem('DspSweep');
    localStorage.removeItem('DspTerritory');
    localStorage.removeItem('DspToboggan');
    localStorage.removeItem('DspTrailCheck');
    localStorage.removeItem('OnsAed');
    localStorage.removeItem('OnsArea');
    localStorage.removeItem('OnsEvent');
    localStorage.removeItem('OnsMap');
    localStorage.removeItem('OnsMetrics');
    localStorage.removeItem('OnsNickname');
    localStorage.removeItem('OnsPatroller');
    localStorage.removeItem('OnsPhone');
    localStorage.removeItem('OnsSweep');
    localStorage.removeItem('OnsTerritory');
    localStorage.removeItem('OnsToboggan');
    localStorage.removeItem('OnsTrailCheck');
    $rootScope.hideTabs = true;
    $http(sessionRequest).
        success(function (data, status, headers, config) {
            AccessLogService.log('info', 'LoggedOut', niceMessage(data, status));
        }).
        error(function (data, status, headers, config) {
            AccessLogService.log('error', 'LogoutErr', niceMessage(data, status));
        });
    $scope.login = function () {
        window.location.reload();
    };
    $scope.exit = function () {
        navigator.app.exitApp();
    };
    ons.ready(function () {
        return;
    });
});