/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('header', [function() {
        return {
            restrict: 'E',
            templateUrl: 'partials/header',
            transclude: {
                'header': '?headerItems',
            },
            link: function(scope, element, attributes, model) {}
        };
    }]);

}());