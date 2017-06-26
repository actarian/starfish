/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('beach', ['$http', '$timeout', 'Painter', 'Palette', 'Rect', 'Events', 'Hash', 'UI', function($http, $timeout, Painter, Palette, Rect, Events, Hash, ui) {
        return {
            restrict: 'A',
            link: link,
        }

        function link(scope, element, attributes, model) {
            var over, overItem, down, mode, mouse = { x: 0, y: 0 },
                view = { w: 0, h: 0 },
                cell = { w: 40, h: 40, w2: 20, h2: 20 };

            var beach = scope.beach;
            var controls = scope.controls;
            var items = beach.items;

            var painter = new Painter(element[0]);
            var palette = new Palette();

            // document.body.appendChild(palette.painter.canvas);

            /*
            palette.add('arrow', 8, 4, function(p, rect) {
                p.setFill(p.colors.black);
                p.begin();
                p.ctx.moveTo(0, 0);
                p.ctx.lineTo(rect.w, 0);
                p.ctx.lineTo(rect.w / 2, rect.h);
                p.close();
                p.fill();
            });
            */

            palette.add('bg', cell.w, cell.h, function(p, rect) {
                p.setFill(p.colors.greyLight);
                p.ctx.beginPath();
                p.ctx.arc(rect.center().x, rect.center().y, 5, 0, 2 * Math.PI, false);
                p.ctx.fill();
                // p.ctx.fillRect(rect.w - 1, 0, 1, rect.h);
                // p.ctx.fillRect(0, rect.h - 1, rect.w, 1);
            });

            function drawOver(x, y) {
                var r = 6;
                var p = painter;
                if (overItem) {
                    p.setFill(p.colors.white);
                } else {
                    p.setFill(p.colors.grey);
                }
                p.ctx.beginPath();
                p.ctx.arc(x, y, r, 0, 2 * Math.PI, false);
                // p.ctx.closePath();
                p.ctx.fill();
            }

            function drawPolygon(x, y) {
                var r = cell.w * .4;
                var sides = 7;
                var p = painter;
                p.ctx.beginPath();
                p.ctx.moveTo(x + r * Math.cos(0), y + r * Math.sin(0));
                for (var i = 1; i <= sides; i++) {
                    p.ctx.lineTo(x + r * Math.cos(i * 2 * Math.PI / sides), y + r * Math.sin(i * 2 * Math.PI / sides));
                }
                // p.ctx.closePath();
                p.ctx.fill();
            }

            function drawUmbrellaShadow(x, y) {
                var pow = {
                    x: (x - mouse.x) / view.w,
                    y: (y - mouse.y) / view.h,
                }
                x += cell.w * pow.x * .75;
                y += cell.h * pow.y * .75;
                var p = painter;
                p.setFill(p.colors.greyLight);
                drawPolygon(x, y);
            }

            function drawUmbrella(x, y) {
                var p = painter;
                p.setFill(p.colors.blue);
                drawPolygon(x, y);
            }

            function draw() {
                var p = painter;
                p.clear();

                /*
                p.setFill(p.colors.gray);
                p.fillRect(rect);
                */

                // p.setStroke(p.colors.blue.alpha(1), 1);

                /*
                var rect = new Rect(0, 0, 100, 100);
                p.strokeRect(rect);
                p.setFill(p.colors.blue);
                p.ctx.fillRect(rect.x, rect.y - 15, rect.w, 15);
                p.setText('11px monospace');
                p.setFill(p.colors.blue.foreground);
                p.fillText('pippo', { x: rect.center().x, y: rect.y - 7 }, rect.w);
                */

                palette.pattern(p, 'bg', 0, 0, p.rect.w, p.rect.h);
                // console.log(p.rect); 

                angular.forEach(items, function(item) {
                    drawUmbrellaShadow(item.x * cell.w + cell.w2, item.y * cell.h + cell.h2);
                });

                angular.forEach(items, function(item) {
                    drawUmbrella(item.x * cell.w + cell.w2, item.y * cell.h + cell.h2);
                });

                if (over) {
                    // drawUmbrella(over.x * cell.w + cell.w2, over.y * cell.h + cell.h2);
                    drawOver(over.x * cell.w + cell.w2, over.y * cell.h + cell.h2);
                }

            }

            function addItem(xy) {
                items.push({
                    x: xy.x,
                    y: xy.y,
                });
            }

            function getItemIndex(xy) {
                var index = -1;
                var i = 0,
                    t = items.length,
                    item;
                while (i < t) {
                    item = items[i];
                    if (item.x === xy.x && item.y === xy.y) {
                        index = i, i = t;
                    }
                    i++;
                }
                return index;
            }

            function removeItemIndex(index) {
                items.splice(index, 1);
            }

            function toggleItem(xy) {
                var index = getItemIndex(xy);
                if (index !== -1) {
                    removeItemIndex(index);
                } else {
                    addItem(xy);
                }
                return index;
            }

            function setOverItem() {
                overItem = null;
                angular.forEach(items, function(item) {
                    if (item.x === over.x && item.y === over.y) {
                        overItem = item;
                    }
                });
                draw();
            }

            function setGrid() {
                var cpool = {},
                    rpool = {},
                    cols = 0,
                    rows = 0;
                angular.forEach(items, function(item) {
                    if (!cpool[item.x]) {
                        cpool[item.x] = true;
                        cols++;
                    }
                    if (!rpool[item.y]) {
                        rpool[item.y] = true;
                        rows++;
                    }
                });
                beach.cols = cols;
                beach.rows = rows;
            }

            function updateScope() {
                $timeout(function() {
                    setGrid();
                });
            }

            function onDown(e) {
                /*
                var point = ui.getTouch(e);
                var relative = ui.getRelativeTouch(element, point);
                */
                var relative = e.relative;
                var xy = {
                    x: Math.floor(relative.x / cell.w),
                    y: Math.floor(relative.y / cell.h),
                };
                down = true;
                mode = toggleItem(xy);
                setOverItem();
                updateScope();
            }

            function onMove(e) {
                /*
                var point = ui.getTouch(e);
                var relative = ui.getRelativeTouch(element, point);
                */
                // console.log('relative', e.relative, 'absolute', e.absolute, 'offset', e.offset, 'rect', e.rect);
                var relative = e.relative;
                mouse = {
                    x: relative.x,
                    y: relative.y,
                };
                over = {
                    x: Math.floor(relative.x / cell.w),
                    y: Math.floor(relative.y / cell.h),
                };
                if (down) {
                    var index = getItemIndex(over);
                    if (mode === -1 && index === -1) {
                        addItem(over);
                    } else if (mode >= 0 && index !== -1) {
                        removeItemIndex(index);
                    }
                }
                setOverItem();
                /*
                mouse = {
                    x: (relative.x - (view.w / 2)) / view.w,
                    y: (relative.y - (view.h / 2)) / view.h,
                };
                */
            }

            function onUp(e) {
                if (down) {
                    down = false;
                    updateScope();
                }
            }

            function onResize(e) {
                var w = element[0].offsetWidth,
                    h = element[0].offsetHeight;
                view.w = w;
                view.h = h;
                draw();
            }

            controls.setCenter = function() {
                if (beach.rows && beach.cols) {
                    var cols = Math.floor(view.w / cell.w);
                    var rows = Math.floor(view.h / cell.h);
                    var cmin = Number.POSITIVE_INFINITY,
                        rmin = Number.POSITIVE_INFINITY;
                    angular.forEach(items, function(item) {
                        cmin = Math.min(cmin, item.x);
                        rmin = Math.min(rmin, item.y);
                    });
                    var sc = Math.max(0, Math.floor((cols - beach.cols) / 2) - 1);
                    var sr = Math.max(0, Math.floor((rows - beach.rows) / 2) - 1);
                    angular.forEach(items, function(item) {
                        item.x = sc + (item.x - cmin);
                        item.y = sr + (item.y - rmin);
                    });
                }
                console.log('setCenter', beach.rows, beach.cols);
                draw();
            };

            var listeners = {
                down: onDown,
                move: onMove,
                up: onUp,
                resize: onResize,
            };

            var events = new Events(element);
            events.add(listeners);

            scope.$on('$destroy', function() {
                events.remove(listeners);
            });

            onResize();
            $timeout(function() {
                draw();
            });

/*

            function addListeners() {
                element.on('mousedown', onDown);
                element.on('mousemove', onMove);
                element.on('mouseup', onUp);
                element.on('resize', onResize);
            }

            function removeListeners() {
                element.off('mousedown', onDown);
                element.off('mousemove', onMove);
                element.off('mouseup', onUp);
                element.off('resize', onResize);
            }
            scope.$on('$destroy', function() {
                removeListeners();
            });
*/

        }
    }]);

}());