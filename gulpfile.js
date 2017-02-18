/// <binding BeforeBuild="" Clean="" ProjectOpened="" />

var configFile = "./gulpconfig.json"; //file to read in settings from
var configData = {}; //persisted config reference
require('es6-promise').polyfill(); // fix undefined Promise class - used for autoprefixer

// Packages
var gulp = require('gulp'),
    sass = require("gulp-sass"), // sass compiler
    concat = require("gulp-concat"), // combines files from sources
    rename = require('gulp-rename'), // renames file
    inject = require('gulp-inject-string'), // wraps file for mediaqueries
    cssmin = require("gulp-cssmin"), // min css
    uglify = require("gulp-uglify"), // min js
    replace = require('gulp-replace-task'), // replaces package manager variables
    sourcemaps = require("gulp-sourcemaps"), // build source maps
    autoprefixer = require("gulp-autoprefixer"), // add vendor prefixes
    fs = require("fs"), // read files
    mergeStream = require('merge-stream'), // for building gulp tasks in a loop
    del = require('del'), // cleanup files
    stripJsonComments = require('strip-json-comments') // removes comments from json
    ;

// sets configData from parsing configFile
function readConfigData() {
    var file = fs.readFileSync(configFile, { encoding: 'utf-8' });
    configData = JSON.parse(stripJsonComments(file).replace(/\s+/g, " "));

    // init empty properties
    configData.bundles = configData.bundles || [];
    configData.directories = configData.directories || {};
    configData.directories.assets = configData.directories.assets || [];
    configData.directories.cleanCss = configData.directories.cleanCss || [];
    configData.directories.cleanJs = configData.directories.cleanJs || [];
    configData.directories.watch = configData.directories.watch || [];
    configData.sass = configData.sass || {};
    configData.sass.main = configData.sass.main || "";
    configData.sass.filename = configData.sass.filename || "null.css";
    configData.sass.includePaths = configData.sass.includePaths || [];
    configData.packageManager = configData.packageManager || {};
    configData.packageManager.variables = configData.packageManager.variables || {};
    configData.packageManager.cssBundles = configData.packageManager.cssBundles || [];

    return configData;
}

// returns configData if not empty, otherwise reads configFile then returns
function getConfigData() {
    if (Object.keys(configData).length === 0) {
        readConfigData();
    }

    return configData;
}

// common gulp task for building JS bundle
function buildGulpJs(bundle, config) {
    var variables = bundle.enableVariables == true ? config.packageManager.variables : {};

    return gulp.src(bundle.resources)
        .pipe(concat(bundle.filename))
        .pipe(replace({ prefix: "", patterns: [{ json: variables }] }))
        .pipe(gulp.dest(bundle.outputDirectory || config.directories.release))
        .pipe(rename({ suffix: ".min" }))
        .pipe(uglify())
        .pipe(gulp.dest(bundle.outputDirectory || config.directories.release));
}

// common gulp task for building CSS bundle
function buildGulpCss(bundle, config) {
    var variables = bundle.enableVariables == true ? config.packageManager.variables : {};

    return gulp.src(bundle.resources)
        .pipe(concat(bundle.filename))
        .pipe(replace({ prefix: "", patterns: [{ json: variables }] }))
        .pipe(gulp.dest(bundle.outputDirectory || config.directories.release))
        .pipe(rename({ suffix: ".min" }))
        .pipe(cssmin())
        .pipe(gulp.dest(bundle.outputDirectory || config.directories.release));
}

// common cleanup
function clean(pathsToClean) {
    console.log("Cleaning: ", pathsToClean);

    return del(pathsToClean);
}

// main build task
gulp.task('default', ['build:js', 'build:css', 'copy:assets']);

// main css task
gulp.task('build:css', ['clean:css', 'compile:sass'], function () {
    var config = getConfigData();
    var bundles = config.bundles;
    var tasks = [];

    bundles.forEach(function (bundle) {
        if (bundle.filename.indexOf(".css") > -1) {
            tasks.push(buildGulpCss(bundle, config));
        }
    });

    return mergeStream(tasks);
});

// main js task
gulp.task('build:js', ['clean:js'], function () {
    var config = getConfigData();
    var bundles = config.bundles;
    var tasks = [];

    bundles.forEach(function (bundle) {
        if (bundle.filename.indexOf(".js") > -1) {
            tasks.push(buildGulpJs(bundle, config));
        }
    });

    return mergeStream(tasks);
});

// compiles sass
gulp.task("compile:sass", function () {
    var config = getConfigData();
    var sassConfig = config.sass;
    var variables = sassConfig.enableVariables == true ? config.packageManager.variables : {};

    return gulp.src(sassConfig.main)
        .pipe(replace({ prefix: "", patterns: [{ json: variables }] }))
        .pipe(sourcemaps.init())
        .pipe(sass({ includePaths: sassConfig.includePaths, errorLogToConsole: true }))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write())
        .pipe(rename(sassConfig.filename))
        .pipe(gulp.dest(sassConfig.outputDirectory || config.directories.temp));
});

// copy files
gulp.task('copy:assets', ['clean:assets'], function () {
    var config = getConfigData();
    var assets = config.directories.assets;
    var tasks = [];

    assets.forEach(function (asset) {
        tasks.push(
            gulp.src(asset.src)
                .pipe(gulp.dest(asset.dest))
        );
    });

    // add empty tasks for flow
    if (tasks.length == 0) {
        tasks.push(gulp.src(''));
    }

    return mergeStream(tasks);
});

// delete copied assets
gulp.task('clean:assets', function () {
    var assets = getConfigData().directories.assets;
    var pathsToClean = [];

    assets.forEach(function (asset) {
        pathsToClean.push(asset.dest);
    });

    return clean(pathsToClean);
});

// deletes cleanCss directories
gulp.task('clean:css', function () {
    return clean(getConfigData().directories.cleanCss);
});

// delete cleanJs directories
gulp.task('clean:js', function () {
    return clean(getConfigData().directories.cleanJs);
});

// reloads configData
gulp.task('init:config', function () {
    readConfigData();
});

// watch for changes to specified files
gulp.task("watch", function () {
    var config = getConfigData();

    // sass
    var sassWatch = config.sass.includePaths.slice(0);

    for (var i = 0; i < sassWatch.length; i++) {
        if (sassWatch[i].slice(-1) == '/') {
            sassWatch[i] += "*";
        }
    }

    sassWatch.push(config.sass.main);
    gulp.watch(sassWatch, ["build:css"]);

    // config
    gulp.watch(configFile, ["init:config", "default"]);

    // custom
    var customWatches = config.directories.watch || [];

    for (var i = 0; i < customWatches.length; i++) {
        gulp.watch(customWatches[i].src, customWatches[i].tasks || ["default"]);
    }
});