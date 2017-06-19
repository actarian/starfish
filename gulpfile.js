var gulp = require('gulp'),

    autoprefixer = require('gulp-autoprefixer'),
    coffee = require('gulp-coffee'),
    concat = require('gulp-concat'),
    cssmin = require('gulp-cssmin'),
    html2js = require('gulp-html2js'),
    livereload = require('gulp-livereload'),
    rename = require('gulp-rename'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    watch = require('gulp-watch'),
    webserver = require('gulp-webserver');

var folder = './';

gulp.task('docs:compile', function() {
    return gulp.src([
            './docs/sass/**/*.scss',
            '!/**/_*.scss',
        ], {
            base: '.'
        })
        .pipe(sass().on('docs:compile.error', function(error) {
            console.log('docs:compile:error', error);
        }))
        .pipe(rename('docs.css'))
        .pipe(gulp.dest('./docs/css')) // save .css
        .pipe(autoprefixer()) // autoprefixer
        .pipe(cssmin())
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(gulp.dest('./docs/css')); // save .min.css
});
gulp.task('docs:watch', function() {
    return gulp.watch('./docs/sass/**/*.scss', ['docs:compile'])
        .on('change', function(e) {
            console.log(e.type + ' watcher did change path ' + e.path);
        });
});
gulp.task('docs', ['docs:compile', 'docs:watch']);

var vendors = [
    './bower_components/angular/angular.js',
    './bower_components/angular-route/angular-route.js',
    './bower_components/angular-messages/angular-messages.js',
    './bower_components/angular-mapboxgl-directive/dist/angular-mapboxgl-directive.js',
    './bower_components/angularfire/dist/angularfire.js',
    './bower_components/json-formatter/dist/json-formatter.js',
];
gulp.task('js:vendors', function() {
    return gulp.src(vendors, {
            base: '.'
        })
        .pipe(rename({
            dirname: '', // flatten directory
        }))
        .pipe(concat('./docs/js/vendors.js')) // concat bundle
        .pipe(gulp.dest('.')) // save .js
        .pipe(sourcemaps.init())
        .pipe(uglify()) // { preserveComments: 'license' }
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(sourcemaps.write('.')) // save .map
        .pipe(gulp.dest('.')); // save .min.js
});
var app = [
    './app/app.js',
    './app/configs/configs.js',
    './app/controllers/controllers.js',
    './app/directives/directives.js',
    './app/filters/filters.js',
    './app/models/models.js',
    './app/services/services.js',
    './module/e.js',
];
gulp.task('js:app', function() {
    return gulp.src(app, {
            base: '.'
        })
        .pipe(rename({
            dirname: '', // flatten directory
        }))
        .pipe(concat('./docs/js/app.js')) // concat bundle
        .pipe(gulp.dest('.')) // save .js
        .pipe(sourcemaps.init())
        .pipe(uglify()) // { preserveComments: 'license' }
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(sourcemaps.write('.')) // save .map
        .pipe(gulp.dest('.')); // save .min.js
});
gulp.task('js:bundles', ['js:vendors', 'js:app'], function(done) {
    done();
});
gulp.task('js:watch', function() {
    return gulp.watch(app, ['js:app'])
        .on('change', function(e) {
            console.log(e.type + ' watcher did change path ' + e.path);
        });
});

var cssVendors = [
    './bower_components/json-formatter/dist/json-formatter.css',
    './bower_components/angular-mapboxgl-directive/dist/angular-mapboxgl-directive.css',
];
gulp.task('css:vendors', function() {
    return gulp.src(cssVendors, {
            base: '.'
        })
        .pipe(rename({
            dirname: '', // flatten directory
        }))
        .pipe(concat('./docs/css/vendors.css')) // concat bundle
        .pipe(gulp.dest('.')) // save .js
        .pipe(autoprefixer()) // autoprefixer
        .pipe(cssmin())
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(sourcemaps.write('.')) // save .map
        .pipe(gulp.dest('.')); // save .min.js
});
gulp.task('css:bundles', ['css:vendors'], function(done) {
    done();
});

gulp.task('sass:compile', function() {
    return gulp.src([
            './sass/**/*.scss',
            '!/**/_*.scss',
        ], {
            base: '.'
        })
        .pipe(sass().on('sass:compile.error', function(error) {
            console.log('sass:compile:error', error);
        }))
        .pipe(rename({ dirname: '' }))
        .pipe(gulp.dest('./docs/css')) // save .css
        .pipe(autoprefixer()) // autoprefixer
        .pipe(cssmin())
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(gulp.dest('./docs/css')); // save .min.css
});
gulp.task('sass:watch', function() {
    return gulp.watch('./sass/**/*.scss', ['sass:compile'])
        .on('change', function(e) {
            console.log(e.type + ' watcher did change path ' + e.path);
        });
});
gulp.task('sass', ['sass:compile', 'sass:watch']);

gulp.task('watch', ['sass:watch', 'js:watch'], function(done) {
    done();
});

gulp.task('webserver', function() {
    return gulp.src(folder)
        .pipe(webserver({
            livereload: true,
            directoryListing: true,
            port: 5555,
            open: 'http://localhost:5555/docs/index.html',
            fallback: 'docs/index.html'
        }));
});

gulp.task('compile', ['sass:compile', 'css:bundles', 'js:bundles'], function(done) {
    done();
});

gulp.task('default', ['compile', 'webserver', 'watch']);