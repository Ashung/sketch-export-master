const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const exec = require('child-process-promise').exec;
const del = require('del');
const vinylPaths = require('vinyl-paths');
const svg2vectordrawable = require('svg2vectordrawable/lib/svg-file-to-vectordrawable-file');
const mustacheRender = require("mustache").render;

const imagemin = require('gulp-imagemin');
const rename = require('gulp-rename');
const mustache = require("gulp-mustache");
const iconfont = require('gulp-iconfont');
const svgSprite = require('gulp-svg-sprite');

let sketchtool = '/Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool';
let sketchFile = './sketch/icons.sketch';

let packageInfo = require('./package.json');
let projectTitle = packageInfo.name.split('-').map(item => {
    return item[0].toUpperCase() + item.substr(1)
}).join(' ');
let projectDescription = packageInfo.description;
let projectVersion = packageInfo.version;
let projectBuildDate = String(new Date().getFullYear()) +
    (new Date().getMonth() > 8 ? new Date().getMonth() + 1 : '0' + (new Date().getMonth() + 1)) +
    (new Date().getDate() > 9 ? new Date().getDate() : '0' + new Date().getDate());

// Web: 1x png
function subtaskCleanPNG1x() {
    return del(['./dest/png-1x']);
}
subtaskCleanPNG1x.displayName = 'Clean 1x PNG';

function subtaskExportPNG1x() {
    let dest = './dest/png-1x';
    return exec(`${sketchtool} export artboards ${sketchFile} --formats="png" --scale="1" --output="${dest}" --include-symbols="yes"`);
}
subtaskExportPNG1x.displayName = 'Export 1x PNG';

function subtaskOptimizePNG1x() {
    return gulp.src('./dest/png-1x/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./dest/png-1x'));
}
subtaskOptimizePNG1x.displayName = 'Optimize 1x PNG';

let taskPNG1x = gulp.series(subtaskCleanPNG1x, subtaskExportPNG1x, subtaskOptimizePNG1x);
taskPNG1x.description = 'Export 1x Optimized PNG';

gulp.task('PNG 1x', taskPNG1x);

// Web: 2x png
function subtaskCleanPNG2x() {
    return del(['./dest/png-2x']);
}
subtaskCleanPNG2x.displayName = 'Clean 2x PNG';

function subtaskExportPNG2x() {
    let dest = './dest/png-2x';
    return exec(`${sketchtool} export artboards ${sketchFile} --formats="png" --scale="2" --output="${dest}" --include-symbols="yes"`);
}
subtaskExportPNG2x.displayName = 'Export 2x PNG';

function subtaskOptimizePNG2x() {
    return gulp.src('./dest/png-2x/*')
        .pipe(rename((path, file) => {
            path.basename = path.basename.replace(/@2x$/, '');
            del(file.path);
        }))
        .pipe(imagemin())
        .pipe(gulp.dest('./dest/png-2x'));
}
subtaskOptimizePNG2x.displayName = 'Optimize 2x PNG';

let taskPNG2x = gulp.series(subtaskCleanPNG2x, subtaskExportPNG2x, subtaskOptimizePNG2x);
taskPNG2x.description = 'Export 2x Optimized PNG';

gulp.task('PNG 2x', taskPNG2x);

// Web: 1x + 2x png
function subtaskCleanPNG() {
    return del(['./dest/png']);
}
subtaskCleanPNG.displayName = 'Clean PNG';

function subtaskExportPNG() {
    let dest = './dest/png';
    return exec(`${sketchtool} export artboards ${sketchFile} --formats="png" --scale="1,2" --output="${dest}" --include-symbols="yes"`);
}
subtaskExportPNG.displayName = 'Export PNG';

function subtaskOptimizePNG() {
    return gulp.src('./dest/png/*')
        .pipe(rename((path, file) => {
            if (/@2x$/.test(path.basename)) {
                path.basename = path.basename.replace(/@(\d)x$/, '_$1x');
                del(file.path);
            }
        }))
        .pipe(imagemin())
        .pipe(gulp.dest('./dest/png'));
}
subtaskOptimizePNG.displayName = 'Optimize PNG';

let taskPNG = gulp.series(subtaskCleanPNG, subtaskExportPNG, subtaskOptimizePNG);
taskPNG.description = 'Export Optimized PNG';

gulp.task('PNG', taskPNG);

// iOS: PNG
function subtaskCleanIOSPNG() {
    return del(['./dest/ios-png']);
}
subtaskCleanIOSPNG.displayName = 'Clean iOS PNG';

function subtaskExportIOSPNG() {
    let dest = './dest/ios-png/';
    return exec(`${sketchtool} export artboards ${sketchFile} --formats="png" --scale="1,2,3" --output="${dest}" --include-symbols="yes"`);
}
subtaskExportIOSPNG.displayName = 'Export iOS PNG';

function subtaskOptimizeIOSPNG() {
    return gulp.src('./dest/ios-png/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./dest/ios-png/'));
}
subtaskOptimizeIOSPNG.displayName = 'Optimize iOS PNG';

let taskIOSPNG = gulp.series(subtaskCleanIOSPNG, subtaskExportIOSPNG, subtaskOptimizeIOSPNG);
taskIOSPNG.description = 'Export Optimized iOS PNG';

gulp.task('iOS PNG', taskIOSPNG);

// Android: PNG
function subtaskCleanAndroidPNG() {
    return del(['./dest/android-png']);
}
subtaskCleanAndroidPNG.displayName = 'Clean Android PNG';

function subtaskExportAndroidPNG() {
    let dest = './dest/android-png/';
    return exec(`${sketchtool} export artboards ${sketchFile} --formats="png" --scale="1,1.5,2,3,4" --output="${dest}" --include-symbols="yes"`);
}
subtaskExportAndroidPNG.displayName = 'Export Android PNG';

function subtaskOptimizeAndroidPNG() {
    return gulp.src('./dest/android-png/*')
        .pipe(rename((path, file) => {
            if (/@1x$/.test(path.basename)) {
                path.dirname = 'drawable-hdpi';
            }
            else if (/@2x$/.test(path.basename)) {
                path.dirname = 'drawable-xhdpi';
            }
            else if (/@3x$/.test(path.basename)) {
                path.dirname = 'drawable-xxhdpi';
            }
            else if (/@4x$/.test(path.basename)) {
                path.dirname = 'drawable-xxxxhdpi';
            }
            else {
                path.dirname = 'drawable-mdpi';
            }
            path.basename = path.basename.replace(/@\dx$/, '');
            path.basename = path.basename.replace(/-/g, '_');
            path.basename = 'ic_' + path.basename;
            del(file.path);
        }))
        .pipe(imagemin())
        .pipe(gulp.dest('./dest/android-png/'));
}
subtaskOptimizeAndroidPNG.displayName = 'Optimize Android PNG';

let taskAndroidPNG = gulp.series(subtaskCleanAndroidPNG, subtaskExportAndroidPNG, subtaskOptimizeAndroidPNG);
taskAndroidPNG.description = 'Export Optimized Android PNG';

gulp.task('Android PNG', taskAndroidPNG);

// iOS: PDF
function subtaskCleanPDF() {
    return del(['./dest/pdf']);
}
subtaskCleanPDF.displayName = 'Clean PDF';

function subtaskExportPDF() {
    let dest = './dest/pdf/';
    return exec(`${sketchtool} export artboards ${sketchFile} --formats="pdf" --output="${dest}" --include-symbols="yes"`);
}
subtaskExportPDF.displayName = 'Export PDF';

let taskPDF = gulp.series(subtaskCleanPDF, subtaskExportPDF);
taskPDF.description = 'Export PDF for iOS and macOS';

gulp.task('PDF', taskPDF);

// SVG
function subtaskCleanSVG() {
    return del(['./dest/svg']);
}
subtaskCleanSVG.displayName = 'Clean SVG';

function subtaskExportSVG() {
    let dest = './dest/svg/';
    return exec(`${sketchtool} export artboards ${sketchFile} --formats="svg" --output="${dest}" --include-symbols="yes"`);
}
subtaskExportSVG.displayName = 'Export SVG';

function subtaskOptimizeSVG() {
    return gulp.src('./dest/svg/*.svg')
        .pipe(imagemin([
            imagemin.svgo({
                plugins: [
                    { cleanupListOfValues: { floatPrecision: 2, leadingZero: false } },
                    { cleanupNumericValues: { floatPrecision: 2, leadingZero: false } },
                    { convertPathData: { floatPrecision: 2, leadingZero: false } },
                    { removeViewBox: false },
                    { removeDimensions: true }
                ]
            })
        ]))
        .pipe(gulp.dest('./dest/svg'));
}
subtaskOptimizeSVG.displayName = 'Optimize SVG';

function subtaskCreateIconsHTML() {
    return gulp.src('./templates/icons.html')
        .pipe(mustache({
            title: projectTitle,
            description: projectDescription,
            version: projectVersion,
            date: projectBuildDate,
            icons: fs.readdirSync('./dest/svg/').map(file => {
                return {
                    'name': file.replace(/\.svg$/, '')
                }
            })
        }))
        .pipe(gulp.dest('./dest/'));
}
subtaskCreateIconsHTML.displayName = 'Create a search HTML for all icons';

let taskSVG = gulp.series(subtaskCleanSVG, subtaskExportSVG, subtaskOptimizeSVG, subtaskCreateIconsHTML);
taskSVG.description = 'Export SVG';

gulp.task('SVG', taskSVG);

// Android: Vector Drawable
function subtaskCleanVectorDrawable() {
    return del(['./dest/android-vector-drawable']);
}
subtaskCleanVectorDrawable.displayName = 'Clean Vector Drawable';

function subtaskCreateVectorDrawable() {
    let dest = './dest/android-vector-drawable';
    return gulp.src('./dest/svg/*.svg')
        .pipe(vinylPaths(file => {
            let outputPath = path.join(dest, 'ic_' + path.basename(file).replace(/\.svg$/, '.xml'));
            return svg2vectordrawable(file, outputPath);
        }));
}
subtaskCreateVectorDrawable.displayName = 'Create Vector Drawable';

let taskVectorDrawable = gulp.series('SVG', subtaskCleanVectorDrawable, subtaskCreateVectorDrawable);
taskSVG.description = 'Export Vector Drawable';

gulp.task('Vector Drawable', taskVectorDrawable);

// Web: Icon font
let fontName = 'icon-font';

function subtaskCleanIconFont() {
    return del(['./dest/iconfont']);
}
subtaskCleanIconFont.displayName = 'Clean Icon Font';

function renderMustacheToFile(inputFile, outputFile, data) {
    let templateString = fs.readFileSync(inputFile, 'utf-8');
    let code = mustacheRender(templateString, data);
    fs.writeFileSync(outputFile, code);
}

function subtaskCreateIconFont() {
    let dest = './dest/iconfont';
    return gulp.src('./dest/svg/*.svg')
        .pipe(iconfont({
            fontName: fontName,
            formats: ['svg', 'ttf', 'eot', 'woff', 'woff2'],
            timestamp: Math.round(Date.now() / 1000),
            fontHeight: 1024,
            normalize: true
        }))
        .on('glyphs', glyphs => {
            let icons = glyphs.map(glyph => {
                let character = glyph.unicode[0];
                let codepoint = character.codePointAt(0).toString(16);
                if (codepoint.length < 4) {
                    codepoint = '0'.repeat(4 - codepoint.length) + codepoint;
                }
                return {
                    name: glyph.name,
                    className: 'ic-' + glyph.name.replace(/_/g, '-'),
                    character: character,
                    code: codepoint
                };
            });
            renderMustacheToFile('./templates/iconfont.html', path.join(dest, 'iconfont.html'), {
                title: projectTitle,
                description: projectDescription,
                version: projectVersion,
                date: projectBuildDate,
                icons: icons,
                fontName: fontName
            });
            renderMustacheToFile('./templates/iconfont.css', path.join(dest, 'iconfont.css'), {
                icons: icons,
                fontName: fontName
            });
        })
        .pipe(gulp.dest(dest));
}
subtaskCreateIconFont.displayName = 'Create Icon Font';

let taskIconFont = gulp.series('SVG', subtaskCleanIconFont, subtaskCreateIconFont);
taskIconFont.description = 'Export Icon Font';

gulp.task('Icon Font', taskIconFont);

// SVG Sprite
let svgSpriteCommonConfig = {
    shape: {
        id: {
            separator: '-',
            whitespace: '-',
            generator: (name, file) => {
                return name.replace(/\.svg$/, '').replace(/(_|-|\s+)/g, '-');
            }
        }
    },
    variables: {
        'title': projectTitle,
        'description': projectDescription,
        'version': projectVersion,
        'buildDate': projectBuildDate,
    },
    mode: {}
};

// SVG CSS Sprite
function subtaskCleanSVGCSSSprite() {
    return del(['./dest/svg-css-sprite']);
}
subtaskCleanSVGCSSSprite.displayName = 'Clean SVG CSS Sprite';

function subtaskCreateSVGCSSSprite() {
    let config = svgSpriteCommonConfig;
    config.mode.css = {
        dest: 'svg-css-sprite',
        bust: false,
        prefix: '.icon-%s',
        dimensions: '',
        sprite: 'sprite.svg',
        common: 'icon',
        example: {
            template: './templates/svg_css_sprite.html',
            dest: 'index.html'
        },
        render: {
            css: {
                template: './templates/svg_css_sprite.css',
                dest: 'sprite.css'
            }
        }
    };
    return gulp.src('./dest/svg/*.svg')
        .pipe(svgSprite(config))
        .pipe(gulp.dest('./dest/'));
}
subtaskCreateSVGCSSSprite.displayName = 'Create SVG CSS Sprite';

let taskSVGCSSSprite = gulp.series('SVG', subtaskCleanSVGCSSSprite, subtaskCreateSVGCSSSprite);
taskSVGCSSSprite.description = 'Export SVG CSS Sprite';

gulp.task('SVG CSS Sprite', taskSVGCSSSprite);

// SVG View Sprite
function subtaskCleanSVGViewSprite() {
    return del(['./dest/svg-view-sprite']);
}
subtaskCleanSVGViewSprite.displayName = 'Clean SVG View Sprite';

function subtaskCreateSVGViewSprite() {
    let config = svgSpriteCommonConfig;
    config.mode.view = {
        dest: 'svg-view-sprite',
        bust: false,
        prefix: '.icon-%s',
        dimensions: '',
        sprite: 'sprite.svg',
        common: 'icon',
        example: {
            template: './templates/svg_view_sprite.html',
            dest: 'index.html'
        },
        render: {
            css: {
                template: './templates/svg_css_sprite.css',
                dest: 'sprite.css'
            }
        }
    };
    return gulp.src('./dest/svg/*.svg')
        .pipe(svgSprite(config))
        .pipe(gulp.dest('./dest/'));
}
subtaskCreateSVGViewSprite.displayName = 'Create SVG View Sprite';

let taskSVGViewSprite = gulp.series('SVG', subtaskCleanSVGViewSprite, subtaskCreateSVGViewSprite);
taskSVGViewSprite.description = 'Export SVG View Sprite';

gulp.task('SVG View Sprite', taskSVGViewSprite);

// SVG Defs Sprite
function subtaskCleanSVGDefsSprite() {
    return del(['./dest/svg-defs-sprite']);
}
subtaskCleanSVGDefsSprite.displayName = 'Clean SVG Defs Sprite';

function subtaskCreateSVGDefsSprite() {
    let config = svgSpriteCommonConfig;
    config.mode.defs = {
        dest: 'svg-defs-sprite',
        bust: false,
        sprite: 'sprite.svg',
        example: {
            template: './templates/svg_defs_sprite.html',
            dest: 'index.html'
        }
    };
    return gulp.src('./dest/svg/*.svg')
        .pipe(svgSprite(config))
        .pipe(gulp.dest('./dest/'));
}
subtaskCreateSVGDefsSprite.displayName = 'Create SVG Defs Sprite';

let taskSVGDefsSprite = gulp.series('SVG', subtaskCleanSVGDefsSprite, subtaskCreateSVGDefsSprite);
taskSVGDefsSprite.description = 'Export SVG Defs Sprite';

gulp.task('SVG Defs Sprite', taskSVGDefsSprite);

// SVG Symbol Sprite
function subtaskCleanSVGSymbolSprite() {
    return del(['./dest/svg-symbol-sprite']);
}
subtaskCleanSVGSymbolSprite.displayName = 'Clean SVG Symbol Sprite';

function subtaskCreateSVGSymbolSprite() {
    let config = svgSpriteCommonConfig;
    config.mode.symbol = {
        dest: 'svg-symbol-sprite',
        bust: false,
        sprite: 'sprite.svg',
        example: {
            template: './templates/svg_symbol_sprite.html',
            dest: 'index.html'
        }
    };
    return gulp.src('./dest/svg/*.svg')
        .pipe(svgSprite(config))
        .pipe(gulp.dest('./dest/'));
}
subtaskCreateSVGSymbolSprite.displayName = 'Create SVG Symbol Sprite';

let taskSVGSymbolSprite = gulp.series('SVG', subtaskCleanSVGSymbolSprite, subtaskCreateSVGSymbolSprite);
taskSVGSymbolSprite.description = 'Export SVG Symbol Sprite';

gulp.task('SVG Symbol Sprite', taskSVGSymbolSprite);

// SVG Stack Sprite
function subtaskCleanSVGStackSprite() {
    return del(['./dest/svg-stack-sprite']);
}
subtaskCleanSVGStackSprite.displayName = 'Clean SVG Stack Sprite';

function subtaskCreateSVGStackSprite() {
    let config = svgSpriteCommonConfig;
    config.mode.stack = {
        dest: 'svg-stack-sprite',
        bust: false,
        sprite: 'sprite.svg',
        example: {
            template: './templates/svg_stack_sprite.html',
            dest: 'index.html'
        }
    };
    return gulp.src('./dest/svg/*.svg')
        .pipe(svgSprite(config))
        .pipe(gulp.dest('./dest/'));
}
subtaskCreateSVGStackSprite.displayName = 'Create SVG Stack Sprite';

let taskSVGStackSprite = gulp.series('SVG', subtaskCleanSVGStackSprite, subtaskCreateSVGStackSprite);
taskSVGStackSprite.description = 'Export SVG Stack Sprite';

gulp.task('SVG Stack Sprite', taskSVGStackSprite);