/* global angular, app */

app.factory('State', ['$timeout', function($timeout) {
    function State() {
        this.isReady = false;
        this.idle();
    }
    State.prototype = {
        idle: function() {
            this.isBusy = false;
            this.isError = false;
            this.isErroring = false;
            this.isSuccess = false;
            this.isSuccessing = false;
            this.button = null;
            this.errors = [];
        },
        enabled: function() {
            return !this.isBusy && !this.isErroring && !this.isSuccessing;
        },
        busy: function() {
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
        },
        success: function() {
            this.isBusy = false;
            this.isError = false;
            this.isErroring = false;
            this.isSuccess = true;
            this.isSuccessing = true;
            this.errors = [];
            $timeout(function() {
                this.isSuccessing = false;
                this.button = null;
            }.bind(this), 1000);
        },
        error: function(error) {
            this.isBusy = false;
            this.isError = true;
            this.isErroring = true;
            this.isSuccess = false;
            this.isSuccessing = false;
            this.errors.push(error);
            $timeout(function() {
                this.isErroring = false;
                this.button = null;
            }.bind(this), 1000);
        },
        ready: function() {
            this.isReady = true;
            this.success();
        },
        errorMessage: function() {
            return this.isError ? this.errors[this.errors.length - 1] : null;
        },
        submitClass: function() {
            return {
                busy: this.isBusy,
                ready: this.isReady,
                successing: this.isSuccessing,
                success: this.isSuccess,
                errorring: this.isErroring,
                error: this.isError,
            };
        },
        submitMessage: function(idleMessage, busyMessage, successMessage, errorMessage) {
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
        },
    };
    return State;
}]);

app.factory('User', ['$q', '$location', 'LocalStorage', 'Api', function($q, $location, storage, Api) {
    function User(data) {
        data ? angular.extend(this, data) : null;
    }
    User.prototype = {};
    User.current = function() {
        return storage.get('user');
    };
    User.isLoggedOrGoTo = function(redirect) {
        var deferred = $q.defer();
        var q = storage.get('q');

        function success(response) {
            storage.set('q', window.btoa(JSON.stringify({
                un: response.userName,
                pwd: response.password
            })));
            response.password = null;
            storage.set('user', { id: response.id });
            deferred.resolve(response);
        }

        function error(response) {
            deferred.reject(response);
            $location.$$lastRequestedPath = $location.path();
            $location.path(redirect);
        }
        if (q) {
            Api.auth.sso(q).then(success, error);
        } else {
            Api.auth.current().then(success, error);
        }
        return deferred.promise;
    };
    User.signin = function(model) {
        var deferred = $q.defer();
        Api.auth.signin(model).then(function success(response) {
            storage.set('q', window.btoa(JSON.stringify({
                un: response.userName,
                pwd: response.password
            })));
            response.password = null;
            storage.set('user', { id: response.id });
            deferred.resolve(response);
        }, function error(response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };
    User.signout = function() {
        var deferred = $q.defer();
        var user = storage.get('user');
        if (user) {
            Api.auth.signout(user.id).then(function success(response) {
                storage.delete('q');
                storage.delete('user');
                deferred.resolve(response);
            }, function error(response) {
                deferred.reject(response);
            });
        } else {
            deferred.reject(null);
        }
        return deferred.promise;
    };
    return User;
}]);