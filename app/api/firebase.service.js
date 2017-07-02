/* global angular, firebase */

(function() {
    "use strict";

    var app = angular.module('app');

    app.service('FirebaseApi', ['$q', 'FirebaseService', 'LocalStorage', 'Router', function($q, service, storage, router) {

        var scope = this;
        scope.user = undefined;

        scope.auth = {
            redirect: function(path) {
                var deferred = $q.defer();
                scope.auth.current().then(function(user) {
                    deferred.resolve(scope.user);
                }, function(data) {
                    deferred.reject(service.error(data));
                    router.redirect(path);
                });
                return deferred.promise;
            },
            current: function() {
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
            },
            signin: function(model) {
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
            },
            signup: function(model) {
                console.log('api.userSignup', model);
                var deferred = $q.defer();
                service.getSingle('users', { email: model.email }).then(function(user) {
                    deferred.reject(service.error('indirizzo email già in uso.'));
                }, function(data) {
                    model.token = service.presence.uid;
                    service.addObject('users', model).then(function(user) {
                        storage.set('token', user.token);
                        scope.user = user;
                        deferred.resolve(user);
                    }, function(data) {
                        deferred.reject(service.error(data));
                    });
                });
                return deferred.promise;
            },
            signout: function userSignout() {
                console.log('api.signout');
                var deferred = $q.defer();
                storage.delete('token');
                scope.user = null;
                deferred.resolve();
                return deferred.promise;
            },
        };

        scope.users = {
            get: function() {
                return service.getArray('users');
            },
            detail: function(id) {
                return service.getSingle('users', { id: id });
            },
            save: function(model) {
                return save('users', model);
            },
        };

        scope.facilities = {
            get: function() {
                return service.getArray('facilities');
            },
            user: function(userId) {
                return service.getSingle('facilities', { userId: userId });
            },
            detail: function(id) {
                return service.getSingle('facilities', { id: id });
            },
            save: function(model) {
                return save('facilities', model);
            },
        };

        scope.facilityItems = {
            get: function() {
                return service.getArray('facilityItems');
            },
            user: function(facilityId) {
                return service.getArray('facilityItems', { facilityId: facilityId });
            },
            detail: function(id) {
                return service.getSingle('facilityItems', { id: id });
            },
            save: function(model) {
                return save('facilityItems', model);
            },
        };

        function save(collection, model) {
            var deferred = $q.defer();
            if (model.$save) {
                service.saveObject(model).then(function(ref) {
                    deferred.resolve(model);
                }, function(data) {
                    deferred.reject(service.error(data));
                });
            } else {
                service.addObject(collection, model).then(function(model) {
                    deferred.resolve(model);
                }, function(data) {
                    deferred.reject(service.error(data));
                });
            }
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
        scope.addArray = addArray;
        scope.saveObject = saveObject;
        scope.error = error;

        function getUID() {
            return (new Date()).getTime() + Math.floor(Math.random() * 999);
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

        function addArray(collection, array) {
            var deferred = $q.defer();
            connect().then(function(presence) {
                var root = firebase.database().ref();
                var arrayRef = root.child(collection);
                var id = getUID();
                angular.forEach(array, function(item) {
                    item.id = item.id || ++id;
                    var ref = arrayRef.push();
                    ref.set(item);
                });
                $firebaseArray(arrayRef).$loaded().then(function(data) {
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
            if (model.length === undefined) {
                model.id = model.id || getUID();
            }
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

}());