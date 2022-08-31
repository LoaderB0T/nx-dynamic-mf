"use strict";
exports.__esModule = true;
exports.getModulesToWatch = void 0;
var getModulesToWatch = function (watch, modules) {
    if (!watch) {
        return;
    }
    var moduleNamesToWatch = [];
    var modulesToBuild = modules.filter(function (m) { return m.constructType === 'build'; });
    if (watch === true) {
        moduleNamesToWatch.push.apply(moduleNamesToWatch, modulesToBuild.map(function (m) { return m.name; }));
    }
    if (typeof watch === 'string') {
        if (watch.includes(',')) {
            moduleNamesToWatch.push.apply(moduleNamesToWatch, watch.split(','));
        }
        else {
            moduleNamesToWatch.push(watch);
        }
    }
    var invalidNames = moduleNamesToWatch.filter(function (p) { return !modules.find(function (m) { return m.name === p; }); });
    if (invalidNames.length > 0) {
        throw new Error("Invalid module names for watch: ".concat(invalidNames.join(', ')));
    }
    var invalidBuildNames = moduleNamesToWatch.filter(function (p) { return !modulesToBuild.find(function (m) { return m.name === p; }); });
    if (invalidBuildNames.length > 0) {
        console.warn("Invalid module names for watch, because they are served: ".concat(invalidBuildNames.join(', ')));
        invalidBuildNames.forEach(function (p) { return moduleNamesToWatch.splice(moduleNamesToWatch.indexOf(p), 1); });
    }
    modules.forEach(function (m) {
        if (moduleNamesToWatch.includes(m.name)) {
            m.constructType = 'buildAndWatch';
        }
    });
};
exports.getModulesToWatch = getModulesToWatch;
//# sourceMappingURL=get-modules-to-watch.js.map