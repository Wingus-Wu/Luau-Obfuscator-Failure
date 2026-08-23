"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
var Logger = /** @class */ (function () {
    function Logger(defaultSource) {
        if (defaultSource === void 0) { defaultSource = "app"; }
        this.defaultSource = defaultSource;
        this.entries = [];
        this.listeners = new Set();
        this.maxEntries = 5000;
    }
    Logger.prototype.log = function (level, source, message, data) {
        var entry = {
            level: level,
            source: source || this.defaultSource,
            message: message,
            timestamp: Date.now(),
            data: data,
        };
        this.entries.push(entry);
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(-this.maxEntries);
        }
        for (var _i = 0, _a = this.listeners; _i < _a.length; _i++) {
            var listener = _a[_i];
            listener(entry);
        }
        return entry;
    };
    Logger.prototype.debug = function (source, message, data) {
        return this.log("debug", source, message, data);
    };
    Logger.prototype.info = function (source, message, data) {
        return this.log("info", source, message, data);
    };
    Logger.prototype.warn = function (source, message, data) {
        return this.log("warn", source, message, data);
    };
    Logger.prototype.error = function (source, message, data) {
        return this.log("error", source, message, data);
    };
    Logger.prototype.success = function (source, message, data) {
        return this.log("success", source, message, data);
    };
    Logger.prototype.getAll = function () {
        return __spreadArray([], this.entries, true);
    };
    Logger.prototype.clear = function () {
        this.entries = [];
    };
    Logger.prototype.subscribe = function (listener) {
        var _this = this;
        this.listeners.add(listener);
        return function () { return _this.listeners.delete(listener); };
    };
    Logger.prototype.getCounts = function () {
        var counts = { debug: 0, info: 0, warn: 0, error: 0, success: 0 };
        for (var _i = 0, _a = this.entries; _i < _a.length; _i++) {
            var entry = _a[_i];
            counts[entry.level]++;
        }
        return counts;
    };
    return Logger;
}());
exports.Logger = Logger;
