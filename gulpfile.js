/// <binding BeforeBuild="" Clean="" ProjectOpened="" />
// https://gist.github.com/jeromecoupe/0b807b0c1050647eb340360902c3203a

const { src, dest, series, parallel } = require('gulp');
const sass = require('gulp-sass');
const concat = require("gulp-concat");
const rename = require('gulp-rename');
const cssmin = require("gulp-cssmin");
const uglify = require("gulp-uglify");
const sourcemaps = require("gulp-sourcemaps");
const autoprefixer = require("gulp-autoprefixer");
const fs = require("fs");
const cp = require("child_process");
const mergeStream = require('merge-stream');
const del = require('del');
const stripJsonComments = require('strip-json-comments');

var configFile = "./gulpconfig.json";
var configData = {};

// sets configData from parsing configFile
function readConfigData() {
    var file = fs.readFileSync(configFile, { encoding: 'utf-8' });
    configData = JSON.parse(stripJsonComments(file).replace(/\s+/g, " "));
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
    return src(bundle.resources)
        .pipe(concat(bundle.filename))
        .pipe(dest(bundle.outputDirectory || config.directories.release))
        .pipe(rename({ suffix: ".min" }))
        .pipe(uglify())
        .pipe(dest(bundle.outputDirectory || config.directories.release));
}

// common gulp task for building CSS bundle
function buildGulpCss(bundle, config) {
    return src(bundle.resources)
        .pipe(concat(bundle.filename))
        .pipe(dest(bundle.outputDirectory || config.directories.release))
        .pipe(rename({ suffix: ".min" }))
        .pipe(cssmin())
        .pipe(dest(bundle.outputDirectory || config.directories.release));
}

// common cleanup
function clean(pathsToClean) {
    console.log("Cleaning: ", pathsToClean);

    return del(pathsToClean);
}

// main css task
function buildCss() {
    var config = getConfigData();
    var bundles = config.bundles;
    var tasks = [];

    bundles.forEach(function (bundle) {
        if (bundle.filename.indexOf(".css") > -1) {
            tasks.push(buildGulpCss(bundle, config));
        }
    });

    //return parallel(tasks);
    return mergeStream(tasks);
}

// main js task
function buildJs() {
    var config = getConfigData();
    var bundles = config.bundles;
    var tasks = [];

    bundles.forEach(function (bundle) {
        if (bundle.filename.indexOf(".js") > -1) {
            tasks.push(buildGulpJs(bundle, config));
        }
    });

    //return parallel(tasks);
    return mergeStream(tasks);
}

// compiles sass
function compileSass() {
    var config = getConfigData();
    var sassConfig = config.sass;

    return src(sassConfig.main)
        .pipe(sourcemaps.init())
        .pipe(sass({ includePaths: sassConfig.includePaths, errorLogToConsole: true }))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write())
        .pipe(rename(sassConfig.filename))
        .pipe(dest(sassConfig.outputDirectory || config.directories.temp));
}

// copy files
function copyAssets() {
    var config = getConfigData();
    var assets = config.directories.assets;
    var tasks = [];

    assets.forEach(function (asset) {
        tasks.push(
            src(asset.src)
                .pipe(dest(asset.dest))
        );
    });

    // add empty tasks for flow
    if (tasks.length === 0) {
        return new Promise(function (resolve) {
            console.log("No assets defined!");
            resolve();
        });
    }

    return mergeStream(tasks);
}

// delete copied assets
function cleanAssets() {
    var assets = getConfigData().directories.assets;
    var pathsToClean = [];

    assets.forEach(function (asset) {
        pathsToClean.push(asset.dest);
    });

    return clean(pathsToClean);
}

// deletes cleanCss directories
function cleanCss() {
    return clean(getConfigData().directories.cleanCss);
}

// delete cleanJs directories
function cleanJs() {
    return clean(getConfigData().directories.cleanJs);
}

// Jekyll
function jekyll() {
    return cp.spawn("bundle", ["exec", "jekyll", "build"], { stdio: "inherit" });
}

function jekyllServe() {
    return cp.spawn("bundle", ["exec", "jekyll", "serve", "--no-watch"], { stdio: "inherit" });
}

// watch for changes to specified files
function watchFiles() {
    var config = getConfigData();

    // sass
    var sassWatch = config.sass.includePaths.slice(0);

    for (var i = 0; i < sassWatch.length; i++) {
        if (sassWatch[i].slice(-1) === '/') {
            sassWatch[i] += "*";
        }
    }

    sassWatch.push(config.sass.main);
    //watch(sassWatch, ["build:css"]);

    // config
    //gulp.watch(configFile, ["init:config", "default"]);

    // custom
    var customWatches = config.directories.watch || [];

    for (var j = 0; i < customWatches.length; i++) {
        gulp.watch(customWatches[j].src, customWatches[j].tasks || ["default"]);
    }
}

// define complex tasks
//const watch = parallel(watchFiles, browserSync);
const js = series(cleanJs, buildJs);
const css = series(cleanCss, compileSass, buildCss);
const assets = series(cleanAssets, copyAssets);
const build = parallel(js, css, assets, jekyll);

exports.assets = assets;
exports.css = css;
exports.js = js;
exports.build = build;
exports.serve = series(build, jekyllServe);
exports.default = build;