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
const configWorker = require('./config.js');
const SystemStats = require('./systemStats.js');
const dataPipeline = require('./dataPipeline.js');

const CLASS_NAME = constants.SYSTEM_POLLER_CLASS_NAME;
const pollerIDs = {};

/**
 * Process system(s) stats
 *
 * @param {Object}   args           - args object
 * @param {Object}   args.config    - system config
 * @param {Boolean}  [args.process] - determine whether to process through pipeline
 * @param {Function} [args.tracer]  - tracer to write to disk
 *
 * @returns {Promise} Promise which is resolved with data sent
 */
function process(args) {
    const config = args.config;
    const tracer = args.tracer;

    const startTimestamp = new Date().toISOString();
    logger.debug('System poller cycle started');

    return new SystemStats().collect(
        config.host,
        {
            allowSelfSignedCert: config.allowSelfSignedCert,
            protocol: config.protocol,
            port: config.port,
            username: config.username,
            passphrase: config.passphrase ? config.passphrase : undefined,
            tags: config.tag,
            addtlProperties: {
                pollingInterval: config.interval
            }
        }
    )
        .then((data) => {
            const endTimeStamp = new Date().toISOString();
            // inject service data
            const telemetryServiceInfo = {
                pollingInterval: config.interval,
                cycleStart: startTimestamp,
                cycleEnd: endTimeStamp
            };
            data.telemetryServiceInfo = telemetryServiceInfo;
            data.telemetryEventCategory = constants.EVENT_TYPES.SYSTEM_POLLER;
            // end inject service data

            if (tracer) {
                tracer.write(JSON.stringify(data, null, 4));
            }
            let ret = null;
            if (args.process === false) {
                ret = Promise.resolve(data);
            } else {
                // call out to pipeline
                dataPipeline.process(data, constants.EVENT_TYPES.SYSTEM_POLLER);
            }
            logger.debug('System poller cycle finished');
            return ret;
        })
        .catch((e) => {
            throw e;
        });
}

/**
 * Safe process - start process safely
 *
 * @returns {Promise} Promise which is resolved with data sent
 */
function safeProcess() {
    try {
        // eslint-disable-next-line
        process.apply(null, arguments)
            .then()
            .catch((err) => {
                logger.exception('safeProcess unhandled exception in promise-chain', err);
            });
    } catch (err) {
        logger.exception('safeProcess unhandled exception', err);
    }
}

/**
 * Process client's request via REST API
 *
 * @param {Object} restOperation - request object
 */
function processClientRequest(restOperation) {
    // shared/telemetry/poller/pollerName
    const pollerName = restOperation.getUri().pathname.split('/')[4];
    if (!pollerName) {
        util.restOperationResponder(restOperation, 400,
            { code: 400, message: 'Bad Request. Poller\'s name not specified.' });
        return;
    }

    let systemPollers;
    if (configWorker.config.parsed && configWorker.config.parsed[constants.SYSTEM_POLLER_CLASS_NAME]) {
        systemPollers = configWorker.config.parsed[constants.SYSTEM_POLLER_CLASS_NAME];
    } else {
        systemPollers = {};
    }

    if (!systemPollers[pollerName]) {
        util.restOperationResponder(restOperation, 404,
            { code: 404, message: 'Poller with such name not found.' });
        return;
    }

    process({ config: systemPollers[pollerName], process: false })
        .then((data) => {
            util.restOperationResponder(restOperation, 200, data);
        })
        .catch((err) => {
            logger.error(`poller request ended up with error: ${err}`);
            util.restOperationResponder(restOperation, 500,
                { code: 500, message: `systemPoller.process error: ${err}` });
        });
}


// config worker change event
configWorker.on('change', (config) => {
    logger.debug('configWorker change event in systemPoller'); // helpful debug
    let systemPollers;
    if (config && config[CLASS_NAME]) {
        systemPollers = config[CLASS_NAME];
    }

    // timestamp to filed out-dated tracers
    const tracersTimestamp = new Date().getTime();

    // now check for system pollers and start/stop/update accordingly
    if (!systemPollers) {
        if (pollerIDs) {
            logger.info('Stopping all running system poller(s)');
            Object.keys(pollerIDs).forEach((k) => {
                util.stop(pollerIDs[k]);
                delete pollerIDs[k];
            });
        }
    } else {
        // we have pollers to process, now determine if we need to start or update
        Object.keys(systemPollers).forEach((k) => {
            const args = { config: systemPollers[k] };
            const baseMsg = `system poller ${k} interval: ${args.config.interval} secs`;
            // check for enable=false first
            if (args.config.enable === false) {
                // if already running, disable
                if (pollerIDs[k]) {
                    logger.info(`Disabling ${baseMsg}`);
                    util.stop(pollerIDs[k]);
                    delete pollerIDs[k];
                }
            } else if (pollerIDs[k]) {
                logger.info(`Updating ${baseMsg}`);
                args.tracer = util.tracer.createFromConfig(CLASS_NAME, k, args.config);
                pollerIDs[k] = util.update(pollerIDs[k], safeProcess, args, args.config.interval);
            } else {
                logger.info(`Starting ${baseMsg}`);
                args.tracer = util.tracer.createFromConfig(CLASS_NAME, k, args.config);
                pollerIDs[k] = util.start(safeProcess, args, args.config.interval);
            }
        });
    }
    util.tracer.remove(null, tracer => tracer.name.startsWith(CLASS_NAME)
                                       && tracer.lastGetTouch < tracersTimestamp);
});


module.exports = {
    process,
    processClientRequest
};
