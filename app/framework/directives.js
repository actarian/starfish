/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

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
                            scope.options = $parse(attributes.options)(scope) || {};
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
                                // console.log('control.getType', type);
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
                }

                function addListeners() {
                    element.on('touchstart click', onClick);
                }

                function removeListeners() {
                    element.off('touchstart click', onClick);
                }
                scope.$on('$destroy', function() {
                    removeListeners();
                });
                addListeners();
            }
        };
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
                };
            }
        };
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
        };
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

}());