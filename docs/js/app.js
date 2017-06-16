/* global angular */

"use strict";

var app = angular.module('app', ['ngRoute', 'ngMessages', 'firebase', 'jsonFormatter']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

    $routeProvider.when('/', {
        title: 'Homepage',
        templateUrl: 'partials/home.html',
        controller: 'HomeCtrl',

    }).when('/signin', {
        title: 'Accedi',
        templateUrl: 'partials/signin.html',
        controller: 'SigninCtrl',

    }).when('/signup', {
        title: 'Registrazione',
        templateUrl: 'partials/signup.html',
        controller: 'SignupCtrl',

    }).when('/dashboard', {
        title: 'Dashboard',
        templateUrl: 'partials/dashboard.html',
        controller: 'DashboardCtrl',
        resolve: {
            user: ['FirebaseApi', function(api) {
                return api.isLoggedOrGoTo('/signin');
            }],
        },

    }).when('/user/:userId', {
        title: 'User',
        templateUrl: 'partials/user.html',
        controller: 'UserCtrl',
        resolve: {
            user: ['FirebaseApi', function(api) {
                return api.isLoggedOrGoTo('/signin');
            }],
        },

    }).when('/404', {
        title: 'Error 404',
        templateUrl: 'partials/404',

    });

    // $routeProvider.otherwise('/'); // stream

    // HTML5 MODE url writing method (false: #/anchor/use, true: /html5/url/use)
    $locationProvider.html5Mode(false);
    $locationProvider.hashPrefix('');

}]);

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.withCredentials = true;
}]);

app.run(['$rootScope', '$route', '$routeParams', '$window', '$document', '$q', '$timeout', function($rootScope, $route, $routeParams, $window, $document, $q, $timeout) {

    $rootScope.standalone = $window.navigator.standalone;

    $rootScope.$on('$routeChangeSuccess', function() {
        var title = $route.current.title;
        angular.forEach($routeParams, function(value, key) {
            title = title.replace(new RegExp(':' + key, 'g'), value);
        });
        $document.title = title || '';
    });

    $rootScope.log = function() {
        if ($window.console && $window.console.info) {
            $window.console.info.apply($window.console, arguments);
        }
    };

    // MODALS
    $rootScope.modals = [];

    function closeModal(modal) {
        var index = -1;
        angular.forEach($rootScope.modals, function(m, i) {
            if (m === modal) {
                index = i;
            }
        });
        if (index !== -1) {
            modal.active = false;
            $timeout(function() {
                $rootScope.modals.splice(index, 1);
            }, 500);
        }
    }

    $rootScope.addModal = function(modalType, title, params) {
        var deferred = $q.defer();
        params = params || null;
        var modal = {
            title: 'Untitled',
            controller: null,
            template: null,
            params: params,
        };
        switch (modalType) {
            case 'messageModal':
                modal = {
                    title: title || 'Messaggio',
                    controller: 'MessageModalCtrl',
                    template: 'partials/modals/message',
                    params: params,
                };
                break;
        }
        modal.deferred = deferred;
        modal.resolve = function(data) {
            closeModal(this);
            modal.deferred.resolve(data, modal);
        };
        modal.reject = function() {
            closeModal(this);
            modal.deferred.reject(modal);
        };
        $rootScope.modals.push(modal);
        angular.forEach($rootScope.modals, function(m, i) {
            m.active = false;
        });
        $timeout(function() {
            modal.active = true;
            $window.scrollTo(0, 0);
        }, 500);
        return deferred.promise;
    };

}]);
/* global angular, app */

/* global angular, app */

app.controller('RootCtrl', ['$scope', '$location', 'FirebaseApi', function($scope, $location, api) {

    $scope.api = api;

    $scope.signout = function() {
        console.log(api);
        api.auth.signout().then(function() {
            $location.path('/');
        });
    };

    api.current().then(function(user) {
        console.log(user);
    });

}]);

app.controller('HomeCtrl', ['$scope', '$location', '$timeout', 'State', 'FirebaseApi', function($scope, $location, $timeout, State, api) {

    var state = $scope.state = new State();

    state.ready();

}]);

app.controller('DashboardCtrl', ['$scope', '$location', '$timeout', 'State', 'FirebaseApi', function($scope, $location, $timeout, State, api) {

    var state = $scope.state = new State();

    state.ready();

    api.items().then(function(items){
        console.log('DashboardCtrl.items', items);
        $scope.items = items;
    });

}]);

app.controller('SigninCtrl', ['$scope', '$location', '$timeout', 'State', 'FirebaseApi', function($scope, $location, $timeout, State, api) {
    
    var state = $scope.state = new State();

    var model = $scope.model = {};

    $scope.submit = function() {
        if (state.busy()) {
            api.auth.signin(model).then(function success(response) {
                state.success();
                // $timeout(function() {
                    var path = $location.$$lastRequestedPath || '/dashboard';
                    console.log('SigninCtrl', path, response);
                    $location.path(path);
                    $location.$$lastRequestedPath = null;
                // }, 1000);
            }, function error(response) {
                console.log('SigninCtrl.error', response);
                state.error(response);
            });
        }
    };

}]);

app.controller('SignupCtrl', ['$scope', '$location', '$timeout', 'State', 'FirebaseApi', function($scope, $location, $timeout, State, api) {

    var state = $scope.state = new State();

    var model = $scope.model = {};

    $scope.submit = function() {
        if (state.busy()) {
            api.auth.signup(model).then(function success(response) {
                state.success();
                // $timeout(function() {
                    var path = $location.$$lastRequestedPath || '/dashboard';
                    console.log('SignupCtrl', path, response);
                    $location.path(path);
                    $location.$$lastRequestedPath = null;
                // }, 1000);
            }, function error(response) {
                console.log('SignupCtrl.error', response);
                state.error(response);
            });
        }
    };

}]);

app.controller('DemoCtrl', ['$scope', '$interval', 'Hash', 'Calendar', 'GanttRow', function($scope, $interval, Hash, Calendar, GanttRow) {

    var row = $scope.row = new GanttRow({
        activity: {
            id: 1000000 + getRandom(),
            name: 'Activity',
            budgetHours: 10 + Math.floor(Math.random() * 50),
        },
        project: {
            type: Math.floor(Math.random() * 5),
            deliveryDate: new Date(),
        },
    }, []);

    $scope.addItem = function() {
        var item = getRandomItem();
        row.slots.add(item);
        row.update();
        row.updateMonths();
        $scope.item = item;
        // console.log('addItem', item.id);
        log('addItem', item.id);
    };
    $scope.updateItem = function() {
        if ($scope.item) {
            var id = $scope.item.id;
            item = getRandomItem();
            item = angular.extend($scope.item, item);
            item.id = id;
            row.slots.add(item);
            row.update();
            row.updateMonths();
            $scope.item = item;
            log('updateItem', item.id);
        }
    };
    $scope.clearItems = function() {
        row.ranges.removeAll();
        row.months.removeAll();
        row.days.removeAll();
        row.slots.removeAll();
        row.update();
        row.updateMonths();
        delete $scope.item;
        log('clearItems');
    };

    var intervalId;
    $scope.start = function() {
        $scope.stop();
        intervalId = $interval($scope.addItem, 1000 / 60);
    };
    $scope.stop = function() {
        if (intervalId) {
            $interval.cancel(intervalId);
        }
    };

    function serializeDate(date) {
        function pad(v, s, z) {
            v = (v || 0) + '';
            s = (s || 2);
            z = (z || '0');
            return v.length >= s ? v : new Array(s - v.length + 1).join(z) + v;
        }
        var yyyy = date.getFullYear();
        var MM = date.getMonth() + 1; // getMonth() is zero-based
        var dd = date.getDate();
        var hh = date.getHours();
        var mm = date.getMinutes();
        var ss = date.getSeconds();
        return yyyy + '-' + pad(MM) + '-' + pad(dd) + 'T' + pad(hh) + ':' + pad(mm) + ':' + pad(ss);
    }

    function getRandom() {
        return 1000000 + Math.floor(Math.random() * 100000);
    }

    function getRandomDay() {
        var oneday = (24 * 60 * 60 * 1000);
        var date = new Date();
        date.setDate(date.getDate() + Math.floor(Math.random() * 60));
        // date.setMonth(date.getMonth() + Math.floor(Math.random() * 2));
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        var yyyy = date.getFullYear();
        var MM = date.getMonth();
        var key = Math.ceil(date.getTime() / oneday);
        var mKey = yyyy * 12 + MM;
        return {
            key: key,
            mKey: mKey,
            date: serializeDate(date)
        };
    }

    var uid = 1;

    function getRandomItem() {
        var day = getRandomDay();
        var item = {
            id: uid,
            hours: 1 + Math.floor(Math.random() * 6),
            date: new Date(day.date),
            key: day.key,
            mKey: day.mKey,
            activityId: row.id,
        };
        if (Math.floor(Math.random() * 3) === 0) {
            item.taskId = 10000 + Math.floor(Math.random() * 50);
        }
        uid++;
        return item;
    }

    function log() {
        $scope.log = Array.prototype.slice.call(arguments);
    }
}]);

app.constant('ganttGroups', {
    ACTIVITY: 1,
    CUSTOMER: 2,
    DEPARTMENT: 3,
    GROUP: 4,
    MANAGER: 5,
    PROJECT: 6,
    RESOURCE: 7,
    USER: 9,
});

app.factory('Hash', [function() {
    var pools = {};

    function Hash(key, pool) {
        key = key || 'id';
        pool = pool ? Hash.get(pool) : {};
        Object.defineProperties(this, {
            key: {
                value: key,
                enumerable: false,
                writable: false
            },
            pool: {
                value: pool,
                enumerable: false,
                writable: false
            },
            length: {
                value: 0,
                enumerable: false,
                writable: true
            }
        });
    }

    function has(id) {
        return this.pool[id] !== undefined;
    }

    function getId(id) {
        return this.pool[id];
    }

    function get(item) {
        var hash = this,
            key = this.key;
        return item ? hash.getId(item[key]) : null;
    }

    function set(item) {
        var hash = this,
            pool = this.pool,
            key = this.key;
        pool[item[key]] = item;
        hash.push(item);
        return item;
    }

    function add(newItem) {
        var hash = this;
        var item = hash.get(newItem);
        if (item) {
            for (var i = 0, keys = Object.keys(newItem), p; i < keys.length; i++) {
                p = keys[i];
                item[p] = newItem[p];
            }
        } else {
            item = hash.set(newItem);
        }
        return item;
    }

    function remove(oldItem) {
        var hash = this,
            pool = this.pool,
            key = this.key;
        var item = hash.get(oldItem);
        if (item) {
            var index = hash.indexOf(item);
            if (index !== -1) {
                hash.splice(index, 1);
            }
            delete pool[item[key]];
        }
        return hash;
    }

    function addMany(items) {
        var hash = this;
        if (!items) {
            return hash;
        }
        var i = 0;
        while (i < items.length) {
            hash.add(items[i]);
            i++;
        }
        return hash;
    }

    function removeMany(items) {
        var hash = this;
        if (!items) {
            return hash;
        }
        var i = 0;
        while (i < items.length) {
            hash.remove(items[i]);
            i++;
        }
        return hash;
    }

    function removeAll() {
        var hash = this,
            key = hash.key,
            pool = hash.pool;
        var i = 0,
            t = hash.length,
            item;
        while (hash.length) {
            item = hash.shift();
            delete pool[item[key]];
            i++;
        }
        return hash;
    }

    function each(callback) {
        var hash = this;
        if (callback) {
            var i = 0;
            while (i < hash.length) {
                callback(hash[i], i);
                i++;
            }
        }
        return hash;
    }

    function forward(key, reverse) {
        var hash = this;
        key = (key || this.key);
        hash.sort(function(c, d) {
            var a = reverse ? d : c;
            var b = reverse ? c : d;
            return a[key] - b[key];
        });
        return hash;
    }

    function backward(key) {
        return this.forward(key, true);
    }

    function differs(hash) {
        if (hash.key !== this.key || hash.length !== this.length) {
            return true;
        } else {
            var differs = false,
                i = 0,
                t = this.length,
                key = this.key;
            while (differs && i < t) {
                differs = this[i][key] !== hash[i][key];
                i++;
            }
        }
    }

    function updatePool() {
        var hash = this,
            pool = this.pool,
            key = this.key;
        Object.keys(pool).forEach(function(key) {
            delete pool[key];
        });
        angular.forEach(hash, function(item) {
            pool[item[key]] = item;
        });
    }
    Hash.get = function(pool) {
        return (pools[pool] = pools[pool] || {});
    };
    Hash.prototype = new Array;
    Hash.prototype.has = has;
    Hash.prototype.getId = getId;
    Hash.prototype.get = get;
    Hash.prototype.set = set;
    Hash.prototype.add = add;
    Hash.prototype.remove = remove;
    Hash.prototype.each = each;
    Hash.prototype.addMany = addMany;
    Hash.prototype.removeMany = removeMany;
    Hash.prototype.removeAll = removeAll;
    Hash.prototype.forward = forward;
    Hash.prototype.backward = backward;
    Hash.prototype.differs = differs;
    Hash.prototype.updatePool = updatePool;
    return Hash;
}]);

app.factory('Calendar', ['Hash', function(Hash) {
    var oneday = (24 * 60 * 60 * 1000);
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    var todayKey = Math.ceil(today.getTime() / oneday);

    function ArrayFrom(len, callback) {
        var a = [];
        while (a.length < len) {
            a.push(callback(a.length));
        }
        return a;
    }
    var months = new Hash('mKey');

    function Calendar() {}
    Calendar.getDate = function(day) {
        if (typeof day.date.getMonth === 'function') {
            return day.date;
        } else {
            return new Date(day.date);
        }
    };
    Calendar.clearMonth = function(month) {
        month.days.each(function(day) {
            if (day) {
                day.hours = 0;
                day.tasks = [];
            }
        });
    };
    Calendar.getMonth = function(day) {
        today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        todayKey = Math.ceil(today.getTime() / oneday);
        //
        var date = Calendar.getDate(day);
        var yyyy = date.getFullYear();
        var MM = date.getMonth();
        var key = Math.ceil(date.getTime() / oneday);
        var mKey = yyyy * 12 + MM;
        var month = months.getId(mKey);
        if (!month) {
            var fromDay = new Date(yyyy, MM, 1).getDay();
            var monthDays = new Date(yyyy, MM + 1, 0).getDate();
            var weeks = Math.ceil(monthDays / 7);
            month = {
                date: date,
                mKey: mKey,
                month: MM,
                monthDays: monthDays,
                fromDay: fromDay,
                days: new Hash('key'),
            };
            month.weeks = ArrayFrom(weeks, function(r) {
                var days = ArrayFrom(7, function(c) {
                    var item = null;
                    var d = r * 7 + c - (fromDay - 1);
                    if (d >= 0 && d < monthDays) {
                        var date = new Date(yyyy, MM, d + 1);
                        var key = Math.ceil(date.getTime() / oneday);
                        item = {
                            $today: key === todayKey,
                            c: c,
                            r: r,
                            d: d + 1,
                            date: date,
                            key: key,
                            hours: 0,
                            tasks: [],
                        };
                        item = month.days.add(item);
                    }
                    return item;
                });
                return {
                    r: r,
                    days: days,
                };
            });
            month = months.add(month);
        }
        return month;
    };
    Calendar.getDay = function(days) {
        var date = new Date(today);
        date.setDate(date.getDate() + days);
        return date;
    };
    Calendar.getKey = function(date) {
        return Math.ceil(date.getTime() / oneday);
    };
    return Calendar;
}]);

app.factory('GanttRow', ['Hash', 'Calendar', 'ganttGroups', function(Hash, Calendar, ganttGroups) {
    var uid = 1;

    var oneday = (24 * 60 * 60 * 1000);
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    var todayKey = Math.ceil(today.getTime() / oneday);

    function GanttRow(data, colors) {
        this.type = ganttGroups.ACTIVITY;
        this.assignedHours = 0;
        this.slots = new Hash('id');
        this.days = new Hash('key');
        this.months = new Hash('mKey');
        this.ranges = new Hash('rKey');
        this.tasks = new Hash('id'); // 'taskId'
        // angular.isObject(data) ? angular.extend(this, data) : null;
        if (data) {
            this.id = data.activity.id;
            this.name = data.activity.name;
            this.budgetHours = data.activity.budgetHours;
            this.useBudget = data.project.type !== 2 && data.project.type !== 4;
            this.customer = data.customer;
            this.department = data.department;
            this.manager = data.manager;
            this.project = data.project;
            this.resource = data.resource;
            this.color = colors[this.id % (colors.length || 1)];
        }
        // this.items = new Hash().fill(data.items);
        this.lastTaskId = null;
        this.update();
    }
    GanttRow.prototype = {
        canSelect: function() {
            return this.type === ganttGroups.ACTIVITY && this.budgetHours > 0;
        },
        canEdit: function() {
            return this.canSelect() && this.resource.name.toLowerCase().indexOf('nondefinito') === -1;
        },
        mergeSlot: function(slot) {
            var slots = this.slots;
            if (slot.hours) {
                slots.add(slot);
            } else {
                slots.remove(slot);
            }
        },
        insertSlot: function(key, hours, taskId) {
            var slot = null;
            if (this.useBudget) {
                hours = Math.min(hours, this.budgetHours - this.assignedHours);
            }
            hours = Math.max(0, hours);
            if (hours > 0) {
                var item = {
                    id: 'temp-' + (uid++),
                    key: key,
                    date: new Date(key * oneday),
                    hours: hours,
                    activityId: this.id,
                };
                if (taskId) {
                    item.taskId = taskId;
                    this.lastTaskId = taskId;
                }
                this.slots.add(item);
                slot = this.slots.getId(item.id);
            }
            this.update();
            return slot;
        },
        removeSlots: function(key) {
            var day = this.days.getId(key);
            day.tasks.each(function(item) {
                item.hours = 0;
            });
            var slots = day.tasks.slice();
            this.slots.removeMany(slots);
            this.update();
            return slots;
        },
        toggleSlots: function(key, hours) {
            if (this.days.has(key)) {
                return this.removeSlots(key);
            } else {
                var slot = this.insertSlot(key, hours, this.lastTaskId);
                return [slot];
            }
        },
        // WRITE CANCEL DAY SLOT
        assign: function(col, value) {
            console.log('assign');
            var slots = this.slots,
                key = col.$key;
            var item = {
                // errore
                id: 'temp-' + (uid++),
                key: key,
                date: col.$date,
                hours: value || 0,
                activityId: this.id,
            };
            if (value) {
                slots.add(item);
            } else {
                slots.remove(item);
            }
            this.update();
            return this.days.getId(key);
        },
        write: function(col, value, max) {
            value = Math.min(value, max);
            if (this.useBudget) {
                value = Math.min(value, this.budgetHours - this.assignedHours);
            }
            value = Math.max(0, value);
            if (value && !this.days.has(col.$key) && col.$date >= today) {
                return this.assign(col, value);
            }
        },
        erase: function(col, value, max) {
            if (this.days.has(col.$key) && col.$date >= today) {
                return this.assign(col, null);
            }
        },
        toggle: function(col, value, max) {
            if (this.days.has(col.$key)) {
                return this.erase(col, value, max);
            } else {
                return this.write(col, value, max);
            }
        },
        // WRITE CANCEL DAY SLOT
        update: function() {
            var total = 0;
            var slots = this.slots,
                days = this.days;
            days.removeAll();
            var taskId = null;
            slots.each(function(item) {
                taskId = item.taskId || taskId;
                total += item ? item.hours : 0;
                var day = days.add({
                    key: item.key,
                    date: item.date,
                    hours: 0,
                });
                day.tasks = day.tasks || new Hash('id'); // 'taskId'
                day.tasks.add(angular.copy(item));
                day.tasks.each(function(task) {
                    day.hours += task.hours;
                });
            });
            this.lastTaskId = taskId || this.lastTaskId;
            days.forward(); // sort by key       
            this.assignedHours = total;
            this.updateRanges();
        },
        updateMonths: function() {
            var days = this.days,
                months = this.months;
            months.removeAll();
            var previous;
            days.each(function(item) {
                var month = Calendar.getMonth(item);
                if (month !== previous) {
                    previous = month;
                    Calendar.clearMonth(month);
                }
                months.add(month);
                var day = month.days.getId(item.key);
                if (day) {
                    day.hours = item.hours;
                    day.tasks = item.tasks;
                }
            });
            months.forward(); // sort by key  
        },
        updateRanges: function() {
            var days = this.days,
                ranges = this.ranges;
            ranges.removeAll();
            var rKey = 0,
                lastDay;
            days.each(function(day, i) {
                if (lastDay) {
                    if (day.key - lastDay.key > 1 || day.tasks.differs(lastDay.tasks)) {
                        rKey++;
                    }
                }
                lastDay = day;
                var range = ranges.add({
                    rKey: rKey,
                });
                range.days = range.days || [];
                range.days.push(day.key);
            });
            ranges.forward(); // sort by key   
        },
        getRange: function(col, from, to) {
            var ranges = this.ranges,
                range = null,
                key = col.$key;
            ranges.each(function(item) {
                var index = item.days.indexOf(key);
                if (index !== -1) {
                    item.c = index;
                    item.firstKey = Math.max(from, item.days[0]);
                    item.lastKey = Math.min(to, item.days[item.days.length - 1]);
                    range = item;
                }
            });
            return range;
        },
        updateRange: function(col, from, to) {
            var ranges = this.ranges,
                range = this.getRange(col, from, to);
            if (range) {
                range.previousKey = null;
                range.nextKey = null;
                var r = range.rKey;
                if (r > 0) {
                    var p = ranges[r - 1];
                    range.previousKey = p.days[p.days.length - 1];
                }
                if (r < ranges.length - 1) {
                    var n = ranges[r + 1];
                    range.nextKey = n.days[0];
                }
            }
            return range;
        },
        canMoveRange: function(range, dir) {
            // rifare !!!
            var can = true;
            var row = this;
            var first = range.items[0];
            var last = range.items[range.items.length - 1];
            var key = row.getOffsetKey(first.startDate, dir);
            var i = 0,
                t = range.items.length;
            while (i < t) {
                var k = key + i;
                if (k < todayKey || (row.days.getId(k) && range.items.indexOf(row.days.getId(k)) === -1)) { // sistemare!!
                    can = false;
                    i = t;
                }
                i++;
            }
            return can;
        },
        moveRange: function(range, dir) {
            if (range.items.length) {
                var row = this;
                if (row.canMoveRange(range, dir)) {
                    angular.forEach(range.items, function(item) {
                        row.addDays(item, dir);
                    });
                    row.update();
                }
            }
        },
        addDays: function(item, days) {
            // console.log('GanttRow.addDay', item, days);
            var date = new Date(item.startDate);
            date.setDate(date.getDate() + days);
            item.date = date;
            item.key = Math.ceil(date.getTime() / oneday);
            return item;
        },
        getOffsetKey: function(date, day) {
            date = new Date(date);
            date.setDate(date.getDate() + day);
            var key = Math.ceil(date.getTime() / oneday);
            return key;
        },
        getHours: function(key) {
            var hours = 0;
            var day = this.days.getId(key);
            if (day) {
                day.tasks.each(function(task) {
                    hours += task.hours;
                });
            }
            return hours;
        },
        toggleOpened: function() {
            // console.log('toggleOpened');
            this.opened = !this.opened;
        },
        compress: function(key) {
            if (!this.items.length) {
                return;
            }
            this.items.sort(function(a, b) {
                return a.key - b.key;
            });
            var item = Utils.where(this.items, { key: key });
            item = item || this.items[0];
            var index = this.items.indexOf(item);
            var i = index,
                t = this.items.length;
            key = Math.max(key, todayKey);
            // da rifare
            // collezionare ore totali
            // redistribuire records in base a carico giornaliero
            // spostare su gantt
            while (i < t) {
                item = this.items[i];
                item.key = key + i - index;
                item.date = new Date(item.key * oneday);
                i++;
            }
            this.update();
        },
    };
    GanttRow.serialNumber = function(number, max) {
        return new Array((1 + (max.toString().length) - (number.toString().length))).join('0');
    };
    return GanttRow;
}]);
/* global angular, app */

app.directive('header', [function() {
    return {
        restrict: 'E',
        templateUrl: 'partials/header',
        transclude: {
            'header': '?headerItems',
        },
        link: function(scope, element, attributes, model) {}
    };
}]);

app.directive('controlMessages', [function() {
    return {
        restrict: 'E',
        templateUrl: 'partials/control-messages',
        transclude: {
            'message': '?messageItems',
        },
        link: function(scope, element, attributes, model) {}
    };
}]);

app.directive('control', ['$http', '$templateCache', '$compile', '$parse', function($http, $templateCache, $compile, $parse) {
    function formatLabel(string, prepend, expression) {
        string = string || '';
        prepend = prepend || '';
        var splitted = string.split(',');
        if (splitted.length > 1) {
            var formatted = splitted.shift();
            angular.forEach(splitted, function(value, index) {
                if (expression) {
                    formatted = formatted.split('{' + index + '}').join('\' + ' + prepend + value + ' + \'');
                } else {
                    formatted = formatted.split('{' + index + '}').join(prepend + value);
                }
            });
            if (expression) {
                return '\'' + formatted + '\'';
            } else {
                return formatted;
            }
        } else {
            return prepend + string;
        }
    }
    var uniqueId = 0;
    return {
        restrict: 'A',
        templateUrl: function(element, attributes) {
            var template = 'partials/control';
            switch (attributes.control) {
                case 'select':
                    template = 'partials/control-select';
                    break;
            }
            return template;
        },
        scope: {
            ngModel: '=',
            required: '=',
            form: '@',
            title: '@',
            placeholder: '@',
        },
        require: 'ngModel',
        link: function(scope, element, attributes, model) {

        },
        compile: function(element, attributes) {
                return {
                    pre: function(scope, element, attributes) {
                        if (attributes.control === 'select') {
                            var label = (attributes.label ? attributes.label : 'name');
                            var key = (attributes.key ? attributes.key : 'id');
                            var filter = (attributes.min ? ' | filter:gte(\'' + key + '\', ' + attributes.min + ')' : '');
                            var optionLabel = formatLabel(label, 'item.', true);
                            scope.options = attributes.number ?
                                'item.' + key + ' as ' + optionLabel + ' disable when item.disabled for item in ' + attributes.source + filter :
                                optionLabel + ' disable when item.disabled for item in ' + attributes.source + filter + ' track by item.' + key;
                            console.log('control.compile.pre', scope.options);
                        }
                        var type = scope.type = attributes.control;
                        var form = scope.form = scope.form || 'form';
                        var title = scope.title = scope.title || 'untitled';
                        var placeholder = scope.placeholder = scope.placeholder || title;
                        var field = scope.field = title.replace(/[^0-9a-zA-Z]/g, "").split(' ').join('') + (++uniqueId);
                        scope.minLength = attributes.min || 0;
                        scope.maxLength = attributes.max || Number.POSITIVE_INFINITY;
                        scope.focus = false;
                        scope.getType = function() {
                            var type = 'text';
                            switch (attributes.control) {
                                case 'password':
                                    // var form = $parse(scope.form)(scope.$parent);
                                    // var field = $parse(scope.form + '.' + scope.field)(scope.$parent);
                                    type = scope.visible ? 'text' : 'password';
                                    break;
                                default:
                                    type = attributes.control;
                            }
                            console.log('control.getType', type);
                            return type;
                        };
                        scope.getClasses = function() {
                            var form = $parse(scope.form)(scope.$parent);
                            var field = $parse(scope.form + '.' + scope.field)(scope.$parent);
                            return {
                                'control-focus': scope.focus,
                                'control-success': field.$valid,
                                'control-error': field.$invalid && (form.$submitted || field.$touched),
                                'control-empty': !field.$viewValue
                            };
                        };
                        scope.getMessages = function() {
                            var form = $parse(scope.form)(scope.$parent);
                            var field = $parse(scope.form + '.' + scope.field)(scope.$parent);
                            return (form.$submitted || field.$touched) && field.$error;
                        };
                    },
                    // post: function (scope, element, attributes) { }
                };
            }
            /*
            compile: function(element, attributes) {
                element.removeAttr('my-dir'); 
                element.attr('ng-hide', 'true');
                return function(scope) {
                    $compile(element)(scope);
                };
            },
            */
    };
}]);

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
            };

            function addListeners() {
                element.on('touchstart click', onClick);
            };

            function removeListeners() {
                element.off('touchstart click', onClick);
            };
            scope.$on('$destroy', function() {
                removeListeners();
            });
            addListeners();
        }
    }
}]);

app.directive('controlRow', ['$http', '$templateCache', '$compile', function($http, $templateCache, $compile) {
    var aid = 0;

    function _format(string, prepend, expression) {
        string = string || '';
        prepend = prepend || '';
        var splitted = string.split(',');
        if (splitted.length > 1) {
            var formatted = splitted.shift();
            angular.forEach(splitted, function(value, index) {
                if (expression) {
                    formatted = formatted.split('{' + index + '}').join('\' + ' + prepend + value + ' + \'');
                } else {
                    formatted = formatted.split('{' + index + '}').join(prepend + value);
                }
            });
            if (expression) {
                return '\'' + formatted + '\'';
            } else {
                return formatted;
            }
        } else {
            return prepend + string;
        }
    }

    function templateFunction(element, attributes) {
        var form = attributes.form || 'Form';
        var title = attributes.title || 'Untitled';
        var placeholder = attributes.placeholder || title;
        var name = title.replace(/[^0-9a-zA-Z]/g, "").split(' ').join('') + (++aid);
        var formKey = form + '.' + name;
        var formFocus = ' ng-focus="' + formKey + '.hasFocus=true" ng-blur="' + formKey + '.hasFocus=false"';
        var message = '',
            decoration = '',
            disabled = '';
        var label = (attributes.label ? attributes.label : 'name');
        var key = (attributes.key ? attributes.key : 'id');
        var model = attributes.model;
        var change = (attributes.onChange ? ' ng-change="' + attributes.onChange + '"' : '');
        var focus = (attributes.onFocus ? ' ng-focus="' + attributes.onFocus + '"' : '');
        var blur = (attributes.onBlur ? ' ng-blur="' + attributes.onBlur + '"' : '');
        var inputCols = attributes.cols ? 6 : 9;
        var colInput = 'col-lg-' + inputCols;
        var colLabel = 'col-lg-' + (12 - inputCols);
        if (attributes.cols === '12') {
            colLabel = colInput = 'col-lg-12';
        }
        var required = (attributes.required ? ' required="true"' : '');
        var readonly = (attributes.readonly ? ' readonly' : '');
        var options = (attributes.options ? ' ng-model-options="' + attributes.options + '" ' : '');
        var validate = (attributes.validate ? ' validate-type="' + attributes.validate + '" ' : '');
        var format = (attributes.format ? ' format="' + attributes.format + '" ' : '');
        var precision = (attributes.precision ? ' precision="' + attributes.precision + '" ' : '');
        if (attributes.disabled) {
            disabled = ' disabled';
        }
        if (attributes.ngDisabled) {
            disabled = ' ng-disabled="' + attributes.ngDisabled + '"';
        }
        if (attributes.required) {
            decoration = attributes.readonly || attributes.disabled ? '' : '<sup>âœ½</sup>';
        }
        message = '<span ng-messages="' + (attributes.readonly ? '' : '(' + form + '.$submitted || ' + formKey + '.$touched) && ') + formKey + '.$error" role="alert">';
        message = message + '<span ng-message="required" class="label-error animated flash">obbligatorio â¤´</span>';
        switch (attributes.controlRow) {
            case 'password':
                message = message + '<span ng-message="minlength" class="label-error animated flash">almeno 6 caratteri â¤´</span>';
                break;
            case 'email':
                message = message + '<span ng-message="email" class="label-error animated flash">valore non corretto â¤´</span>';
                break;
            case 'number':
            case 'range':
                message = message + '<span ng-message="positive" class="label-error animated flash">solo valori positivi â¤´</span>';
                message = message + '<span ng-message="number" class="label-error animated flash">solo valori numerici â¤´</span>';
                break;
        }
        if (attributes.match !== undefined) {
            message = message + '<span ng-message="match" class="label-error animated flash">non corrispondente â¤´</span>';
        }
        message = message + '</span>';
        var validation = ' ng-class="{ \'control-focus\': ' + formKey + '.hasFocus, \'control-success\': ' + formKey + '.$valid, \'control-error\': ' + formKey + '.$invalid && (' + form + '.$submitted || ' + formKey + '.$touched), \'control-empty\': !' + formKey + '.$viewValue }"';
        var template = '<div class="row" ' + validation + '><label for="' + name + '" class="' + colLabel + ' col-form-label">' + title + decoration + '</label><div class="' + colInput + ' col-' + attributes.controlRow + '">';
        switch (attributes.controlRow) {
            case 'static':
                var click = (attributes.click ? ' ng-click="' + attributes.click + '"' : '');
                var mouseover = (attributes.mouseover ? ' ng-mouseover="' + attributes.mouseover + '"' : '');
                var mouseout = (attributes.mouseout ? ' ng-mouseover="' + attributes.mouseout + '"' : '');
                var icon = (attributes.icon ? '<i class="pull-xs-right ' + attributes.icon + '"></i>' : '');
                template += '<p class="form-control" ' + click + mouseover + mouseout + '><span ng-bind-html="' + model + ' || \'&nbsp;\'"></span>' + icon + '</p>';
                break;
            case 'checkbox':
                template = '<div class="' + colInput + '"' + validation + '><div class="col-xs-12"><label class="custom-control custom-checkbox">';
                template += '   <input type="checkbox" class="custom-control-input" ng-model="' + model + '">';
                template += '   <span class="custom-control-indicator"></span>';
                template += '   <span class="custom-control-description">' + title + '</span>';
                template += '</label>';
                // template += '<input id="' + name + '" name="' + name + '" type="checkbox" ng-model="' + model + '" ' + change + focus + blur + required + ' class="toggle toggle-round-flat">';
                /*
                template = '<div class="checkbox">';
                template += '<span class="checkbox-label">' + title + required +'</span>';
                template += '<span class="switch"><input id="' + name + '" name="' + name + '" type="checkbox" ng-model="' + model + '" ' + change + focus + blur + required + ' class="toggle toggle-round-flat"><label for="' + name + '"></label></span>';
                template += '</div>';
                */
                break;
            case 'yesno':
                template = '<div class="row" ' + validation + '><label class="col-lg-6 custom-control custom-checkbox">' + title + decoration + '</label>';
                template += '<div class="' + colLabel + '"><label class="custom-control custom-checkbox">';
                template += '   <input type="checkbox" class="custom-control-input" ng-model="' + model + '" ng-change="' + model + 'No=!' + model + '">';
                template += '   <span class="custom-control-indicator"></span>';
                template += '   <span class="custom-control-description">SÃ¬</span>';
                template += '</label></div>';
                template += '<div class="' + colLabel + '"><label class="custom-control custom-checkbox">';
                template += '   <input type="checkbox" class="custom-control-input" ng-model="' + model + 'No" ng-change="' + model + '=!' + model + 'No">';
                template += '   <span class="custom-control-indicator"></span>';
                template += '   <span class="custom-control-description">No</span>';
                template += '</label>';
                // template += '<input id="' + name + '" name="' + name + '" type="checkbox" ng-model="' + model + '" ' + change + focus + blur + required + ' class="toggle toggle-round-flat">';
                /*
                template = '<div class="checkbox">';
                template += '<span class="checkbox-label">' + title + required +'</span>';
                template += '<span class="switch"><input id="' + name + '" name="' + name + '" type="checkbox" ng-model="' + model + '" ' + change + focus + blur + required + ' class="toggle toggle-round-flat"><label for="' + name + '"></label></span>';
                template += '</div>';
                */
                break;
            case 'switch':
                if (attributes.disabled) {
                    disabled = ' disabled="true"';
                }
                if (attributes.ngDisabled) {
                    disabled = ' disabled="' + attributes.ngDisabled + '"';
                }
                template = '<div class="row control-switch" ' + validation + '><label for="' + name + '" class="' + colLabel + ' col-form-label">' + title + decoration + '</label>';
                template += '<div class="' + colInput + '">';
                template += '<switch name="' + name + '" ng-model="' + model + '" ' + change + focus + blur + options + ' on="SÃ¬" off="No" ' + required + disabled + readonly + formFocus + '></switch>';
                break;
            case 'range':
                validate = ' validate-type="number"';
                var nameHi = name + 'Hi';
                var formKeyHi = form + '.' + nameHi;
                var modelHi = attributes.modelHi;
                var validationHi = ' ng-class="{ \'control-focus\': ' + formKeyHi + '.hasFocus, \'control-success\': ' + formKeyHi + '.$valid, \'control-error\': ' + formKeyHi + '.$invalid && (' + form + '.$submitted || ' + formKeyHi + '.$touched), \'control-empty\': !' + formKeyHi + '.$viewValue }"';
                var requiredHi = required;
                if (attributes.requiredHi == 'true') {
                    requiredHi = ' required="true"';
                } else if (attributes.requiredHi == 'false') {
                    requiredHi = '';
                }
                var messageHi = ' ',
                    decorationHi = ' ';
                if (attributes.required && attributes.requiredHi !== 'false') {
                    decorationHi = attributes.readonly || attributes.disabled ? '' : '<sup>âœ½</sup>';
                }
                messageHi = '<span ng-messages="' + (attributes.readonly ? '' : '(' + form + '.$submitted || ' + formKeyHi + '.$touched) && ') + formKeyHi + '.$error" role="alert">';
                messageHi = messageHi + '<span ng-message="required" class="label-error animated flash">obbligatorio â¤´</span>';
                switch (attributes.controlRow) {
                    case 'password':
                        messageHi = messageHi + '<span ng-message="minlength" class="label-error animated flash">almeno 3 caratteri â¤´</span>';
                        break;
                    case 'email':
                        messageHi = messageHi + '<span ng-message="email" class="label-error animated flash">valore non corretto â¤´</span>';
                        break;
                    case 'number':
                    case 'range':
                        messageHi = messageHi + '<span ng-message="positive" class="label-error animated flash">solo valori positivi â¤´</span>';
                        messageHi = messageHi + '<span ng-message="number" class="label-error animated flash">solo valori numerici â¤´</span>';
                        break;
                }
                if (attributes.match !== undefined) {
                    messageHi = messageHi + '<span ng-message="match" class="label-error animated flash">non corrispondente â¤´</span>';
                }
                messageHi = messageHi + '</span>';
                template = '<div class="row"><label for="' + name + '" class="' + colLabel + ' col-form-label">' + title + '</label><div class="' + colInput + ' col-' + attributes.controlRow + '">';
                template += '<div class="form-control-range form-control-range-min" ' + validation + '>' + decoration + '<input class="form-control" name="' + name + '" ng-model="' + model + '" ' + change + focus + blur + options + ' placeholder="' + placeholder + '" type="text"' + required + disabled + readonly + formFocus + validate + format + precision + '>' + message + '</div>';
                template += '<div class="form-control-range form-control-range-max" ' + validationHi + '>' + decorationHi + '<input class="form-control" name="' + nameHi + '" ng-model="' + modelHi + '" ' + change + focus + blur + options + ' placeholder="' + placeholder + '" type="text"' + requiredHi + disabled + readonly + formFocus + validate + format + precision + '>' + messageHi + '</div>';
                return template + '</div></div>';
                break;
            case 'range-slider':
                var himodel = (attributes.himodel ? ' rz-slider-high="' + attributes.himodel + '" ' : '');
                options = (attributes.options ? ' rz-slider-options="' + attributes.options + '" ' : '');
                template += '<rzslider rz-slider-model="' + model + '" ' + himodel + options + '"></rzslider>';
                break;
            case 'select':
                var filter = (attributes.min ? ' | filter:gte(\'' + key + '\', ' + attributes.min + ')' : '');
                var optionLabel = _format(label, 'item.', true);
                var options = attributes.number ?
                    'item.' + key + ' as ' + optionLabel + ' disable when item.disabled for item in ' + attributes.source + filter :
                    optionLabel + ' disable when item.disabled for item in ' + attributes.source + filter + ' track by item.' + key;
                template += '<select name="' + name + '" class="form-control" ng-model="' + model + '" ' + change + focus + blur + ' ng-options="' + options + '" ' + (attributes.number ? 'convert-to-number' : '') + required + disabled + '><option value="" disabled selected hidden>' + placeholder + '</option></select>';
                break;
            case 'autocomplete':
                var canCreate = (attributes.canCreate ? attributes.canCreate : false);
                var flatten = (attributes.flatten ? attributes.flatten : false);
                var queryable = (attributes.queryable ? attributes.queryable : false);
                var onSelected = (attributes.onSelected ? ' on-selected="' + attributes.onSelected + '"' : '');
                template += '<input name="' + name + '" ng-model="' + model + '" type="hidden" ' + (attributes.required ? 'required' : '') + '>';
                template += '<div control-autocomplete="' + attributes.source + '" model="' + model + '" label="' + label + '"  key="' + key + '" can-create="' + canCreate + '" flatten="' + flatten + '" queryable="' + queryable + '" placeholder="' + placeholder + '" on-focus="' + formKey + '.hasFocus=true" on-blur="' + formKey + '.hasFocus=false"' + onSelected + '></div>';
                break;
            case 'textarea':
                var rows = (attributes.rows ? attributes.rows : '1');
                template += '<textarea name="' + name + '" class="form-control" ng-model="' + model + '" ' + change + focus + blur + options + ' placeholder="' + placeholder + '" ' + required + disabled + ' rows="' + rows + '"' + formFocus + '></textarea>';
                break;
            case 'htmltext':
                var taDisabled = '';
                if (attributes.disabled) {
                    taDisabled = ' ta-disabled="true"';
                }
                if (attributes.ngDisabled) {
                    taDisabled = ' ta-disabled="' + attributes.ngDisabled + '"';
                }
                template += '<div text-angular name="' + name + '" ta-paste="doStripHtml($html)" ng-model="' + model + '" ' + change + focus + blur + options + ' placeholder="' + placeholder + '" ' + required + taDisabled + readonly + formFocus + (attributes.required ? ' ta-min-text="1"' : '') + '></div>';
                break;
            case 'password':
                template += '<div class="input-group"><input name="' + name + '" class="form-control" ng-model="' + model + '" ' + change + focus + blur + options + ' placeholder="' + placeholder + '" type="{{form.' + name + ' ? \'password\' : \'text\'}}" ng-minlength="6" ' + required + disabled + formFocus + '><span class="input-group-addon" ng-if="' + model + '"><span class="icon-eye" ng-click="form.' + name + ' = !form.' + name + '"></span></span></div>';
                break;
            case 'email':
                template += '<input name="' + name + '" class="form-control" ng-model="' + model + '" ' + change + focus + blur + options + ' placeholder="' + placeholder + '" type="email" ' + required + disabled + formFocus + '>';
                break;
            case 'number-picker':
                validate = ' validate-type="anynumber"';
                /*
                var doSub = model + ' = ' + model + ' -1';
                if (attributes.min) {
                    validate += ' min="' + attributes.min + '"';
                    doSub = model + ' = Math.max(' + attributes.min + ', ' + model + ' -1)';
                }
                var doAdd = model + ' = ' + model + ' +1';
                if (attributes.max) {
                    validate += ' max="' + attributes.max + '"';
                    doAdd = model + ' = Math.min(' + attributes.max + ', ' + model + ' +1)';
                }
                template += '<div class="input-group">';
                template += '   <span class="input-group-btn"><button class="btn btn-outline-primary" type="button" ng-click="(' + doSub + ')">-</button></span>';
                template += '   <input name="' + name + '" class="form-control" ng-model="' + model + '" ' + change + focus + blur + options + ' placeholder="' + placeholder + '" type="text"' + required + disabled + readonly + formFocus + validate + format + precision + '>';
                template += '   <span class="input-group-btn"><button class="btn btn-outline-primary" type="button" ng-click="(' + doAdd + ')">+</button></span>';
                template += '</div>';
                */
                template += '<div number-picker="' + model + '" min="' + attributes.min + '" max="' + attributes.max + '">';
                template += '   <input name="' + name + '" class="form-control" ng-model="' + model + '" ' + change + focus + blur + options + ' placeholder="' + placeholder + '" type="text"' + required + disabled + readonly + formFocus + validate + format + precision + '>';
                template += '</div>';
                break;
            case 'number':
                validate = ' validate-type="number"';
                template += '<input name="' + name + '" class="form-control" ng-model="' + model + '" ' + change + focus + blur + options + ' placeholder="' + placeholder + '" type="text"' + required + disabled + readonly + formFocus + validate + format + precision + '>';
                break;
            case 'anynumber':
                validate = ' validate-type="anynumber"';
                template += '<input name="' + name + '" class="form-control" ng-model="' + model + '" ' + change + focus + blur + options + ' placeholder="' + placeholder + '" type="text"' + required + disabled + readonly + formFocus + validate + format + precision + '>';
                break;
            case 'date':
                validate = ' validate-type="date"';
                format = ' format="dd-MM-yyyy"';
                if (attributes.disabled || attributes.readonly) {
                    template += '<div class="input-group"><input type="text" class="form-control" name="' + name + '" ng-model="' + model + '" placeholder="' + placeholder + '" ' + required + disabled + readonly + formFocus + validate + format + '><span class="input-group-addon"><i class="icon-calendar"></i></span></div>';
                } else {
                    template += '<input type="date" name="' + name + '" class="form-control form-control-hidden" is-open="flags.' + name + '" ng-model="' + model + '" placeholder="dd-MM-yyyy" ' + required + disabled + readonly + formFocus + ' uib-datepicker-popup datepicker-options="sources.datepickerOptions" datepicker-template-url="uib/template/datepicker/datepicker.html" show-button-bar="false" current-text="Oggi" clear-text="Rimuovi" close-text="Chiudi">';
                    template += '<div ng-click="(flags.' + name + ' = true)" class="input-group disabled"><input type="text" class="form-control" name="' + name + '" ng-model="' + model + '" placeholder="' + placeholder + '" ' + required + disabled + readonly + formFocus + validate + format + '><span class="input-group-addon"><i class="icon-calendar"></i></span></div>';
                }
                break;
                /*
        case 'date':
            placeholder = placeholder || 'dd-MM-yyyy';
            template += '<input name="' + name + '" class="form-control" ng-model="' + model + '" ' + change + focus + blur + options + ' placeholder="' + placeholder + '" type="date"' + required + disabled + readonly + formFocus + '>';
            break;
            */
            case 'datetime-local':
                placeholder = placeholder || 'dd-MM-yyyyTHH:mm:ss';
                // placeholder == title ? placeholder = 'dd/MM/yyyyTHH:mm:ss' : null;
                template += '<input name="' + name + '" class="form-control" ng-model="' + model + '" ' + change + focus + blur + options + ' placeholder="' + placeholder + '" type="datetime-local"' + required + disabled + readonly + formFocus + '>';
                break;
            case 'text':
            default:
                template += '<input name="' + name + '" class="form-control" ng-model="' + model + '" ' + change + focus + blur + options + ' placeholder="' + placeholder + '" type="text"' + required + disabled + readonly + formFocus + validate + format + precision + '>';
                break;
        }
        return template + message + '</div></div>';
    }
    return {
        restrict: 'A',
        replace: true,
        compile: function(templateElement, templateAttributes) {
            return function(scope, element, attributes) {
                element.html(templateFunction(templateElement, templateAttributes));
                $compile(element.contents())(scope);
            }
        }
    }
}]);

app.directive('numberPicker', ['$parse', '$timeout', function($parse, $timeout) {
    return {
        restrict: 'A',
        template: '<div class="input-group">' +
            '   <span class="input-group-btn"><button class="btn btn-outline-primary" type="button">-</button></span>' +
            '   <div ng-transclude></div>' +
            '   <span class="input-group-btn"><button class="btn btn-outline-primary" type="button">+</button></span>' +
            '</div>',
        replace: true,
        transclude: true,
        link: function(scope, element, attributes, model) {
            var node = element[0];
            var nodeRemove = node.querySelectorAll('.input-group-btn > .btn')[0];
            var nodeAdd = node.querySelectorAll('.input-group-btn > .btn')[1];

            function onRemove(e) {
                var min = $parse(attributes.min)(scope);
                var getter = $parse(attributes.numberPicker);
                var setter = getter.assign;
                $timeout(function() {
                    setter(scope, Math.max(min, getter(scope) - 1));
                });
                // console.log('numberPicker.onRemove', min);
            }

            function onAdd(e) {
                var max = $parse(attributes.max)(scope);
                var getter = $parse(attributes.numberPicker);
                var setter = getter.assign;
                $timeout(function() {
                    setter(scope, Math.min(max, getter(scope) + 1));
                });
                // console.log('numberPicker.onAdd', max);
            }

            function addListeners() {
                angular.element(nodeRemove).on('touchstart mousedown', onRemove);
                angular.element(nodeAdd).on('touchstart mousedown', onAdd);
            }

            function removeListeners() {
                angular.element(nodeRemove).off('touchstart mousedown', onRemove);
                angular.element(nodeAdd).off('touchstart mousedown', onAdd);
            }
            scope.$on('$destroy', function() {
                removeListeners();
            });
            addListeners();
        }
    }
}]);

app.directive('validateType', ['$filter', function($filter) {
    return {
        require: 'ngModel',
        link: function(scope, element, attributes, model) {
            var validateType = attributes.validateType;
            var format = attributes.format || '';
            var precision = attributes.precision || 2;
            var focus = false;
            switch (validateType) {
                case 'date':
                case 'datetime':
                case 'datetime-local':
                    model.$formatters.push(function(value) {
                        if (value) {
                            return $filter('date')(value, format);
                        } else {
                            return null;
                        }
                    });
                    break;
                case 'number':
                    model.$parsers.unshift(function(value) {
                        var valid = false,
                            type = validateType;
                        if (value !== undefined && value !== "") {
                            valid = String(value).indexOf(Number(value).toString()) !== -1; // isFinite(value); // 
                            value = Number(value);
                            model.$setValidity('number', valid);
                            if (valid) {
                                model.$setValidity('positive', value >= 0.01);
                                attributes.min !== undefined ? model.$setValidity('range', value >= Number(attributes.min)) : null;
                                attributes.max !== undefined ? model.$setValidity('range', value <= Number(attributes.max)) : null;
                            }
                            /*                             
                            if (valid) {
                                if (value < 0.01) {
                                    valid = false;
                                    type = 'positive';
                                }
                                if (valid && attributes.min !== undefined) {
                                    valid = valid && value >= Number(attributes.min);
                                    if (!valid) {
                                        type = 'range';
                                    }
                                }
                                if (valid && attributes.max !== undefined) {
                                    valid = valid && value <= Number(attributes.max);
                                    if (!valid) {
                                        type = 'range';
                                    }
                                }
                            }
                            */
                            // console.log('validateType.number', type, valid, value);
                        } else {
                            valid = true;
                            value = Number(value);
                            model.$setValidity('number', true);
                            model.$setValidity('positive', true);
                            attributes.min !== undefined ? model.$setValidity('range', true) : null;
                            attributes.max !== undefined ? model.$setValidity('range', true) : null;
                        }
                        return value;
                    });
                    model.$formatters.push(function(value) {
                        if (value) {
                            return $filter('number')(value, precision) + ' ' + format;
                        } else {
                            return null;
                        }
                    });
                    /*
                    model.$render = function () {
                        console.log('model.render', model.$modelValue);
                        element[0].value = model.$modelValue ? $filter('number')(model.$modelValue, precision) + ' ' + format : ' ';
                    };
                    */
                    break;
                case 'anynumber':
                    model.$parsers.unshift(function(value) {
                        var valid = false,
                            type = validateType;
                        if (value !== undefined && value !== "") {
                            valid = String(value).indexOf(Number(value).toString()) !== -1; // isFinite(value); // 
                            value = Number(value);
                            model.$setValidity('number', valid);
                            if (valid) {
                                attributes.min !== undefined ? model.$setValidity('range', value >= Number(attributes.min)) : null;
                                attributes.max !== undefined ? model.$setValidity('range', value <= Number(attributes.max)) : null;
                            }
                        } else {
                            valid = true;
                            value = Number(value);
                            model.$setValidity('number', true);
                            attributes.min !== undefined ? model.$setValidity('range', true) : null;
                            attributes.max !== undefined ? model.$setValidity('range', true) : null;
                        }
                        return value;
                    });
                    model.$formatters.push(function(value) {
                        if (value || value === 0) {
                            return $filter('number')(value, precision) + ' ' + format;
                        } else {
                            return null;
                        }
                    });
                    break;
            }

            function onFocus() {
                focus = true;
                if (format) {
                    element[0].value = model.$modelValue || null;
                    if (!model.$modelValue) {
                        model.$setViewValue(null);
                    }
                }
            }

            function doBlur() {
                if (format && !model.$invalid) {
                    switch (validateType) {
                        case 'date':
                        case 'datetime':
                        case 'datetime-local':
                            element[0].value = model.$modelValue ? $filter('date')(model.$modelValue, format) : ' ';
                            break;
                        default:
                            element[0].value = model.$modelValue ? $filter('number')(model.$modelValue, precision) + ' ' + format : ' ';
                            break;
                    }
                }
            }

            function onBlur() {
                focus = false;
                doBlur();
            }

            function addListeners() {
                element.on('focus', onFocus);
                element.on('blur', onBlur);
            }

            function removeListeners() {
                element.off('focus', onFocus);
                element.off('blur', onBlur);
            }
            scope.$on('$destroy', function() {
                removeListeners();
            });
            addListeners();
        }
    };
}]);
/* global angular, app, Autolinker */

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
/* global angular, app */

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