/* global angular, firebase */

(function() {
    "use strict";

    var app = angular.module('app');

    app.service('FirebaseApi', ['$q', 'FirebaseService', 'LocalStorage', 'Router', function($q, service, storage, router) {

        var scope = this;
        scope.user = undefined;
        scope.isLoggedOrGoTo = isLoggedOrGoTo;
        scope.auth = {
            current: userCurrent,
            signin: userSignin,
            signup: userSignup,
            signout: userSignout,
        };
        scope.users = {
            index: userIndex,
            detail: userDetail,
            save: userSave,
        };
        scope.items = getUserItems;
        scope.facilities = getFacilities;

        function userCurrent() {
            var deferred = $q.defer();
            if (scope.user) {
                deferred.resolve(scope.user);
            } else {
                var token = storage.get('token');
                if (token) {
                    service.getSingle('users', { token: token }).then(function(user) {
                        scope.user = user;
                        deferred.resolve(user);
                    }, function(data) {
                        deferred.reject(service.error(data));
                    });
                } else {
                    deferred.reject(service.error('not logged'));
                }
            }
            return deferred.promise;
        }

        function userSignin(model) {
            console.log('FirebaseApi.userSignin', model);
            var deferred = $q.defer();
            if (scope.user) {
                console.log('signed', scope.user);
                deferred.resolve(scope.user);
            } else {
                service.getSingle('users', { email: model.email }).then(function(user) {
                    if (model.password === user.password) {
                        storage.set('token', user.token);
                        scope.user = user;
                        deferred.resolve(user);
                    } else {
                        deferred.reject(getEttot('not found'));
                    }
                }, function(data) {
                    deferred.reject(service.error(data));
                });
            }
            return deferred.promise;
        }

        function userSignup(model) {
            console.log('FirebaseApi.userSignup', model);
            var deferred = $q.defer();
            service.getSingle('users', { email: model.email }).then(function(user) {
                deferred.reject(service.error('indirizzo email già in uso.'));
            }, function(data) {
                model.token = service.presence.uid;
                addObject('users', model).then(function(user) {
                    storage.set('token', user.token);
                    scope.user = user;
                    deferred.resolve(user);
                }, function(data) {
                    deferred.reject(service.error(data));
                });
            });
            return deferred.promise;
        }

        function userSignout() {
            console.log('FirebaseApi.signout');
            var deferred = $q.defer();
            storage.delete('token');
            scope.user = null;
            deferred.resolve();
            return deferred.promise;
        }

        function userIndex() {
            return service.getArray('users');
        }

        function userDetail(id) {
            return service.getSingle('users', { id: id });
        }

        function userSave(model) {
            var deferred = $q.defer();
            service.saveObject(model).then(function(ref) {
                // ref.key === obj.$id; // true
                deferred.resolve(model);
            }, function(data) {
                console.log('userSave', data);
                deferred.reject(service.error(data));
            });
            return deferred.promise;
        }

        function getUserItems() {
            return getArray('items', { token: 'token' });
        }

        function getFacilities() {
            return service.getArray('users');
        }

        function isLoggedOrGoTo(path) {
            var deferred = $q.defer();
            userCurrent().then(function(user) {
                deferred.resolve(scope.user);
            }, function(data) {
                deferred.reject(service.error(data));
                router.redirect(path);
            });
            return deferred.promise;
        }

    }]);

    app.service('FirebaseService', ['$q', '$firebaseAuth', '$firebaseObject', '$firebaseArray', function($q, $firebaseAuth, $firebaseObject, $firebaseArray) {

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

        var scope = this;
        scope.presence = undefined;
        scope.getSingle = getSingle;
        scope.getObject = getObject;
        scope.getArray = getArray;
        scope.addObject = addObject;
        scope.saveObject = saveObject;
        scope.error = error;

        function getUID() {
            return (new Date()).getTime() + Math.floor(Math.random() * 9999);
        }

        function connect() {
            var deferred = $q.defer();
            if (scope.presence) {
                deferred.resolve(scope.presence);
            } else {
                var auth = $firebaseAuth();
                auth.$signInAnonymously({ remember: 'sessionOnly' }).then(function(data) {
                    var presence = scope.presence = {
                        uid: data.uid,
                    };
                    deferred.resolve(presence);
                }).catch(function(data) {
                    deferred.reject(error(data));
                });
            }
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
            connect().then(function(presence) {
                var datas = getArray(collection, query, limit).then(function(datas) {
                    // console.log('getSingle', datas.length);
                    if (datas.length === 1) {
                        var key = datas[0].$id;
                        // console.log('getSingle', key);
                        getObject(collection, key).then(function(data) {
                            // console.log('getSingle', item);
                            deferred.resolve(data);
                        }, function(data) {
                            deferred.reject(error(data));
                        });
                    } else {
                        deferred.reject(error('record duplicati'));
                    }
                }, function(data) {
                    deferred.reject(error(data));
                });
            }, function(data) {
                deferred.reject(error(data));
            });
            return deferred.promise;
        }

        function getObject(collection, key) {
            var deferred = $q.defer();
            connect().then(function(presence) {
                var root = firebase.database().ref();
                var ref = root.child(collection).child(key);
                $firebaseObject(ref).$loaded().then(function(data) {
                    deferred.resolve(data);
                }, function(data) {
                    deferred.reject(error(data));
                });
            }, function(data) {
                deferred.reject(error(data));
            });
            return deferred.promise;
        }

        function getArray(collection, query, limit) {
            var deferred = $q.defer();
            connect().then(function(presence) {
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
                $firebaseArray(queryOrRef).$loaded().then(function(data) {
                    deferred.resolve(data);
                }, function(data) {
                    deferred.reject(error(data));
                });
            }, function(data) {
                deferred.reject(error(data));
            });
            return deferred.promise;
        }

        function addObject(collection, model) {
            var deferred = $q.defer();
            connect().then(function(presence) {
                var root = firebase.database().ref();
                var arrayRef = root.child(collection);
                var ref = arrayRef.push();
                model.id = getUID();
                ref.set(model);
                $firebaseObject(ref).$loaded().then(function(data) {
                    deferred.resolve(data);
                }, function(data) {
                    deferred.reject(error(data));
                });
            }, function(data) {
                deferred.reject(error(data));
            });
            return deferred.promise;
        }

        function saveObject(model) {
            return model.$save();
        }

        function error(data) {
            var status = 400;
            var message = 'Errore';
            if (angular.isString(data)) {
                message = data;
            } else if (data && data.message) {
                status = data.status;
                message = data.message;
            }
            return { status: status, message: message };
        }

    }]);

    app.service('_____FirebaseApi', ['$q', '$firebaseAuth', '$firebaseObject', '$firebaseArray', 'LocalStorage', 'Router', function($q, $firebaseAuth, $firebaseObject, $firebaseArray, storage, router) {

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
        service.facilities = getFacilities;
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

        function getError(data) {
            var status = 400;
            var message = 'Errore';
            if (angular.isString(data)) {
                message = data;
            } else if (data && data.message) {
                status = data.status;
                message = data.message;
            }
            return { status: status, message: message };
        }

        function getUID() {
            return (new Date()).getTime() + Math.floor(Math.random() * 9999);
        }

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
                    deferred.reject(getError(error));
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
                            service.user = user;
                            deferred.resolve(user);
                        }, function(error) {
                            deferred.reject(getError(error));
                        });
                    }, function(error) {
                        deferred.reject(getError(error));
                    });
                } else {
                    deferred.reject(getError('not logged'));
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
                            deferred.reject(getEttot('not found'));
                        }
                    }, function(error) {
                        deferred.reject(getError(error));
                    });
                }, function(error) {
                    deferred.reject(getError(error));
                });
            }
            return deferred.promise;
        }

        function signup(model) {
            console.log('FirebaseApi.signup', model);
            var deferred = $q.defer();
            connect().then(function(presence) {
                getSingle('users', { email: model.email }).then(function(user) {
                    deferred.reject(getError('indirizzo email già in uso.'));
                }, function(error) {
                    model.token = presence.uid;
                    model.id = getUID();
                    addObject('users', model).then(function(user) {
                        storage.set('token', user.token);
                        service.user = user;
                        deferred.resolve(user);
                    }, function(error) {
                        deferred.reject(getError(error));
                    });
                });
            }, function(error) {
                deferred.reject(getError(error));
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

        function getFacilities() {
            return getArray('users');
        }

        function getUserItems() {
            return getArray('items', { token: 'token' });
        }

        function isLoggedOrGoTo(path) {
            var deferred = $q.defer();
            current().then(function(user) {
                deferred.resolve(service.user);
            }, function(error) {
                deferred.reject(getError(error));
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
                console.log('userSave', error);
                deferred.reject(getError(error));
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
                    deferred.reject(getError());
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
                        deferred.reject(getError(error));
                    });
                } else {
                    deferred.reject(getError('record duplicati'));
                }
            }, function(error) {
                deferred.reject(getError(error));
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

    }]);

}());