﻿/* global angular, app */

app.service('Router', ['$location', function ($location) {

    var service = this;
    service.redirect = redirect;

    function redirect(path) {
        $location.$$lastRequestedPath = $location.path();
        $location.path(path);
    }

}]);

app.service('FirebaseApi', ['$q', '$location', '$firebaseAuth', '$firebaseObject', '$firebaseArray', 'LocalStorage', function ($q, $location, $firebaseAuth, $firebaseObject, $firebaseArray, storage) {

    var firebase = window.firebase || null;
    if (firebase) {
        var config = {
            apiKey: "AIzaSyCskd8Cgzd_j7JzgEC3mEb4ir1qZFh6auQ",
            authDomain: "starfish-c2b0f.firebaseapp.com",
            databaseURL: "https://starfish-c2b0f.firebaseio.com",
            projectId: "starfish-c2b0f",
            storageBucket: "starfish-c2b0f.appspot.com",
            messagingSenderId: "796739915579"
        };
        firebase.initializeApp(config);
    } else {
        throw ('missing firebase.js');
    }

    var service = this;
    service.user = undefined;
    service.presence = undefined;
    service.items = getUserItems;
    service.auth = {
        signin: signin,
        signup: signup,
        signout: signout,
    };
    service.current = current;
    service.isLoggedOrGoTo = isLoggedOrGoTo;

    function connect() {
        var deferred = $q.defer();
        if (service.presence) {
            deferred.resolve(service.presence);
        } else {
            var auth = $firebaseAuth();
            auth.$signInAnonymously({ remember: 'sessionOnly' }).then(function (logged) {
                var presence = service.presence = {
                    uid: logged.uid,
                };
                deferred.resolve(presence);
            }).catch(function (error) {
                console.log('Error', error);
                deferred.reject(error);
            });
        }
        return deferred.promise;
    } 
    
    function current() {
        var deferred = $q.defer();
        if (service.user) {
            deferred.resolve(service.user);
        } else {
            var token = storage.get('token');
            if (token) {
                connect().then(function (p) {
                    var root = firebase.database().ref();
                    var usersRef = root.child('users');
                    usersRef.orderByChild('token').equalTo(token).on('value', function (snap) {
                        var user = service.user = firstOrDefault(snap);
                        if (user) {
                            storage.set('token', user.token);
                            deferred.resolve(user);
                        } else {
                            deferred.reject();
                        }
                    });
                }, function () {
                    deferred.reject();
                });
            } else {
                deferred.reject();
            }
        }
        return deferred.promise;
    }

    function signin(model) {
        console.log('FirebaseApi.signin', model);
        var deferred = $q.defer();
        if (service.user) {
            console.log('signed', service.user);
            deferred.resolve(service.user);
        } else {
            connect().then(function (presence) {
                var root = firebase.database().ref();
                var usersRef = root.child('users');
                usersRef.orderByChild('email').equalTo(model.email).on('value', function (snap) {
                    var user = service.user = firstOrDefault(snap);
                    if (user && user.password === model.password) {
                        storage.set('token', user.token);
                        deferred.resolve(user);
                    } else {
                        deferred.reject({
                            message: 'not found',
                        });
                    }
                });
            }, function () {
                deferred.reject();
            });
        }
        return deferred.promise;
    }

    function signup(model) {
        console.log('FirebaseApi.signup', model);
        var deferred = $q.defer();
        connect().then(function (p) {
            console.log('connected', p);
            var root = firebase.database().ref();
            var usersRef = root.child('users');
            var userRef = usersRef.push();
            model.token = service.presence.uid;
            storage.set('token', model.token);
            userRef.set(model);
            service.user = model;
            service.updateUser = function () {
                userRef.set(model);
            };
            deferred.resolve(model);
        }, function () {
            deferred.reject();
        });
        return deferred.promise;
    }

    function signout() {
        console.log('FirebaseApi.signout');
        var deferred = $q.defer();
        storage.delete('token');
        service.user = null;
        deferred.resolve();
        return deferred.promise;
    }

    function getUserItems() {
        return getArray('items', { token: 'token' });
    }

    function isLoggedOrGoTo(redirect) {
        var deferred = $q.defer();
        current().then(function (user) {
            deferred.resolve(service.user);
        }, function () {
            deferred.reject();
            $location.$$lastRequestedPath = $location.path();
            $location.path(redirect);
        });
        return deferred.promise;
    }

    // UTILS

    function removeRange(firebaseArray, from, to) {
        var keys = {};
        if (to === undefined) {
            to = firebaseArray.length;
        }
        for (var i = from; i < to; ++i) {
            keys[firebaseArray.$keyAt(i)] = null;
        }
        return firebaseArray.$ref().update(keys);
    }

    function queryBase(collection, query) {
        var deferred = $q.defer();
        var root = firebase.database().ref();
        var ref = root.child(collection);
        var fields = [];
        for (var p in query) {
            fields.push({
                key: p,
                value: query[p],
            });
        }
        var field = fields.shift();
        var items = [];
        ref.orderByChild(field.key).equalTo(field.value).on('child_added', function (snap) {
            var item = snap.val();
            if (item) {
                deferred.resolve(item);
            } else {
                deferred.reject();
            }
        });
        return deferred.promise;
    }

    function getField(query) {
        var fields = [];
        for (var p in query) {
            fields.push({
                key: p,
                value: query[p],
            });
        }
        var field = null;
        if (fields.length) {
            field = fields.shift();
        }
        return field;
    }

    function getArray(collection, query, limit) {
        var deferred = $q.defer();
        var root = firebase.database().ref();
        var ref = root.child(collection);
        var array = null;
        if (query) {
            var field = getField(query);
            if (field) {
                var queryRef = ref.orderByChild(field.key).equalTo(field.value);
                if (limit) {
                    queryRef = queryRef.limitToLast(limit);
                }
                array = $firebaseArray(queryRef);
            }
        }
        array = array || $firebaseArray(ref);
        array.$loaded(function (array) {
            deferred.resolve(array);
        }, function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }

    function firstOrDefault(snap) {
        var item = null;
        if (snap.numChildren()) {
            var items = snap.val();
            var keys = Object.keys(items);
            item = items[keys[0]];
        }
        return item;
    }

    /*

    this.presences = {
        getPresences: function () {
            var deferred = $q.defer();
            var user = service.user;
            var root = service.root = firebase.database().ref();
            var presencesRef = root.child('presences');
            var userRef = presencesRef.push();
            var connectedRef = root.child('.info/connected');
            connectedRef.on('value', function (snap) {
                if (snap.val()) {
                    userRef.onDisconnect().remove();
                    userRef.set(user);
                    service.updateUser = function () {
                        userRef.set(user);
                    };
                    deferred.resolve();
                }
            });
            presencesRef.on('value', function (snap) {
                // console.log('# of online users = ', snap.numChildren());
                var presences = snap.val(),
                    items = [];
                for (var key in presences) {
                    var user = presences[key];
                    if (user.id !== service.user.id) {
                        items.push(user);
                    }
                }
                if (items.length) {
                    service.options.onPresences(items);
                }
            });
            service.presences = $firebaseArray(presencesRef);
            return deferred.promise;
        },
    };

    this.activities = {
        clearActivities: function () {
            var min = Number.POSITIVE_INFINITY;
            angular.forEach(service.presences, function (presence) {
                min = Math.min(presence.timestamp, min);
            });
            var activities = service.activities;
            var from = 0,
                to = 0;
            angular.forEach(activities, function (item, index) {
                if (item.timestamp < min) {
                    to = index + 1;
                }
            });
            removeRange(activities, from, to);
        },
        addActivities: function (items) {
            if (items && items.length) {
                var user = service.user;
                var root = service.root; // firebase.database().ref();
                var lastActivity = null;
                var activitiesRef = root.child('activities');
                angular.forEach(items, function (item) {
                    item.userId = user.id;
                    item.timestamp = Date.now();
                    lastActivity = item;
                    var activityRef = activitiesRef.push();
                    activityRef.set(item);
                });
                if (lastActivity) {
                    user.lastActivity = lastActivity;
                    service.updateUser();
                }
            }
        },
        getUniqueActivities: function (items) {
            items.sort(function (a, b) {
                return b.timestamp - a.timestamp; // desc
            });
            var pool = {};
            items = items.filter(function (item) {
                if (!pool[item.id]) {
                    return (pool[item.id] = true);
                } else {
                    return false;
                }
            });
            items.sort(function (a, b) {
                return a.timestamp - b.timestamp; // asc
            });
            return items;
        },
        getActivities: function () {
            var deferred = $q.defer();
            var root = service.root; // firebase.database().ref();
            var activitiesRef = root.child('activities');
            var user = service.user;
            var lastDate = user.timestamp;
            activitiesRef.on('value', function (snap) {
                var activities = snap.val(),
                    items = [];
                var max = Number.NEGATIVE_INFINITY;
                for (var key in activities) {
                    var activity = activities[key];
                    max = Math.max(max, activity.timestamp);
                    if (activity.userId !== service.user.id && activity.timestamp > lastDate) {
                        items.push(activity);
                    }
                }
                lastDate = Math.max(lastDate, max);
                items = service.getUniqueActivities(items);
                if (items.length) {
                    service.options.onActivities(items);
                }
            });
            var activities = service.activities = $firebaseArray(activitiesRef);
            activities.$loaded().then(function () {
                service.clearActivities();
                deferred.resolve();
            }).catch(function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        },
    };

    */
}]);

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

app.factory('Cookie', ['$q', '$window', function ($q, $window) {
    function Cookie() { }
    Cookie.TIMEOUT = 5 * 60 * 1000; // five minutes
    Cookie._set = function (name, value, days) {
        var expires;
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toGMTString();
        } else {
            expires = '';
        }
        $window.document.cookie = name + '=' + value + expires + '; path=/';
    };
    Cookie.set = function (name, value, days) {
        try {
            var cache = [];
            var json = JSON.stringify(value, function (key, value) {
                if (key === 'pool') {
                    return;
                }
                if (typeof value === 'object' && value !== null) {
                    if (cache.indexOf(value) !== -1) {
                        // Circular reference found, discard key
                        return;
                    }
                    cache.push(value);
                }
                return value;
            });
            cache = null;
            Cookie._set(name, json, days);
        } catch (e) {
            console.log('Cookie.set.error serializing', name, value, e);
        }
    };
    Cookie.get = function (name) {
        var cookieName = name + "=";
        var ca = $window.document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(cookieName) === 0) {
                var value = c.substring(cookieName.length, c.length);
                var model = null;
                try {
                    model = JSON.parse(value);
                } catch (e) {
                    console.log('Cookie.get.error parsing', key, e);
                }
                return model;
            }
        }
        return null;
    };
    Cookie.delete = function (name) {
        Cookie._set(name, "", -1);
    };
    Cookie.on = function (name) {
        var deferred = $q.defer();
        var i, interval = 1000,
            elapsed = 0,
            timeout = Cookie.TIMEOUT;

        function checkCookie() {
            if (elapsed > timeout) {
                deferred.reject('timeout');
            } else {
                var c = Cookie.get(name);
                if (c) {
                    deferred.resolve(c);
                } else {
                    elapsed += interval;
                    i = setTimeout(checkCookie, interval);
                }
            }
        }
        checkCookie();
        return deferred.promise;
    };
    return Cookie;
}]);

app.factory('LocalStorage', ['$q', '$window', 'Cookie', function ($q, $window, Cookie) {
    function LocalStorage() { }

    function isLocalStorageSupported() {
        var supported = false;
        try {
            supported = 'localStorage' in $window && $window.localStorage !== null;
            if (supported) {
                $window.localStorage.setItem('test', '1');
                $window.localStorage.removeItem('test');
            } else {
                supported = false;
            }
        } catch (e) {
            supported = false;
        }
        return supported;
    }
    LocalStorage.isSupported = isLocalStorageSupported();
    if (LocalStorage.isSupported) {
        LocalStorage.set = function (name, value) {
            try {
                var cache = [];
                var json = JSON.stringify(value, function (key, value) {
                    if (key === 'pool') {
                        return;
                    }
                    if (typeof value === 'object' && value !== null) {
                        if (cache.indexOf(value) !== -1) {
                            // Circular reference found, discard key
                            return;
                        }
                        cache.push(value);
                    }
                    return value;
                });
                cache = null;
                $window.localStorage.setItem(name, json);
            } catch (e) {
                console.log('LocalStorage.set.error serializing', name, value, e);
            }
        };
        LocalStorage.get = function (name) {
            var value = null;
            if ($window.localStorage[name] !== undefined) {
                try {
                    value = JSON.parse($window.localStorage[name]);
                } catch (e) {
                    console.log('LocalStorage.get.error parsing', name, e);
                }
            }
            return value;
        };
        LocalStorage.delete = function (name) {
            $window.localStorage.removeItem(name);
        };
        LocalStorage.on = function (name) {
            var deferred = $q.defer();
            var i, timeout = Cookie.TIMEOUT;

            function storageEvent(e) {
                // console.log('LocalStorage.on', name, e);
                clearTimeout(i);
                if (e.originalEvent.key == name) {
                    try {
                        var value = JSON.parse(e.originalEvent.newValue); // , e.originalEvent.oldValue
                        deferred.resolve(value);
                    } catch (error) {
                        console.log('LocalStorage.on.error parsing', name, error);
                        deferred.reject('error parsing ' + name);
                    }
                }
            }
            angular.element($window).on('storage', storageEvent);
            i = setTimeout(function () {
                deferred.reject('timeout');
            }, timeout);
            return deferred.promise;
        };
    } else {
        console.log('LocalStorage.unsupported switching to cookies');
        LocalStorage.set = Cookie.set;
        LocalStorage.get = Cookie.get;
        LocalStorage.delete = Cookie.delete;
        LocalStorage.on = Cookie.on;
    }
    return LocalStorage;
}]);

app.factory('SessionStorage', ['$q', '$window', 'Cookie', function ($q, $window, Cookie) {
    function SessionStorage() { }

    function isSessionStorageSupported() {
        var supported = false;
        try {
            supported = 'sessionStorage' in $window && $window.sessionStorage !== undefined;
            if (supported) {
                $window.sessionStorage.setItem('test', '1');
                $window.sessionStorage.removeItem('test');
            } else {
                supported = false;
            }
        } catch (e) {
            supported = false;
        }
        return supported;
    }
    SessionStorage.isSupported = isSessionStorageSupported();
    if (SessionStorage.isSupported) {
        SessionStorage.set = function (name, value) {
            try {
                var cache = [];
                var json = JSON.stringify(value, function (key, value) {
                    if (key === 'pool') {
                        return;
                    }
                    if (typeof value === 'object' && value !== null) {
                        if (cache.indexOf(value) !== -1) {
                            // Circular reference found, discard key
                            return;
                        }
                        cache.push(value);
                    }
                    return value;
                });
                cache = null;
                $window.sessionStorage.setItem(name, json);
            } catch (e) {
                console.log('SessionStorage.set.error serializing', name, value, e);
            }
        };
        SessionStorage.get = function (name) {
            var value = null;
            if ($window.sessionStorage[name] !== undefined) {
                try {
                    value = JSON.parse($window.sessionStorage[name]);
                } catch (e) {
                    console.log('SessionStorage.get.error parsing', name, e);
                }
            }
            return value;
        };
        SessionStorage.delete = function (name) {
            $window.sessionStorage.removeItem(name);
        };
        SessionStorage.on = function (name) {
            var deferred = $q.defer();
            var i, timeout = Cookie.TIMEOUT;

            function storageEvent(e) {
                // console.log('SessionStorage.on', name, e);
                clearTimeout(i);
                if (e.originalEvent.key === name) {
                    try {
                        var value = JSON.parse(e.originalEvent.newValue); // , e.originalEvent.oldValue
                        deferred.resolve(value);
                    } catch (error) {
                        console.log('SessionStorage.on.error parsing', name, error);
                        deferred.reject('error parsing ' + name);
                    }
                }
            }
            angular.element($window).on('storage', storageEvent);
            i = setTimeout(function () {
                deferred.reject('timeout');
            }, timeout);
            return deferred.promise;
        };
    } else {
        console.log('SessionStorage.unsupported switching to cookies');
        SessionStorage.set = Cookie.set;
        SessionStorage.get = Cookie.get;
        SessionStorage.delete = Cookie.delete;
        SessionStorage.on = Cookie.on;
    }
    return SessionStorage;
}]);