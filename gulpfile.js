var gulp = require('gulp');
var webpack = require('webpack');
var gulpWebpack = require('webpack-stream');
gulp.task('webpack', function() {
    return gulp.src('./apps/ticket/public/js/index.ts')
        .pipe(gulpWebpack(require('./webpack.config.js'), webpack))
        .pipe(gulp.dest('./apps/ticket/public/js/'));
});