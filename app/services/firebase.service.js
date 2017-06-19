/* global angular, firebase */

(function () {
    "use strict";

    var app = angular.module('app');

    app.service('FirebaseApi', ['$q', '$firebaseAuth', '$firebaseObject', '$firebaseArray', 'LocalStorage', 'Router', function ($q, $firebaseAuth, $firebaseObject, $firebaseArray, storage, router) {

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
        service.users = {
            save: null,
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

        function isLoggedOrGoTo(path) {
            var deferred = $q.defer();
            current().then(function (user) {
                deferred.resolve(service.user);
            }, function () {
                deferred.reject();
                router.redirect(path);
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

}());