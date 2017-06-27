/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('state', ['$timeout', function($timeout) {
        return {
            restrict: 'EA',
            templateUrl: 'partials/state',
            transclude: true,
            replace: true,
            scope: {
                state: '=',
            },
            link: function(scope, element, attributes, model) {
                scope.stateClass = function() {
                    if (scope.state.button === element) {
                        var sclass = {
                            busy: scope.state.isBusy,
                            successing: scope.state.isSuccessing,
                            success: scope.state.isSuccess,
                            errorring: scope.state.isErroring,
                            error: scope.state.isError,
                        };
                        // console.log('stateClass', sclass);
                        return sclass;
                    } else {
                        return null;
                    }
                };
                scope.stateDisabled = function() {
                    var disabled = (scope.state.button && scope.state.button !== element); // || scope.$parent.$eval(attributes.onValidate);
                    // console.log('stateDisabled', disabled);
                    return disabled;
                };

                function onClick() {
                    $timeout(function() {
                        if (!scope.$parent.$eval(attributes.onValidate)) {
                            // console.log('state.onClick', attributes.onValidate, attributes.onClick);
                            scope.state.button = element;
                            return scope.$parent.$eval(attributes.onClick);
                        } else {
                            scope.$parent.$eval('form.$setSubmitted()');
                        }
                    });
                }

                function addListeners() {
                    element.on('touchstart click', onClick);
                }

                function removeListeners() {
                    element.off('touchstart click', onClick);
                }
                scope.$on('$destroy', function() {
                    removeListeners();
                });
                addListeners();
            }
        };
    }]);

}());