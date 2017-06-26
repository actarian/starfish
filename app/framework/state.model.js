/* global angular */

(function () {
    "use strict";

    var app = angular.module('app');

    app.factory('State', ['$timeout', function ($timeout) {
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
            submitMessage: submitMessage,
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
        function busy() {
            if (!this.isBusy) {
                this.isBusy = true;
                this.isError = false;
                this.isErroring = false;
                this.isSuccess = false;
                this.isSuccessing = false;
                this.errors = [];
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
                this.button = null;
            }.bind(this), 1000);
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
                this.button = null;
            }.bind(this), 1000);
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
        function submitMessage(idleMessage, busyMessage, successMessage, errorMessage) {
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
    }]);

}());