"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var fse = require("fs-extra");
var get_construct_type_from_url_1 = require("./utils/get-construct-type-from-url");
var get_modules_to_watch_1 = require("./utils/get-modules-to-watch");
function constructExecutor(options, context) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var callerName, projConfig, projRoot, modulesJsonName, modulesFilePath, modulesFile, modulesToLoad, servings, builds, moduleCfgs, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    callerName = context.projectName;
                    projConfig = context.workspace.projects[callerName];
                    projRoot = projConfig.root;
                    modulesJsonName = "modules.".concat((_b = (_a = options.m) !== null && _a !== void 0 ? _a : options.modules) !== null && _b !== void 0 ? _b : 'default', ".json");
                    (0, fs_1.copyFileSync)("".concat(projRoot, "/").concat(options.modulesFolder, "/").concat(modulesJsonName), "".concat(projRoot, "/").concat(options.modulesFolder, "/modules.json"));
                    modulesFilePath = "".concat(projRoot, "/").concat(options.modulesFolder, "/modules.json");
                    modulesFile = (0, fs_1.readFileSync)(modulesFilePath, 'utf8');
                    modulesToLoad = JSON.parse(modulesFile);
                    servings = [];
                    builds = [];
                    moduleCfgs = modulesToLoad.map(function (m) {
                        var moduleDef = __assign(__assign({}, m), { constructType: (0, get_construct_type_from_url_1.getConstructTypeFromUrl)(m.url) });
                        return moduleDef;
                    });
                    (0, get_modules_to_watch_1.getModulesToWatch)(options.watch, moduleCfgs);
                    moduleCfgs.forEach(function (moduleToLoad) {
                        var moduleConfig = context.workspace.projects[moduleToLoad.name];
                        if (moduleToLoad.constructType === 'none') {
                            return;
                        }
                        if (moduleToLoad.constructType === 'serve') {
                            var port = /localhost:(\d+)/.exec(moduleToLoad.url)[1];
                            if (!port || Number.isNaN(Number.parseInt(port))) {
                                throw new Error("Invalid port in module ".concat(moduleToLoad.name));
                            }
                            var portNumber_1 = Number.parseInt(port);
                            console.log("Serving ".concat(moduleToLoad.name, " on port ").concat(portNumber_1));
                            servings.push(new Promise(function (resolve, reject) {
                                var child = (0, child_process_1.exec)("nx serve ".concat(moduleToLoad.name, " --port ").concat(portNumber_1));
                                child.stdout.pipe(process.stdout);
                                child.on('exit', function (code) { return (code === 0 ? resolve() : reject(code)); });
                            }));
                        }
                        if (moduleToLoad.constructType === 'build' || moduleToLoad.constructType === 'buildAndWatch') {
                            var watch_1 = moduleToLoad.constructType === 'buildAndWatch';
                            console.log("Building ".concat(moduleToLoad.name, " to ").concat(moduleToLoad.url).concat(watch_1 ? ' (watching)' : ''));
                            builds.push(new Promise(function (resolve, reject) {
                                var child = (0, child_process_1.exec)("nx build ".concat(moduleToLoad.name).concat(watch_1 ? ' --watch' : ''));
                                child.stdout.pipe(process.stdout);
                                child.on('exit', function (code) { return (code === 0 ? resolve() : reject(code)); });
                            }).then(function () {
                                fse.copySync("./dist/".concat(moduleConfig.root), "".concat(projConfig.sourceRoot).concat(moduleToLoad.url));
                            }));
                        }
                    });
                    servings.push(new Promise(function (resolve, reject) {
                        var child = (0, child_process_1.exec)("nx serve ".concat(callerName, " --open"));
                        child.stdout.pipe(process.stdout);
                        child.on('exit', function (code) { return (code === 0 ? resolve() : reject(code)); });
                    }));
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, Promise.all(builds)];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, Promise.all(servings)];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _c.sent();
                    console.error("Error building referenced projects.");
                    console.error(error_1);
                    return [2 /*return*/, { success: false }];
                case 5: return [2 /*return*/, { success: true }];
            }
        });
    });
}
exports["default"] = constructExecutor;
//# sourceMappingURL=impl.js.map