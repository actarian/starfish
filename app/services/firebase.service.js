/* global angular, firebase */

(function() {
    "use strict";

    var app = angular.module('app');

    app.service('FirebaseApi', ['$q', '$firebaseAuth', '$firebaseObject', '$firebaseArray', 'LocalStorage', 'Router', function($q, $firebaseAuth, $firebaseObject, $firebaseArray, storage, router) {

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
            save: userSave,
        };
        service.current = current;
        service.isLoggedOrGoTo = isLoggedOrGoTo;

        function connect() {
            var deferred = $q.defer();
            if (service.presence) {
                deferred.resolve(service.presence);
            } else {
                var auth = $firebaseAuth();
                auth.$signInAnonymously({ remember: 'sessionOnly' }).then(function(logged) {
                    var presence = service.presence = {
                        uid: logged.uid,
                    };
                    deferred.resolve(presence);
                }).catch(function(error) {
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
                    connect().then(function(presence) {
                        getSingle('users', { token: token }).then(function(user) {
                            var user = service.user = user;
                            deferred.resolve(user);
                        }, function(error) {
                            deferred.reject(error);
                        });
                        /*
                        var users = getArray('users', { token: token }).then(function(users) {
                            console.log('first', users[0]);
                        }, function(error) {
                            deferred.reject(error);
                        })
                        var root = firebase.database().ref();
                        var usersRef = root.child('users');
                        usersRef.orderByChild('token').equalTo(token).on('value', function(snap) {
                            var key = firstKey(snap);
                            if (key) {
                                var usersRef = root.child('users').child(key);
                                usersRef.on('value', function(snap) {
                                    storage.set('token', snap.val().token);
                                });
                                var user = service.user = $firebaseObject(usersRef);
                                deferred.resolve(user);
                            } else {
                                deferred.reject();
                            }
                        });
                        */
                    }, function(error) {
                        deferred.reject(error);
                    });
                } else {
                    deferred.reject({
                        message: 'not logged',
                    });
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
                connect().then(function(presence) {
                    getSingle('users', { email: model.email }).then(function(user) {
                        if (user.password === model.password) {
                            storage.set('token', user.token);
                            service.user = user;
                            deferred.resolve(user);
                        } else {
                            deferred.reject({
                                message: 'not found',
                            });
                        }
                    }, function(error) {
                        deferred.reject(error);
                    });
                }, function(error) {
                    deferred.reject(error);
                });
            }
            return deferred.promise;
        }

        function signup(model) {
            console.log('FirebaseApi.signup', model);
            var deferred = $q.defer();
            connect().then(function(presence) {
                model.token = presence.uid;
                addObject('users', model).then(function(user) {
                    storage.set('token', user.token);
                    service.user = user;
                    deferred.resolve(user);
                }, function(error) {
                    deferred.reject(error);
                });
                /*
                var root = firebase.database().ref();
                var usersRef = root.child('users');
                var userRef = usersRef.push();
                model.token = presence.uid;
                storage.set('token', model.token);
                userRef.set(model);
                service.user = model;
                service.updateUser = function() {
                    userRef.set(model);
                };
                deferred.resolve(model);
                */
            }, function(error) {
                deferred.reject(error);
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
            current().then(function(user) {
                deferred.resolve(service.user);
            }, function() {
                deferred.reject();
                router.redirect(path);
            });
            return deferred.promise;
        }

        function userSave(model) {
            console.log('userSave', model);
            var deferred = $q.defer();
            model.$save().then(function(ref) {
                // ref.key === obj.$id; // true
                deferred.resolve(model);
            }, function(error) {
                deferred.reject(error);
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
            ref.orderByChild(field.key).equalTo(field.value).on('child_added', function(snap) {
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

        function getSingle(collection, query, limit) {
            var deferred = $q.defer();
            var items = getArray(collection, query, limit).then(function(items) {
                // console.log('getSingle', items.length);
                if (items.length === 1) {
                    var key = items[0].$id;
                    // console.log('getSingle', key);
                    getObject(collection, key).then(function(item) {
                        // console.log('getSingle', item);
                        deferred.resolve(item);
                    }, function(error) {
                        deferred.reject();
                    });
                } else {
                    deferred.reject();
                }
            }, function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        }

        function getObject(collection, key) {
            var root = firebase.database().ref();
            var ref = root.child(collection).child(key);
            return $firebaseObject(ref).$loaded();
        }

        function getArray(collection, query, limit) {
            var root = firebase.database().ref();
            var ref = root.child(collection);
            var queryOrRef = ref;
            if (query) {
                var field = getField(query);
                if (field) {
                    queryOrRef = ref.orderByChild(field.key).equalTo(field.value);
                    if (limit) {
                        queryOrRef = queryOrRef.limitToLast(limit);
                    }
                }
            }
            return $firebaseArray(queryOrRef).$loaded();
        }

        function addObject(collection, model) {
            var root = firebase.database().ref();
            var arrayRef = root.child(collection);
            var ref = arrayRef.push();
            ref.set(model);
            return $firebaseObject(ref).$loaded();
        }

        function firstKey(snap) {
            var key = null;
            if (snap.numChildren()) {
                var items = snap.val();
                var keys = Object.keys(items);
                key = keys[0];
            }
            return key;
        }

    }]);

}());