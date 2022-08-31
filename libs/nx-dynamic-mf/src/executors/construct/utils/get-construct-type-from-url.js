"use strict";
exports.__esModule = true;
exports.getConstructTypeFromUrl = void 0;
var getConstructTypeFromUrl = function (url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        if (!(url.startsWith('http://localhost') || url.startsWith('https://localhost'))) {
            // Skipping because external URL
            return 'none';
        }
        return 'serve';
    }
    return 'build';
};
exports.getConstructTypeFromUrl = getConstructTypeFromUrl;
//# sourceMappingURL=get-construct-type-from-url.js.map