/* global angular */

(function () {
    "use strict";

    var app = angular.module('app');

    app.factory('Hash', [function () {
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
        Hash.get = function (pool) {
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
            hash.sort(function (c, d) {
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
            Object.keys(pool).forEach(function (key) {
                delete pool[key];
            });
            angular.forEach(hash, function (item) {
                pool[item[key]] = item;
            });
        }

    }]);    

}());