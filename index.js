'use strict';
var path = require('path');
var fsExtra = require('fs-extra');
var pify = require('pify');
var Promise = require('pinkie-promise');
var uuid = require('uuid');
var xdgTrashdir = require('xdg-trashdir');
var fs = pify.all(fsExtra, Promise);

function trash(src) {
	return xdgTrashdir(src).then(function (dir) {
		var name = uuid.v4();
		var dest = path.join(dir, 'files', name);
		var info = path.join(dir, 'info', name + '.trashinfo');
		var msg = [
			'[Trash Info]',
			'Path=' + src.replace(/\s/g, '%20'),
			'DeletionDate=' + new Date().toISOString()
		].join('\n');

		return Promise.all([
			fs.move(src, dest, {mkdirp: true}).then(function () {
				return dest;
			}),
			fs.outputFile(info, msg).then(function () {
				return info;
			})
		]).then(function (res) {
			return {
				path: res[0],
				info: res[1]
			};
		});
	});
}

module.exports = function (paths) {
	if (process.platform !== 'linux') {
		return Promise.reject(new Error('Only Linux systems are supported'));
	}

	if (!Array.isArray(paths)) {
		return Promise.reject(new TypeError('Expected an array'));
	}

	if (paths.length === 0) {
		return Promise.resolve();
	}

	return Promise.all(paths.map(function (p) {
		return trash(path.resolve(String(p)));
	}));
};
