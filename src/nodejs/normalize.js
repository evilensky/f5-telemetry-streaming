/*
 * Copyright 2018. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

const logger = require('./logger.js'); // eslint-disable-line no-unused-vars
const constants = require('./constants.js');
const util = require('./util.js');
const normalizeUtil = require('./normalizeUtil.js');

/**
 * Format as JSON - assume data looks similar to this: KEY1="value",KEY2="value"
 *
 * @param {Object} data - data
 *
 * @returns {Object} Returns data as JSON
 */
function formatAsJson(data) {
    const ret = {};
    // place in try/catch in case this event is malformed
    try {
        const dataToFormat = data.replace(/\n/g, '');
        const baseSplit = dataToFormat.split(',');
        baseSplit.forEach((i) => {
            const keySplit = i.split('=');
            const keyValue = keySplit[1].replace(/"/g, '');
            ret[keySplit[0]] = keyValue;
        });
    } catch (e) {
        logger.error(`formatAsJson error: ${e}`);
    }
    return ret;
}

/**
 * Run custom function
 *
 * @param {Object} data           - data
 * @param {Object} options        - optional arguments
 * @param {Object} [options.func] - function to run
 * @param {Object} [options.args] - args to provide to function
 *
 * @returns {Object} Function result
 */
function runCustomFunction(data, options) {
    const args = { data };

    const optionalArgs = options.args;
    if (optionalArgs && typeof optionalArgs === 'object') {
        Object.keys(optionalArgs).forEach((k) => {
            if (k === 'data') { throw new Error('Named argument (data) is not allowed'); }
            args[k] = optionalArgs[k];
        });
    }
    try {
        return normalizeUtil[options.func](args);
    } catch (e) {
        throw new Error(`runCustomFunction failed: ${e}`);
    }
}

/**
 * Get data using provided key
 *
 * @param {Object} data - data
 * @param {Object} key  - key to use when accessing item in data
 *
 * @returns {Object} Data in key
 */
function getDataByKey(data, key) {
    const keys = key.split(constants.STATS_KEY_SEP);
    let ret = data;

    keys.forEach((i) => {
        if (typeof ret === 'object' && i in ret) {
            ret = ret[i];
        } else {
            // do not throw error as some keys do not exist if not configured with a value on BIG-IP
            ret = 'missing key';
        }
    });
    return ret;
}

/**
 * Rename keys in object using regex pattern
 *
 * @param {Object} data     - data
 * @param {Object} patterns - map of patterns
 *
 * @returns {Object} Renamed data
 */
function renameKeysInData(data, patterns) {
    let ret = Array.isArray(data) ? [] : {};

    // only check non array objects
    if (typeof data === 'object' && !Array.isArray(data)) {
        Object.keys(data).forEach((k) => {
            let renameKey = false;
            let renamedKey;
            Object.keys(patterns).forEach((pK) => {
                // check if key contains base match pattern
                if (k.includes(pK)) {
                    // now check if regex pattern matches - support object with { pattern, group }
                    const pattern = patterns[pK].pattern ? patterns[pK].pattern : patterns[pK];
                    const group = patterns[pK].group ? patterns[pK].group : 0;
                    const checkForMatch = k.match(pattern);
                    if (checkForMatch) {
                        renameKey = true;
                        renamedKey = checkForMatch[group];
                    }
                }
            });
            if (renameKey) {
                ret[renamedKey] = renameKeysInData(data[k], patterns);
            } else {
                ret[k] = renameKeysInData(data[k], patterns);
            }
        });
        return ret;
    }

    ret = data;
    return ret;
}

/**
 * Standardize and reduce complexity of provided data
 *
 * @param {Object} data                        - data to reduce
 * @param {Object} options                     - options
 * @param {Object} [options.convertArrayToMap] - key to drill down into data, using a defined notation
 *
 * @returns {Object} Reduced object
 */
function reduceData(data, options) {
    let ret = Array.isArray(data) ? [] : {};

    // reduce down the nested structure for some well known keys (only one in object)
    const keysToReduce = ['nestedStats', 'value', 'description', 'color'];
    for (let i = 0; i < keysToReduce.length; i += 1) {
        const item = data[keysToReduce[i]];
        if (item !== undefined && Object.keys(data).length === 1) {
            return reduceData(item, options);
        }
    }

    // .entries evaluates to true if data is array
    if (data.entries && !Array.isArray(data)) {
        Object.keys(data.entries).forEach((k) => {
            const v = data.entries[k];

            // child entry keys may look like https://localhost/mgmt/tm/sys/tmm-info/0.0/stats,
            // we should simplify this somewhat
            const kM = k.replace('https://localhost/', '').replace('mgmt/tm/', '');
            ret[kM] = v;
        });
        return reduceData(ret, options);
    }

    // simply include and then recurse
    if (typeof data === 'object') {
        if (Array.isArray(data)) {
            // convert array to map if required, otherwise just include
            const catm = options.convertArrayToMap;
            if (catm && catm.keyName) {
                ret = util.convertArrayToMap(data, catm.keyName, { keyPrefix: catm.keyNamePrefix });
                // now reduce
                ret = reduceData(ret, options);
            } else {
                data.forEach((i) => {
                    ret.push(reduceData(i, options));
                });
            }
        } else {
            Object.keys(data).forEach((k) => {
                const v = data[k];
                ret[k] = reduceData(v, options);
            });
        }

        return ret;
    }
    // base case - just return
    ret = data;
    return ret;
}

/**
 * Normalize event
 *
 * @param {Object} data - data to normalize
 *
 * @returns {Object} Returns normalized data
 */
function normalizeEvent(data) {
    const ret = formatAsJson(data);
    return ret;
}

/**
 * Normalize data - standardize and reduce complexity
 *
 * @param {Object} data                          - data to normalize
 * @param {Object} options                       - options
 * @param {Object} [options.key]                 - key to drill down into data, using a defined notation
 * @param {Object} [options.filterByKeys]        - list of keys to filter data further
 * @param {Object} [options.renameKeysByPattern] - map of keys to rename by pattern
 * @param {Object} [options.convertArrayToMap]   - convert array to map using defined key name
 * @param {Object} [options.runCustomFunction]   - run custom function on data
 *
 * @returns {Object} Normalized data
 */
function normalizeData(data, options) {
    // standard reduce first
    const reduceDataOptions = { convertArrayToMap: options.convertArrayToMap };
    let ret = reduceData(data, reduceDataOptions);

    // additional normalization may be required - the order here matters
    ret = options.key ? getDataByKey(ret, options.key) : ret;
    ret = options.filterByKeys ? util.filterDataByKeys(ret, options.filterByKeys) : ret;
    ret = options.renameKeysByPattern ? renameKeysInData(ret, options.renameKeysByPattern) : ret;
    if (options.runCustomFunction) {
        const rCFOptions = {
            func: options.runCustomFunction.name,
            args: options.runCustomFunction.args
        };
        ret = runCustomFunction(ret, rCFOptions);
    }

    return ret;
}

module.exports = {
    data: normalizeData,
    event: normalizeEvent
};