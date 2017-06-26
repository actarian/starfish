/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

        $routeProvider.when('/', {
            title: 'Homepage',
            templateUrl: 'partials/home.html',
            controller: 'HomeCtrl',
            resolve: {
                user: ['FirebaseApi', function(api) {
                    return api.current();
                }],
            },

        }).when('/profile', {
            title: 'Profile',
            templateUrl: 'partials/profile.html',
            controller: 'ProfileCtrl',
            resolve: {
                user: ['FirebaseApi', function(api) {
                    return api.isLoggedOrGoTo('/signin');
                }],
            },

        }).when('/signin', {
            title: 'Accedi',
            templateUrl: 'partials/signin.html',
            controller: 'SigninCtrl',

        }).when('/signup', {
            title: 'Registrazione',
            templateUrl: 'partials/signup.html',
            controller: 'SignupCtrl',

        }).when('/dashboard', {
            title: 'Dashboard',
            templateUrl: 'partials/dashboard.html',
            controller: 'DashboardCtrl',
            resolve: {
                user: ['FirebaseApi', function(api) {
                    return api.isLoggedOrGoTo('/signin');
                }],
            },

        }).when('/user/:userId', {
            title: 'User',
            templateUrl: 'partials/user.html',
            controller: 'UserCtrl',
            resolve: {
                user: ['FirebaseApi', function(api) {
                    return api.isLoggedOrGoTo('/signin');
                }],
            },

        }).when('/404', {
            title: 'Error 404',
            templateUrl: 'partials/404',

        });

        $routeProvider.otherwise('/'); // stream

        // HTML5 MODE url writing method (false: #/anchor/use, true: /html5/url/use)
        $locationProvider.html5Mode(false);
        $locationProvider.hashPrefix('');

    }]);

}());