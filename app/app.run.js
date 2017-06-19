/* global angular */

(function () {
    "use strict";

    var app = angular.module('app');

    app.run(['$rootScope', '$route', '$routeParams', '$window', '$document', '$q', '$timeout', function ($rootScope, $route, $routeParams, $window, $document, $q, $timeout) {

        $rootScope.standalone = $window.navigator.standalone;

        $rootScope.$on('$routeChangeSuccess', function () {
            var title = $route.current.title;
            angular.forEach($routeParams, function (value, key) {
                title = title.replace(new RegExp(':' + key, 'g'), value);
            });
            $document.title = title || '';
        });

        $rootScope.log = function () {
            if ($window.console && $window.console.info) {
                $window.console.info.apply($window.console, arguments);
            }
        };

        // MODALS
        $rootScope.modals = [];

        function closeModal(modal) {
            var index = -1;
            angular.forEach($rootScope.modals, function (m, i) {
                if (m === modal) {
                    index = i;
                }
            });
            if (index !== -1) {
                modal.active = false;
                $timeout(function () {
                    $rootScope.modals.splice(index, 1);
                }, 500);
            }
        }

        $rootScope.addModal = function (modalType, title, params) {
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
            modal.resolve = function (data) {
                closeModal(this);
                modal.deferred.resolve(data, modal);
            };
            modal.reject = function () {
                closeModal(this);
                modal.deferred.reject(modal);
            };
            $rootScope.modals.push(modal);
            angular.forEach($rootScope.modals, function (m, i) {
                m.active = false;
            });
            $timeout(function () {
                modal.active = true;
                $window.scrollTo(0, 0);
            }, 500);
            return deferred.promise;
        };

    }]);

}());