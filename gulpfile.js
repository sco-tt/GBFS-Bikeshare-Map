// include gulp
var browserify = require('browserify');
var gulp = require('gulp');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var source = require('vinyl-source-stream');
var htmlmin = require('gulp-htmlmin');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var browserSync = require('browser-sync').create();


// include plug-ins
var jshint = require('gulp-jshint');


// Sub tasks
gulp.task('jshint', function() {
  gulp.src('./src/js/app.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('browserify', function() {
    return browserify('./src/js/app.js')
        .bundle()
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('app.js'))
        // Start piping stream to tasks!
        .pipe(gulp.dest('./build/assets/js'));
});

// JS tasks
gulp.task('js',['jshint','browserify'], function () {
   gulp.src('./build/assets/js/app.js')
      .pipe(uglify())
      .pipe(rename('app.min.js'))
      .pipe(gulp.dest('./build/assets/js'))
});

// CSS task

gulp.task('sass', function () {
  return gulp.src('./src/sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(cleanCSS())
    .pipe(gulp.dest('./build/assets/css'));
});

// HTML TAsk

gulp.task('html', function() {
  return gulp.src('./src/*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('./build'));
});


// Watch
gulp.task('serve', function() {
    gulp.watch('./src/js/*.js', ['js']);
    gulp.watch('./src/sass/**/*.scss', ['sass']);
});


