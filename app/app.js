/* global angular */

"use strict";

var app = angular.module('app', ['ngRoute', 'ngMessages', 'mapboxgl-directive', 'firebase', 'jsonFormatter']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

    $routeProvider.when('/', {
        title: 'Homepage',
        templateUrl: 'partials/home.html',
        controller: 'HomeCtrl',

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

    // $routeProvider.otherwise('/'); // stream

    // HTML5 MODE url writing method (false: #/anchor/use, true: /html5/url/use)
    $locationProvider.html5Mode(false);
    $locationProvider.hashPrefix('');

}]);

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.withCredentials = true;
}]);

app.run(['$rootScope', '$route', '$routeParams', '$window', '$document', '$q', '$timeout', function($rootScope, $route, $routeParams, $window, $document, $q, $timeout) {

    $rootScope.standalone = $window.navigator.standalone;

    $rootScope.$on('$routeChangeSuccess', function() {
        var title = $route.current.title;
        angular.forEach($routeParams, function(value, key) {
            title = title.replace(new RegExp(':' + key, 'g'), value);
        });
        $document.title = title || '';
    });

    $rootScope.log = function() {
        if ($window.console && $window.console.info) {
            $window.console.info.apply($window.console, arguments);
        }
    };

    // MODALS
    $rootScope.modals = [];

    function closeModal(modal) {
        var index = -1;
        angular.forEach($rootScope.modals, function(m, i) {
            if (m === modal) {
                index = i;
            }
        });
        if (index !== -1) {
            modal.active = false;
            $timeout(function() {
                $rootScope.modals.splice(index, 1);
            }, 500);
        }
    }

    $rootScope.addModal = function(modalType, title, params) {
        var deferred = $q.defer();
        params = params || null;
        var modal = {
            title: 'Untitled',
            controller: null,
            template: null,
            params: params,
        };
        switch (modalType) {
            case 'messageModal':
                modal = {
                    title: title || 'Messaggio',
                    controller: 'MessageModalCtrl',
                    template: 'partials/modals/message',
                    params: params,
                };
                break;
        }
        modal.deferred = deferred;
        modal.resolve = function(data) {
            closeModal(this);
            modal.deferred.resolve(data, modal);
        };
        modal.reject = function() {
            closeModal(this);
            modal.deferred.reject(modal);
        };
        $rootScope.modals.push(modal);
        angular.forEach($rootScope.modals, function(m, i) {
            m.active = false;
        });
        $timeout(function() {
            modal.active = true;
            $window.scrollTo(0, 0);
        }, 500);
        return deferred.promise;
    };

}]);