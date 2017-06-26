/* global angular */

(function () {
    "use strict";

    var app = angular.module('app');

    app.factory('Vector', function () {
        function Vector(x, y) {
            this.x = x || 0;
            this.y = y || 0;
        }
        Vector.make = function (a, b) {
            return new Vector(b.x - a.x, b.y - a.y);
        };
        Vector.size = function (a) {
            return Math.sqrt(a.x * a.x + a.y * a.y);
        };
        Vector.normalize = function (a) {
            var l = Vector.size(a);
            a.x /= l;
            a.y /= l;
            return a;
        };
        Vector.incidence = function (a, b) {
            var angle = Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x);
            // if (angle < 0) angle += 2 * Math.PI;
            // angle = Math.min(angle, (Math.PI * 2 - angle));
            return angle;
        };
        Vector.distance = function (a, b) {
            return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
        };
        Vector.cross = function (a, b) {
            return (a.x * b.y) - (a.y * b.x);
        };
        Vector.difference = function (a, b) {
            return new Vector(a.x - b.x, a.y - b.y);
        };
        Vector.power = function (a, b) {
            var x = Math.abs(b.x - a.x);
            var y = Math.abs(b.y - a.y);
            return (x + y) / 2;
        };
        Vector.prototype = {
            size: function () {
                return Vector.size(this);
            },
            normalize: function () {
                return Vector.normalize(this);
            },
            incidence: function (b) {
                return Vector.incidence(this, b);
            },
            cross: function (b) {
                return Vector.cross(this, b);
            },
            distance: function (b) {
                return Vector.distance(this, b);
            },
            difference: function (b) {
                return Vector.difference(this, b);
            },
            power: function () {
                return (Math.abs(this.x) + Math.abs(this.y)) / 2;
            },
            towards: function (b, friction) {
                friction = friction || 0.125;
                this.x += (b.x - this.x) * friction;
                this.y += (b.y - this.y) * friction;
                return this;
            },
            add: function (b) {
                this.x += b.x;
                this.y += b.y;
                return this;
            },
            friction: function (b) {
                this.x *= b;
                this.y *= b;
                return this;
            },
            copy: function (b) {
                return new Vector(this.x, this.y);
            },
            toString: function () {
                return '{' + this.x + ',' + this.y + '}';
            },
        };
        return Vector;
    });

    app.service('UI', ['Vector', function (Vector) {
        var service = this;
        service.getTouch = getTouch;
        service.getRelativeTouch = getRelativeTouch;
        service.getClosest = getClosest;
        service.getClosestElement = getClosestElement;
        return service;

        function getTouch(e, previous) {
            var point = new Vector();
            if (e.type === 'touchstart' || e.type === 'touchmove' || e.type === 'touchend' || e.type === 'touchcancel') {
                var touch = null;
                var event = e.originalEvent ? e.originalEvent : e;
                var touches = event.touches.length ? event.touches : event.changedTouches;
                if (touches && touches.length) {
                    touch = touches[0];
                }
                if (touch) {
                    point.x = touch.pageX;
                    point.y = touch.pageY;
                }
            } else if (e.type === 'click' || e.type === 'mousedown' || e.type === 'mouseup' || e.type === 'mousemove' || e.type === 'mouseover' || e.type === 'mouseout' || e.type === 'mouseenter' || e.type === 'mouseleave' || e.type === 'contextmenu') {
                point.x = e.pageX;
                point.y = e.pageY;
            }
            if (previous) {
                point.s = Vector.difference(t, previous);
            }
            point.type = e.type;
            return point;
        }

        function getRelativeTouch(node, point) {
            node = angular.isArray(node) ? node[0] : node;
            return Vector.difference(point, {
                x: node.offsetLeft,
                y: node.offsetTop
            });
            /*
            var element = angular.element(node);
            node = element[0];
            var rect = node.getBoundingClientRect();
            var topLeft = new Vector(rect.left, rect.top);
            return Vector.difference(point, topLeft);
            */

        }

        function getClosest(node, selector) {
            var matchesFn, parent;
            ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(function (fn) {
                if (typeof document.body[fn] == 'function') {
                    matchesFn = fn;
                    return true;
                }
                return false;
            });
            if (node[matchesFn](selector)) {
                return node;
            }
            while (node !== null) {
                parent = node.parentElement;
                if (parent !== null && parent[matchesFn](selector)) {
                    return parent;
                }
                node = parent;
            }
            return null;
        }

        function getClosestElement(node, target) {
            var matchesFn, parent;
            if (node === target) {
                return node;
            }
            while (node !== null) {
                parent = node.parentElement;
                if (parent !== null && parent === target) {
                    return parent;
                }
                node = parent;
            }
            return null;
        }

    }]);

}());

(function() {
  "use strict";

  var app = angular.module('app');

  app.factory('Events', [function() {
      
    function Event(e, element) {
      var documentNode = (document.documentElement || document.body.parentNode || document.body);
      var scroll = {
        x: window.pageXOffset || documentNode.scrollLeft,
        y: window.pageYOffset || documentNode.scrollTop
      };
      if (e.type === 'resize') {
        var view = {
          w: this.getWidth(),
          h: this.getHeight(),
        }
        this.view = view;
      }
      var node = getNode(element);
      var offset = {
        x: node.offsetLeft,
        y: node.offsetTop,
      };
      var rect = node.getBoundingClientRect();
      var page = this.getPage(e);
      if (page) {
        var relative = {
          x: page.x - scroll.x - rect.left,
          y: page.y - scroll.y - rect.top,
        };
        var absolute = {
          x: page.x - scroll.x,
          y: page.y - scroll.y,
        };
        this.relative = relative;
        this.absolute = absolute;
      }
      if (this.type === 'resize') {
        console.log(this.type);
      }
      this.originalEvent = e;
      this.element = element;
      this.node = node;
      this.offset = offset;
      this.rect = rect;
      // console.log('Event', 'page', page, 'scroll', scroll, 'offset', offset, 'rect', rect, 'relative', relative, 'absolute', absolute);
      // console.log('scroll.y', scroll.y, 'page.y', page.y, 'offset.y', offset.y, 'rect.top', rect.top);
    }
    Event.prototype = {
      getPage: getPage,
      getWidth: getWidth,
      getHeight: getHeight,
    };

    function getWidth() {
      if (self.innerWidth) {
        return self.innerWidth;
      }
      if (document.documentElement && document.documentElement.clientWidth) {
        return document.documentElement.clientWidth;
      }
      if (document.body) {
        return document.body.clientWidth;
      }
    }

    function getHeight() {
      if (self.innerHeight) {
        return self.innerHeight;
      }
      if (document.documentElement && document.documentElement.clientHeight) {
        return document.documentElement.clientHeight;
      }
      if (document.body) {
        return document.body.clientHeight;
      }
    }

    function getPage(e) {
      var standardEvents = ['click', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'contextmenu'];
      var touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
      var page = null;
      if (touchEvents.indexOf(e.type) !== -1) {
        var t = null;
        var event = e.originalEvent ? e.originalEvent : e;
        var touches = event.touches.length ? event.touches : event.changedTouches;
        if (touches && touches.length) {
          t = touches[0];
        }
        if (t) {
          page = {
            x: t.pageX,
            y: t.pageY,
          };
        }
      } else if (standardEvents.indexOf(e.type) !== -1) {
        page = {
          x: e.pageX,
          y: e.pageY,
        };
      }
      this.type = e.type;
      return page;
    }

    function Events(element) {
      this.element = element;
      this.listeners = {};
      this.standardEvents = {
        click: {
          key: 'click',
          callback: onClick
        },
        down: {
          key: 'mousedown',
          callback: onMouseDown
        },
        move: {
          key: 'mousemove',
          callback: onMouseMove
        },
        up: {
          key: 'mouseup',
          callback: onMouseUp
        },
        resize: {
          key: 'resize',
          callback: onResize
        },
      };
      this.touchEvents = {
        down: {
          key: 'touchstart',
          callback: onTouchStart
        },
        move: {
          key: 'touchmove',
          callback: onTouchMove
        },
        up: {
          key: 'touchend',
          callback: onTouchEnd
        },
      };

      var scope = this;

      function onClick(e) {
        // console.log('onClick', e, scope);
        var event = new Event(e, scope.element);
        scope.listeners.click.apply(this, [event]);
      }

      function onMouseDown(e) {
        // console.log('onMouseDown', e);
        var event = new Event(e, scope.element);
        scope.listeners.down.apply(this, [event]);
        scope.removeTouchEvents();
      }

      function onMouseMove(e) {
        // console.log('onMouseMove', e);
        var event = new Event(e, scope.element);
        scope.listeners.move.apply(this, [event]);
      }

      function onMouseUp(e) {
        // console.log('onMouseUp', e);
        var event = new Event(e, scope.element);
        scope.listeners.up.apply(this, [event]);
      }

      function onResize(e) {
        console.log('onResize', e);
        var event = new Event(e, scope.element);
        scope.listeners.resize.apply(this, [event]);
      }

      function onTouchStart(e) {
        // console.log('onTouchStart', e);
        var event = new Event(e, scope.element);
        scope.listeners.down.apply(this, [event]);
        scope.removeStandardEvents();
      }

      function onTouchMove(e) {
        // console.log('onTouchMove', e);
        var event = new Event(e, scope.element);
        scope.listeners.move.apply(this, [event]);
      }

      function onTouchEnd(e) {
        // console.log('onTouchEnd', e);
        var event = new Event(e, scope.element);
        scope.listeners.up.apply(this, [event]);
      }
    }
    Events.prototype = {
      add: onAdd,
      remove: onRemove,
      removeStandardEvents: removeStandardEvents,
      removeTouchEvents: removeTouchEvents,
    };
    return Events;

    function getNode(element) {
      return element.length ? element[0] : element; // (element.length && (element[0] instanceOf Node || element[0] instanceOf HTMLElement)) ? element[0] : element;
    }

    function getElement(element) {
      return element.length ? element : angular.element(element); // (element.length && (element[0] instanceOf Node || element[0] instanceOf HTMLElement)) ? element : angular.element(element);
    }

    function onAdd(listeners) {
      var scope = this,
        standard = this.standardEvents,
        touch = this.touchEvents;
      var element = getElement(this.element),
        windowElement = angular.element(window);

      angular.forEach(listeners, function(callback, key) {
        if (scope.listeners[key]) {
          var listener = {};
          listener[key] = scope.listeners[key];
          onRemove(listener);
        }
        scope.listeners[key] = callback;
        if (standard[key]) {
          if (key === 'resize') {
            windowElement.on(standard[key].key, standard[key].callback);
          } else {
            element.on(standard[key].key, standard[key].callback);
          }
        }
        if (touch[key]) {
          element.on(touch[key].key, touch[key].callback);
        }
      });
      return scope;
    }

    function onRemove(listeners) {
      var scope = this,
        standard = this.standardEvents,
        touch = this.touchEvents;
      var element = getElement(this.element),
        windowElement = angular.element(window);
      angular.forEach(listeners, function(callback, key) {
        if (standard[key]) {
          if (key === 'resize') {
            windowElement.off(standard[key].key, standard[key].callback);
          } else {
            element.off(standard[key].key, standard[key].callback);
          }
        }
        if (touch[key]) {
          element.off(touch[key].key, touch[key].callback);
        }
        scope.listeners[key] = null;
      });
      return scope;
    }

    function removeStandardEvents() {
      var scope = this,
        standard = scope.standardEvents,
        touch = scope.touchEvents;
      var element = getElement(scope.element);
      element.off('mousedown', standard.down.callback);
      element.off('mousemove', standard.move.callback);
      element.off('mouseup', standard.up.callback);
    }

    function removeTouchEvents() {
      var scope = this,
        standard = scope.standardEvents,
        touch = scope.touchEvents;
      var element = getElement(scope.element);
      element.off('touchstart', touch.down.callback);
      element.off('touchmove', touch.move.callback);
      element.off('touchend', touch.up.callback);
    }

  }]);

}());