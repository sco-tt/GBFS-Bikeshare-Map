// include gulp
var gulp = require('gulp'); 
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

// include plug-ins
var jshint = require('gulp-jshint');
var browserify = require('gulp-browserify');


// JS hint task
gulp.task('jshint', function() {
  gulp.src('./src/scripts/app.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('minify', function () {
   gulp.src('./src/scripts/app.js')
      .pipe(uglify())
      .pipe(gulp.dest('build'))
});

gulp.task('browserify-client', function() {
  return gulp.src('./src/script/app.js')
    .pipe(browserify({
      insertGlobals: true
    }))
    .pipe(rename('app-packed.js'))
    .pipe(gulp.dest('build'));
    //.pipe(gulp.dest('public/js'));
});