/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.controller('RootCtrl', ['$scope', '$location', 'FirebaseApi', function($scope, $location, api) {

        $scope.api = api;

        $scope.signout = function() {
            console.log(api);
            api.auth.signout().then(function() {
                $location.path('/');
            });
        };

        api.auth.current().then(function(user) {
            $scope.user = user;
            console.log(user);
        }, function error(response) {
            console.log('RootCtrl.error', response);
        });

    }]);

    app.controller('HomeCtrl', ['$scope', 'State', 'FirebaseApi', function($scope, State, api) {

        var state = $scope.state = new State();

        var map = $scope.map = {};

        api.facilities().then(function(items) {
            $scope.map.items = items;
            // console.log(items);
            state.ready();
        }, function(error) {
            state.error(error);
        })

        state.ready();

    }]);

    app.controller('ProfileCtrl', ['$scope', 'State', 'FirebaseApi', 'user', function($scope, State, api, user) {

        var state = $scope.state = new State();

        var modes = $scope.MODES = {
            BEACH: 1,
            PRICES: 2,
            PLACE: 3,
            OPENING: 4,
            INFO: 5,
        };
        var mode = $scope.mode = modes.BEACH;

        var model = $scope.model = {
            shopName: user.shopName,
            address: user.address,
            number: user.number,
            postalCode: user.postalCode,
            locality: user.locality,
            city: user.city,
            province: user.province,
            region: user.region,
            country: user.country,
            position: user.position,
        };

        var map = $scope.map = {};

        var beach = $scope.beach = user.beach || {
            items: [],
            cols: 0,
            rows: 0,
        };

        var controls = $scope.controls = {

        };

        $scope.submit = function(key) {
            // console.log('ProfileCtrl.submit', key);
            // form.$valid && 
            if (state.busy(key)) {
                // console.log('state', state);
                // angular.extend(user, model);
                angular.forEach(model, function(value, key) {
                    if (value) {
                        user[key] = value;
                    } else {
                        delete user[key];
                    }
                });
                user.beach = beach;
                api.users.save(user).then(function success(response) {
                    console.log('response', response);
                    state.success();
                }, function error(response) {
                    state.error(response);
                });
            }
        };

        $scope.saveItems = function(key) {
            $scope.submit(key);
        };

        /*
                var glControls = {
                    navigation: {
                        enabled: true,
                        options: {} // Navigation control options --> https://www.mapbox.com/mapbox-gl-js/api/#Navigation
                    },
                    scale: {
                        enabled: true,
                        options: {} // Scale control options --> https://www.mapbox.com/mapbox-gl-js/api/#Scale
                    },
                    attribution: {
                        enabled: false,
                        options: {} // Attribution control options --> https://www.mapbox.com/mapbox-gl-js/api/#Attribution
                    },
                    geolocate: {
                        enabled: true,
                        options: {} // Geolocate control options --> https://www.mapbox.com/mapbox-gl-js/api/#Geolocate
                    },
                    geocoder: {
                        enabled: true,
                        options: {} // Geocoder control options --> https://github.com/mapbox/mapbox-gl-geocoder/blob/master/API.md
                    },
                    directions: {
                        enabled: false,
                        options: {} // Directions control options --> https://github.com/mapbox/mapbox-gl-directions/blob/master/API.md#mapboxgldirections
                    },
                    draw: {
                        enabled: false,
                        options: {} // Draw control options -> https://github.com/mapbox/mapbox-gl-draw/blob/master/API.md#options
                    }
                };

                $scope.glControls = glControls;
        */
    }]);

    app.controller('DashboardCtrl', ['$scope', 'State', 'FirebaseApi', 'user', function($scope, State, api, user) {

        var state = $scope.state = new State();

        state.ready();

        api.items().then(function(items) {
            console.log('DashboardCtrl.items', items);
            $scope.items = items;
        });

    }]);

    app.controller('SigninCtrl', ['$scope', 'State', 'Router', 'FirebaseApi', function($scope, State, router, api) {

        var state = $scope.state = new State();

        var model = $scope.model = {};

        $scope.submit = function(key) {
            if (state.busy(key)) {
                api.auth.signin(model).then(function success(response) {
                    // console.log('SigninCtrl', response);
                    state.success();
                    router.retry('/dashboard');
                }, function error(response) {
                    console.log('SigninCtrl.error', response);
                    state.error(response);
                });
            }
        };

    }]);

    app.controller('SignupCtrl', ['$scope', 'State', 'Router', 'FirebaseApi', function($scope, State, router, api) {

        var state = $scope.state = new State();

        var model = $scope.model = {};

        $scope.submit = function(key) {
            if (state.busy(key)) {
                api.auth.signup(model).then(function success(response) {
                    // console.log('SignupCtrl', path, response);
                    state.success();
                    router.retry('/dashboard');
                }, function error(response) {
                    console.log('SignupCtrl.error', response);
                    state.error(response);
                });
            }
        };

    }]);

}());