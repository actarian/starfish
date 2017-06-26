/* global angular */

(function () {
    "use strict";

    var app = angular.module('app');

    app.service('Router', ['$location', '$timeout', function ($location, $timeout) {

        var service = this;
        service.redirect = redirect;
        service.retry = retry;

        function redirect(path, msecs) {
            function doRedirect() {
                $location.$$lastRequestedPath = $location.path();
                $location.path(path);
            }
            if (msecs) {
                $timeout(function () {
                    doRedirect();
                }, msecs);
            } else {
                doRedirect();
            }
        }

        function retry(path, msecs) {
            function doRetry() {
                path = $location.$$lastRequestedPath || path;
                $location.$$lastRequestedPath = null;
                $location.path(path);
            }
            if (msecs) {
                $timeout(function () {
                    doRetry();
                }, msecs);
            } else {
                doRetry();
            }
        }

    }]);

}());