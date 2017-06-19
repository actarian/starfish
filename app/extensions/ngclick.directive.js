/* global angular */

(function () {
    "use strict";

    var app = angular.module('app');

    app.directive('ngClick', ['UI', function (ui) {
        return {
            restrict: 'A',
            priority: 0,
            link: link
        };
        function link(scope, element, attributes, model) {
            element.addClass('material');
            var material = document.createElement('material');
            element[0].appendChild(material);

            function doMaterial(e) {
                var down = ui.getTouch(e);
                var relative = ui.getRelativeTouch(element, down);
                element.removeClass('animate');
                void element.offsetWidth;
                // material.style.animationPlayState = "paused";
                material.style.left = relative.x + 'px';
                material.style.top = relative.y + 'px';
                setTimeout(function () {
                    element.addClass('animate');
                    setTimeout(function () {
                        element.removeClass('animate');
                    }, 1000);
                }, 1);
            }

            function onTouchStart(e) {
                element.off('mousedown', onMouseDown);
                doMaterial(e);
            }

            function onMouseDown(e) {
                element.off('touchstart', onTouchStart);
                doMaterial(e);
            }

            function addListeners() {
                element.on('touchstart', onTouchStart);
                element.on('mousedown', onMouseDown);
            }

            function removeListeners() {
                element.off('touchstart', onTouchStart);
                element.off('mousedown', onMouseDown);
            }

            scope.$on('$destroy', function () {
                removeListeners();
            });

            addListeners();
        }
    }]);

}());