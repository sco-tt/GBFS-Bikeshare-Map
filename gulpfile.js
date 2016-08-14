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
var imagemin = require('gulp-imagemin');


// include plug-ins
var jshint = require('gulp-jshint');


// JS Sub tasks
gulp.task('_jshint', function() {
  gulp.src('./src/js/app.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('_browserify', function() {
    return browserify('./src/js/app.js')
        .bundle()
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('app.js'))
        // Start piping stream to tasks!
        .pipe(gulp.dest('./build/assets/js'));
});

gulp.task('_leaflet-images', function(){
  return gulp.src('node_modules/leaflet/dist/images/*.+(png|jpg|gif|svg)')
  .pipe(imagemin())
  .pipe(gulp.dest('./build/assets/img/leaflet'))
});

// JS tasks
gulp.task('js',['_jshint','_browserify'], function () {
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
    .pipe(gulp.dest('./build/assets/css'))
    .pipe(browserSync.stream());
});

// HTML TAsk
gulp.task('html', function() {
  return gulp.src('./src/*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('./build'));
    browserSync.reload;
});


// Serve 
gulp.task('serve', ['sass'], function() {
    browserSync.init({
        server: "./build"
    });
    gulp.watch('./src/sass/**/*.scss', ['sass']);
    gulp.watch('./src/*.html', ['html']).on('change', browserSync.reload);
});


