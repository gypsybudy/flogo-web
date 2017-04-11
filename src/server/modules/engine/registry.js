import path from 'path';

import {Engine} from './engine';
import { logger, engineLogger } from '../../common/logging';
import {config} from '../../config/app-config';

let engineRegistry = {};

/**
 * Gets initialized engine
 * @param enginePath {string} name/path of the engine
 * @param opts {object}
 * @param opts.forceCreate {boolean} default false
 * @returns {*}
 */
export function getInitializedEngine(enginePath, opts = {}) {
  if (engineRegistry[enginePath]) {
    return Promise.resolve(engineRegistry[enginePath]);
  }

  const engine = new Engine(enginePath, opts.libVersion||config.libVersion, engineLogger);
  engineRegistry[enginePath] = engine;

  const initTimer = logger.startTimer();
  return initEngine(engine, opts)
    .then(() => {
      engineRegistry[enginePath] = engine;
      initTimer.done('EngineInit');
      return engine;
    });

}

/**
 *
 * @param engine {Engine}
 * @param options
 * @returns {*}
 */
export function initEngine(engine, options) {
  let forceInit = options && options.forceCreate;
  return engine.exists()
    .then(function(engineExists){
      if (engineExists && forceInit) {
        return engine.remove().then(() => true);
      }
      return !engineExists || forceInit;
    })
    .then(create => {
      if(create) {
        logger.warn('Engine does not exist. Creating...');
        return engine.create(config.defaultFlogoDescriptorPath)
          .then(() => {
            logger.info('New engine created');
            // TODO: add palette version
            let palettePath = path.resolve('config', config.defaultEngine.defaultPalette);
            logger.info(`Will install palette at ${palettePath}`);
            return engine.installPalette(palettePath);
          })
          .catch(error => {
            logger.error('Error initializing engine. Will try to clean up');
            // return engine.remove().then(() => {
            //   logger.info('Successful clean');
            //   throw new Error(error);
            // });
          });
      }
    })
    .then(() => engine.load())
    .then(installedContribs => {
      const mapContribs = collection => collection.map(c => ({ path: c.path, version: c.version }));
      logger.info('installedContributions', {
        triggers: mapContribs(installedContribs.triggers),
        activities: mapContribs(installedContribs.activities),
      });
    })
    .then(() => Promise.all([
      // update config.json, use overwrite mode
      engine.updateConfig(config.testEngine.config, { overwrite: true }),
      // update triggers.json
      engine.updateTriggersConfig({ triggers: config.testEngine.triggers }, { overwrite: true }),
    ]));
}
