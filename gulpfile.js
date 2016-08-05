// include gulp
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

// include plug-ins
var jshint = require('gulp-jshint');


// JS hint task
gulp.task('jshint', function() {
  gulp.src('./src/scripts/app.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('browserify', function() {
    return browserify('./src/scripts/app.js')
        .bundle()
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('app.js'))
        // Start piping stream to tasks!
        .pipe(gulp.dest('./build/assets/js'));
});

gulp.task('minify',['jshint','browserify'], function () {
   gulp.src('./build/assets/js/app.js')
      .pipe(uglify())
      .pipe(rename('app.min.js'))
      .pipe(gulp.dest('./build/assets/js'))
});

