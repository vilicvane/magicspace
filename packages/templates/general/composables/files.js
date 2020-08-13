const Path = require('path');

const {copy} = require('@magicspace/core');

module.exports = copy(Path.join(__dirname, '../files'), '**');
