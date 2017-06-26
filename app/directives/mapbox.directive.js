/* global angular */

(function() {
    "use strict";

    var app = angular.module('app');

    app.directive('mapbox', ['$http', '$timeout', function($http, $timeout) {
        if (!mapboxgl) {
            return;
        }
        mapboxgl.accessToken = 'pk.eyJ1IjoiYWN0YXJpYW4iLCJhIjoiY2lqNWU3MnBzMDAyZndnbTM1cjMyd2N2MiJ9.CbuEGSvOAfIYggQv854pRQ';

        var googleMapApiKey = 'AIzaSyAYuhIEO-41YT_GdYU6c1N7DyylT_OcMSY';
        var geocoder;

        return {
            restrict: 'E',
            link: link,
        };

        function link(scope, element, attributes, model) {

            var position = setPosition();
            var node = element[0];
            var map = new mapboxgl.Map({
                container: node,
                style: 'mapbox://styles/mapbox/streets-v9',
                interactive: true,
                logoPosition: 'bottom-right',
                center: [position.lng, position.lat],
                zoom: 9,
            });
            var canvas = map.getCanvasContainer();

            var isDragging;
            var isCursorOverPoint;

            var el = document.createElement('div');
            el.id = 'point';
            el.className = 'marker';
            var marker = new mapboxgl.Marker(el, { offset: [-10, -10] })
                .setLngLat([
                    position.lng,
                    position.lat
                ])
                .addTo(map);

            angular.element(el).on('mouseenter', function(e) {
                canvas.style.cursor = 'move';
                isCursorOverPoint = true;
                map.dragPan.disable();
            });

            angular.element(el).on('mouseleave', function(e) {
                // map.setPaintProperty('point', 'circle-color', '#3887be');
                canvas.style.cursor = '';
                isCursorOverPoint = false;
                map.dragPan.enable();
            });

            window.googleMapInit = function() {
                geocoder = new google.maps.Geocoder();
                console.log('googleMapInit');
                window.googleMapInit = null;
            };
            if (!geocoder) {
                var script = document.createElement('script');
                script.setAttribute('async', null);
                script.setAttribute('defer', null);
                script.setAttribute('src', 'https://maps.googleapis.com/maps/api/js?key=' + googleMapApiKey + '&callback=googleMapInit');
                document.body.appendChild(script);
            }

            function setPosition(lat, lng) {
                position = scope.model.position || {};
                if (lat && lng) {
                    position.lat = position.lat || 0;
                    position.lng = position.lng || 0;
                } else {
                    position.lat = position.lat || 0;
                    position.lng = position.lng || 0;
                    if (position.lat === 0 && position.lng === 0) {
                        geolocalize();
                    }
                }
                return position;
            }

            function handleResults(results) {
                console.log('handleResults', results);
                if (results.length) {
                    scope.map.results = results.filter(function(item) {
                        return item.geometry.location_type === 'ROOFTOP' ||
                            item.geometry.location_type === 'RANGE_INTERPOLATED' ||
                            item.geometry.location_type === 'GEOMETRIC_CENTER';
                    }).map(function(item) {
                        return {
                            name: item.formatted_address,
                            street: getType('street', item),
                            number: getType('number', item),
                            locality: getType('locality', item),
                            postalCode: getType('postalCode', item),
                            city: getType('city', item),
                            province: getType('province', item),
                            region: getType('region', item),
                            country: getType('country', item),
                            position: {
                                lng: item.geometry.location.lng(),
                                lat: item.geometry.location.lat(),
                            }
                        };
                    });
                    /*
                    var first = response.data.results[0];
                    scope.model.position = first.geometry.location;
                    console.log(scope.model);
                    setLocation();
                    */
                }

            }

            function geocodeAddress(address) {
                geocoder.geocode({ 'address': address }, function(results, status) {
                    $timeout(function() {
                        if (status === 'OK') {
                            handleResults(results);
                            // setLocation();
                        } else {
                            alert('Geocode was not successful for the following reason: ' + status);
                        }
                    });
                });
            }

            function reverseGeocode(position) {
                // console.log(position);
                geocoder.geocode({ 'location': position }, function(results, status) {
                    // console.log(results);
                    $timeout(function() {
                        if (status === 'OK') {
                            handleResults(results);
                            /*
                            if (results[1]) {
                                setLocation();
                                // address = results[1].formatted_address;
                            } else {
                                console.log('No results found');
                            }
                            */
                        } else {
                            console.log('Geocoder failed due to: ' + status);
                        }
                    });
                });
            }

            function geolocalize() {
                // Try HTML5 geolocation.
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(p) {
                        $timeout(function() {
                            position = setPosition(p.coords.latitude, p.coords.longitude);
                            setLocation();
                            reverseGeocode(position);
                        });
                    }, function(e) {
                        console.log('error', e);
                    });
                } else {
                    console.log('error', 'Browser doesn\'t support Geolocation');
                }
            }

            function setLocation() {
                /*
                map.setCenter([
                    parseFloat(lng),
                    parseFloat(lat)
                ]);
                */
                marker.setLngLat([position.lng, position.lat]);
                map.flyTo({
                    center: [
                        parseFloat(position.lng),
                        parseFloat(position.lat)
                    ],
                    zoom: 15,
                    speed: 1.5,
                    curve: 1,
                    /*
                    easing: function (t) {
                        return t;
                    }
                    */
                });
            }

            function getType(type, item) {
                var types = {
                    street: 'route',
                    number: 'street_number',
                    locality: 'locality',
                    postalCode: 'postal_code',
                    city: 'administrative_area_level_3',
                    province: 'administrative_area_level_2',
                    region: 'administrative_area_level_1',
                    country: 'country',
                };
                var label = null;
                angular.forEach(item.address_components, function(c) {
                    angular.forEach(c.types, function(t) {
                        if (t === types[type]) {
                            label = c.long_name;
                        }
                    });
                });
                // console.log(type, label);
                return label;
            }
            /*
            scope.$watch('model', function(model) {
                position = model.position;
                setLocation();
            });
            */

            /*
                        scope.$watch('map.address', function(address) {
                            if (!address) {
                                return;
                            }
                            scope.map.results = null;
                            scope.map.setAddress = function(item) {
                                console.log('setAddress', item);
                                angular.extend(scope.model, item);
                                scope.map.results = null;
                                setLocation();
                            };
                            geocodeAddress(address);
                        });
            */

            scope.map.setAddress = function(item) {
                console.log('setAddress', item);
                angular.extend(scope.model, item);
                scope.map.results = null;
                position = setPosition(item.position);
                setLocation();
            };

            scope.map.search = function() {
                scope.map.results = null;
                geocodeAddress(scope.map.address);
            };

            /*
            // When the cursor enters a feature in the point layer, prepare for dragging.
            map.on('mouseenter', 'point', function() {
                // map.setPaintProperty('point', 'circle-color', '#3bb2d0');
                canvas.style.cursor = 'move';
                isCursorOverPoint = true;
                map.dragPan.disable();
            });
            map.on('mouseleave', 'point', function() {
                // map.setPaintProperty('point', 'circle-color', '#3887be');
                canvas.style.cursor = '';
                isCursorOverPoint = false;
                map.dragPan.enable();
            });
            */
            map.on('mousedown', mouseDown);

            function mouseDown() {
                if (!isCursorOverPoint) return;
                isDragging = true;
                // Set a cursor indicator
                canvas.style.cursor = 'grab';
                // Mouse events
                map.on('mousemove', onMove);
                map.once('mouseup', onUp);
            }

            function onMove(e) {
                if (!isDragging) return;
                var p = e.lngLat;
                // Set a UI indicator for dragging.
                canvas.style.cursor = 'grabbing';
                // Update the Point feature in `geojson` coordinates
                // and call setData to the source layer `point` on it.
                marker.setLngLat([
                    p.lng,
                    p.lat
                ]);
                // geojson.features[0].geometry.coordinates = [p.lng, p.lat];
                // map.getSource('point').setData(geojson);
            }

            function onUp(e) {
                if (!isDragging) return;
                var p = e.lngLat;
                // Print the coordinates of where the point had
                // finished being dragged to on the map.
                // coordinates.style.display = 'block';
                // coordinates.innerHTML = 'Longitude: ' + p.lng + '<br />Latitude: ' + p.lat;
                reverseGeocode(p);
                canvas.style.cursor = '';
                isDragging = false;
                // Unbind mouse events
                map.off('mousemove', onMove);
            }

        }
    }]);

}());