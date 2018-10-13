define([

    'backbone',
    'formats',
    'projections',
    'views/maps/google-styles',
    'wicket-gmap3',
    'async!//maps.googleapis.com/maps/api/js?key=AIzaSyDg0pS7JeL2uo6IrPQ5FNV--GIrFp1M8CQ&language=en&region=GB&libraries=geometry,drawing'

], function(Backbone, Formats, Projections, GoogleMapStyles) {

    /**
     * Calculates the distance in metres between the given points.
     *
     * @param {google.maps.LatLng} p1
     * @param {google.maps.LatLng} p2
     */
    var distanceMetres = function (p1, p2) {
        return google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
    };

    /**
     * Amount of metres per pixel for a given zoom level on a given map latitude.
     *
     * @param {number} lat - latitude (WGS84)
     * @param {integer} zoom - Google Maps zoom level
     */
    var metresPerPixel = function (lat, zoom) {
        return (Math.cos(lat * Math.PI / 180) * 2 * Math.PI * 6378137) / (256 * Math.pow(2, zoom));
    };

    /**
     * Converts a given number of pixels to metres.
     *
     * @param {integer} pixels - number of pixels
     * @param {number} lat - latitude (WGS84)
     * @param {integer} zoom - Google Maps zoom level
     */
    var pixels2metres = function (pixels, lat, zoom) {
        return metresPerPixel(lat, zoom) * pixels;
    };

    /**
     * Calculates the zoom level needed to accomodate the given bounds taking the
     * pixel width and height into account.
     *
     * @param {google.maps.LatLngBounds} bounds
     * @param {integer} width - in pixels
     * @param {integer} height - in pixels
     */
    var zoomLevelForBounds = function (bounds, width, height) {

        var zoom = 1,
            sw = bounds.getSouthWest(),
            ne = bounds.getNorthEast(),
            widthMetres = distanceMetres(new google.maps.LatLng(sw.lat(), sw.lng()),
                new google.maps.LatLng(sw.lat(), ne.lng())),
            heightMetres = distanceMetres(new google.maps.LatLng(sw.lat(), sw.lng()),
                new google.maps.LatLng(ne.lat(), sw.lng())),
            center = bounds.getCenter();

        for (zoom = 21; zoom > 0; zoom--) {

            // Use the highest possible zoom level When it fully fits
            if (widthMetres < pixels2metres(width, center.lat(), zoom) &&
                heightMetres < pixels2metres(height, center.lat(), zoom)) {
                return zoom;
            }
        }

        // Weird: it didn't fit on any zoom level...
        return zoom + 1;
    };

    return Backbone.View.extend({

        initialize: function() {
            this.features = [];
            this.listenTo(this.model, 'change', this.plot);
        },

        clearMap: function() {
            _.each(this.features, function(f) {
                if (f) {
                    f.setMap(null);
                }
            });
            this.features = [];
        },

        /**
         * @param {array} bounds - Array of {lat: 0.0, lon: 0.0} objects.
         */
        fitBounds: function (bounds) {

            if (!bounds || bounds.length === 0) {
                return;
            }

            var centerLatLng,
                zoom = 14; // Default zoom level

            if (bounds.length === 1 || (bounds.length >= 2 &&
                bounds[0].lat === bounds[1].lat && bounds[0].lon === bounds[1].lon)) {

                // It's a single point: center map with default zoom level
                centerLatLng = new google.maps.LatLng(bounds[0].lat, bounds[0].lon);

            } else {

                // Some distinct coordinates really passed: compile them
                var googleBounds = new google.maps.LatLngBounds();
                _.each(bounds, function (lonLat) {
                    if (!_.isNumber(lonLat.lon) === 'undefined' ||
                        !_.isNumber(lonLat.lat) === 'undefined') {
                        return;
                    }
                    googleBounds.extend(new google.maps.LatLng(
                        lonLat.lat, lonLat.lon));
                });


                var $mapDiv = $(this.map.getDiv()),
                    width = $mapDiv.width(),
                    height = $mapDiv.height();

                // Find the maximum zoom level where the bounds fit within the
                // map dimensions (in pixels)
                zoom = zoomLevelForBounds(googleBounds, width, height);

                centerLatLng = googleBounds.getCenter();

            }

            var currBounds = this.map.getBounds();
            if (currBounds && currBounds.contains(centerLatLng)) {
                return;
            }

            this.map.setCenter(centerLatLng);
            if (_.isNumber(zoom)) {
                this.map.setZoom(zoom);
            }

        },

        plot: function() {

            this.clearMap();

            var wkt = this.model.buildWkt(Projections.WGS84);
            if (!wkt) {
                return;
            }

            var gFeature = wkt.toObject();
            if (_.isArray(gFeature)) {
                _.each(gFeature, function(gf) {
                    this.features.push(gf);
                    gf.setMap(this.map);
                }.bind(this));
            } else {
                this.features.push(gFeature);
                gFeature.setMap(this.map);

            }

            var bounds = _.map(_.flatMapDeep(wkt.components), function(a) {
                return {
                    lon: a.x,
                    lat: a.y
                };
            });

            this.fitBounds(bounds);

        },

        renderDrawing: function() {
            this.drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: google.maps.drawing.OverlayType.MARKER,
                drawingControl: true,
                drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: [
                        'marker',
                        // 'circle',
                        'polygon',
                        'polyline',
                        'rectangle']
                },
                markerOptions: {
                    icon: {
                        url: 'http://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2_hdpi.png',
                        size: new google.maps.Size(54, 86),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(13, 43),
                        scaledSize: new google.maps.Size(27, 43)
                    }
                },
                circleOptions: {
                    fillColor: '#ffff00',
                    fillOpacity: 1,
                    strokeWeight: 5,
                    clickable: false,
                    editable: true,
                    zIndex: 1
                }
            });
            this.drawingManager.setMap(this.map);

            google.maps.event.addListener(this.drawingManager, 'markercomplete', this.processMarker.bind(this));
            google.maps.event.addListener(this.drawingManager, 'polylinecomplete', this.processPolyline.bind(this));
            google.maps.event.addListener(this.drawingManager, 'polygoncomplete', this.processPolygon.bind(this));
            google.maps.event.addListener(this.drawingManager, 'rectanglecomplete', this.processRectangle.bind(this));
            // google.maps.event.addListener(this.drawingManager, 'circlecomplete', this.processPolygon.bind(this));

        },

        processRectangle: function(rectangle) {
            var bounds = rectangle.getBounds(),
                ne = bounds.getNorthEast(),
                sw = bounds.getSouthWest();

            this.processFeature(rectangle, [
                // top left corner
                sw.lng(),
                ne.lat(),
                // top right corner
                ne.lng(),
                ne.lat(),
                // bottom right corner
                ne.lng(),
                sw.lat(),
                // bottom left corner
                sw.lng(),
                sw.lat(),
                // top left corner (again, to close)
                sw.lng(),
                ne.lat(),
            ]);
        },

        processPolyline: function(polyline) {
            this.processPolygon(polyline, true);
        },

        processPolygon: function(polygon, skipClose) {
            var ords = _.reduce(polygon.getPath().getArray(), function(memo, vertex) {
                memo.push(vertex.lng());
                memo.push(vertex.lat());
                return memo;
            }, []);

            // Closing Polygon, since Google Maps API doesn't do it
            if (skipClose !== true) {
                ords.push(ords[0]);
                ords.push(ords[1]);
            }

            this.processFeature(polygon, ords);
        },

        processMarker: function(marker) {
            var position = marker.getPosition();
            this.processFeature(marker, [
                position.lng(),
                position.lat()
            ]);
        },

        processFeature: function(feature, ordinates) {
            this.features.push(feature);
            this.model.set({
                text: Formats.formatOrdinates(ordinates),
                format: Formats.DSV,
                projection: Projections.WGS84
            });
        },

        remove: function() {
            google.maps.event.removeListener(this.drawingManager, 'markercomplete');
            // TODO: kill google map
        },

        render: function() {
            this.map = new google.maps.Map(this.el, {
                center: {
                    lat: -34.397,
                    lng: 150.644
                },
                zoom: 8,
                styles: GoogleMapStyles,
                disableDefaultUI: true
            });

            this.renderDrawing();

            return this;
        }

    });

});
