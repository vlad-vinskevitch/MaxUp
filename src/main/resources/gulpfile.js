"use strict";

const {src, dest, watch, parallel, series} = require('gulp');

const sass = require('gulp-sass'),
      concat = require('gulp-concat'),
      browserSync = require('browser-sync').create(),
      webpack = require('webpack-stream'),
      uglify = require('gulp-uglify-es').default,
      autoprefixer = require('gulp-autoprefixer'),
      imagemin = require('gulp-imagemin'),
      del = require('del');

function browsersync() {
    browserSync.init({
        server : {
            baseDir: 'app/'
        }
    });
}

function cleanStatic() {
    return del('static')
}

function cleanTemp() {
    return del('templates')
}


function images() {
    return src('app/images/**/*')
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(dest('static/images'))
}

function buildJs() {
    return src([
        'node_modules/jquery/dist/jquery.js',
        './app/js/main.js'
    ])
        .pipe(webpack({
            mode: 'development',
            output: {
                filename: 'script.min.js'
            },
            watch: false,
            module: {
                rules: [{
                    test: /\.(jsx?)$/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                "@babel/preset-env"
                            ]
                        }
                    },
                }]
            }
        }))
        .pipe(uglify())
        .pipe(dest('app/js'))
        .pipe(browserSync.stream())
}

function styles() {
    return src('app/scss/style.scss')
        .pipe(sass({
            outputStyle: 'compressed',
        }))
        .pipe(concat('style.min.css'))
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 10 version'],
            grid: true
        }))
        .pipe(dest('app/css'))
        .pipe(browserSync.stream())
}

function build() {
    return src([
        'app/css/style.min.css',
        'app/fonts/**/*',
        'app/js/script.min.js',
    ], {base : 'app'})
       .pipe(dest('static'))
}

function buildHtml() {
    return src([
        'app/*.html',
    ], {base : 'app'})
       .pipe(dest('templates'))
}

function watching() {
    watch(['app/scss/**/*.scss'], styles);
    watch(['app/js/**/*.js','!app/js/script.min.js'], buildJs);
    watch(['app/*.html']).on('change', browserSync.reload);
}

exports.styles = styles;
exports.watching = watching;
exports.browsersync = browsersync;
exports.buildjs = buildJs;
exports.image = images;
exports.cleandist = cleanStatic;
exports.cleantemp = cleanTemp;
exports.buildhtml = buildHtml;

exports.build = series(cleanStatic, cleanTemp, images, build, buildHtml);
exports.default = parallel(styles, buildJs, browsersync, watching);