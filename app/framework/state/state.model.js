/* global angular */

(function () {
    "use strict";

    var app = angular.module('app');

    app.factory('State', ['$timeout', function ($timeout) {
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
            message: message,
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
            $timeout(function () {
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
            $timeout(function () {
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

        function message(idleMessage, busyMessage, successMessage, errorMessage) {
            idleMessage = idleMessage || 'Submit';
            if (this.isBusy) {
                return busyMessage || idleMessage;
            } else if (this.isSuccess) {
                return successMessage || idleMessage;
            } else if (this.isError) {
                return errorMessage || idleMessage;
            } else {
                return idleMessage;
            }
        }

        function classes(key) {
            var scope = this;
            console.log('stateClass', scope.key, key);
            if (this.key === key) {
                var sclass = {
                    ready: scope.isReady,
                    busy: scope.isBusy,
                    successing: scope.isSuccessing,
                    success: scope.isSuccess,
                    errorring: scope.isErroring,
                    error: scope.isError,
                };
                // console.log('stateClass', sclass);
                return sclass;
            } else {
                return null;
            }
        }

        function disabled(key) {
            return (this.key && this.key !== key);
        }
    }]);

}());