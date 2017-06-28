/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.factory('State', ['$timeout', function($timeout) {
        var DELAY = 2000;

        function State() {
            this.isReady = false;
            this.idle();
        }
        State.prototype = {
            idle: idle,
            busy: busy,
            enabled: enabled,
            error: error,
            ready: ready,
            success: success,
            errorMessage: errorMessage,
            submitClass: submitClass,
            labels: labels,
            classes: classes,
            disabled: disabled
        };
        return State;

        function idle() {
            this.isBusy = false;
            this.isError = false;
            this.isErroring = false;
            this.isSuccess = false;
            this.isSuccessing = false;
            this.button = null;
            this.errors = [];
        }

        function enabled() {
            return !this.isBusy && !this.isErroring && !this.isSuccessing;
        }

        function busy(key) {
            if (!this.isBusy) {
                this.isBusy = true;
                this.isError = false;
                this.isErroring = false;
                this.isSuccess = false;
                this.isSuccessing = false;
                this.errors = [];
                this.key = key;
                // console.log('State.busy', this);
                return true;
            } else {
                return false;
            }
        }

        function success() {
            this.isBusy = false;
            this.isError = false;
            this.isErroring = false;
            this.isSuccess = true;
            this.isSuccessing = true;
            this.errors = [];
            $timeout(function() {
                this.isSuccessing = false;
                this.key = null;
            }.bind(this), DELAY);
        }

        function error(error) {
            this.isBusy = false;
            this.isError = true;
            this.isErroring = true;
            this.isSuccess = false;
            this.isSuccessing = false;
            this.errors.push(error);
            $timeout(function() {
                this.isErroring = false;
                this.key = null;
            }.bind(this), DELAY);
        }

        function ready() {
            this.isReady = true;
            this.success();
        }

        function errorMessage() {
            return this.isError ? this.errors[this.errors.length - 1] : null;
        }

        function submitClass() {
            return {
                busy: this.isBusy,
                ready: this.isReady,
                successing: this.isSuccessing,
                success: this.isSuccess,
                errorring: this.isErroring,
                error: this.isError,
            };
        }

        function labels(key, addons) {
            var scope = this;
            var defaults = {
                ready: 'submit',
                busy: 'sending',
                error: 'error',
                success: 'success',
            };
            if (addons) {
                angular.extend(defaults, addons);
            }
            var label = defaults.ready;
            // console.log('labels', scope.key, key);
            if (this.key === key) {
                if (this.isBusy) {
                    label = defaults.busy;
                } else if (this.isSuccess) {
                    label = defaults.success;
                } else if (this.isError) {
                    label = defaults.error;
                }
            }
            return label;
        }

        function classes(key, addons) {
            var scope = this,
                classes = null;
            // console.log('stateClass', scope.key, key);
            if (this.key === key) {
                classes = {
                    ready: scope.isReady,
                    busy: scope.isBusy,
                    successing: scope.isSuccessing,
                    success: scope.isSuccess,
                    errorring: scope.isErroring,
                    error: scope.isError,
                };
                if (addons) {
                    angular.forEach(addons, function(value, key) {
                        classes[value] = classes[key];
                    });
                }
            }
            // console.log('stateClass', classes);
            return classes;
        }

        function disabled(key) {
            // console.log('disabled', key, this.key);
            return (this.key && this.key !== key);
        }
    }]);

}());