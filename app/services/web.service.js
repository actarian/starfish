/* global angular */

(function () {
    "use strict";

    var app = angular.module('app');

    app.service('WebApi', ['$http', '$q', '$timeout', '$location', function ($http, $q, $timeout, $location) {

        var service = this;

        var _get = this.get = function (url, params) {
            var deferred = $q.defer();
            $http.get(url, { params: params }).then(function (response) {
                deferred.resolve(response.data);
            }, function (response) {
                onError(deferred, 'get', url, { params: params }, response);
            });
            return deferred.promise;
        };
        var _post = this.post = function (url, model) {
            var deferred = $q.defer();
            if (service.DEBUG) {
                console.log('Api.DEBUG', url, model);
                deferred.resolve(model);
            } else {
                $http.post(url, model).then(function (response) {
                    deferred.resolve(response.data);
                }, function (response) {
                    onError(deferred, 'post', url, model, response);
                });
            }
            return deferred.promise;
        };
        var _put = this.put = function (url, model) {
            var deferred = $q.defer();
            $http.put(url, model).then(function (response) {
                deferred.resolve(response.data);
            }, function (response) {
                onError(deferred, 'put', url, model, response);
            });
            return deferred.promise;
        };
        var _patch = this.patch = function (url, model) {
            var deferred = $q.defer();
            $http.patch(url, model).then(function (response) {
                deferred.resolve(response.data);
            }, function (response) {
                onError(deferred, 'patch', url, model, response);
            });
            return deferred.promise;
        };
        var _delete = this.delete = function (url) {
            var deferred = $q.defer();
            $http.delete(url).then(function (response) {
                deferred.resolve(response.data);
            }, function (response) {
                onError(deferred, 'delete', url, null, response);
            });
            return deferred.promise;
        };
        var _blob = this.blob = function (url, model) {
            var deferred = $q.defer();
            if (service.DEBUG) {
                console.log('Api.DEBUG', url, model);
                deferred.resolve(model);
            } else {
                $http({
                    url: url,
                    method: "POST",
                    data: model,
                    headers: {
                        'Content-type': 'application/json'
                    },
                    responseType: 'arraybuffer',
                }).then(function (response) {
                    deferred.resolve(response);
                }, function (response) {
                    onError(deferred, 'post', url, model, response);
                });
            }
            return deferred.promise;
        };

        this.auth = {
            signin: _service.signin,
            // return _post('/api/auth/login', model);
            signout: function (userId) {
                // return _get('/api/auth/logout/' + userId);
            },
            current: function () {
                var deferred = $q.defer();
                if (_service.user) {
                    deferred.resolve(_service.user);
                } else {
                    deferred.reject();
                }
                return deferred.promise;
                // return _get('/api/auth/current/');
            },
        };

    }]);

}());