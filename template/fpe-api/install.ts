/*
********************************************
 Copyright © 2021 Agora Lab, Inc., all rights reserved.
 AppBuilder and all associated components, source code, APIs, services, and documentation 
 (the “Materials”) are owned by Agora Lab, Inc. and its licensors. The Materials may not be 
 accessed, used, modified, or distributed for any purpose without a license from Agora Lab, Inc.  
 Use without a license or in violation of any license terms and conditions (including use for 
 any purpose competitive to Agora Lab, Inc.’s business) is strictly prohibited. For more 
 information visit https://appbuilder.agora.io. 
*********************************************
*/
import {FpeApiInterface} from './typeDefinition';
import ReactIs from 'react-is';
/**
 *
 * @param config FPE options to override the UI components and customize the application
 * @returns config options
 */

function isString(data: any) {
  if (data && typeof data === 'string') {
    return true;
  }
  return false;
}

function isFunction(data: any) {
  if (data && typeof data === 'function') {
    return true;
  }
  return false;
}

function isObject(data: any) {
  if (data && typeof data === 'object') {
    return true;
  }
  return false;
}

function isComponent(data: any) {
  if (data && ReactIs.isValidElementType(data)) {
    return true;
  }
  return false;
}

function validateComponents(components: any) {
  for (const key in components) {
    let comp = components[key];
    if (comp) {
      if (isComponent(comp) || isObject(comp)) {
        if (isObject(comp)) {
          validateComponents(comp);
        }
      } else {
        console.error(
          `InstallFPE:Error ${key} should be a react component or object`,
        );
      }
    }
  }
}

function validateLifecycle(data: any) {
  for (const key in data) {
    const callback = data[key];
    if (callback && !isFunction(callback)) {
      console.error(
        `InstallFPE:Error ${key} should be a function that return async function`,
      );
    }
  }
}

function validateCustomRoutes(routes: any) {
  if (routes && !Array.isArray(routes)) {
    console.error(`InstallFPE:Error customRoutes should be an array`);
  }
}

function validateAppRoot(data: any) {
  if (data && !isComponent(data)) {
    console.error(`InstallFPE:Error appRoot should be a react component`);
  }
}

function validatei18n(data: any) {
  if (data) {
    if (!Array.isArray(data)) {
      console.error(`InstallFPE:Error i18n should be an array`);
    } else {
      data.map((item) => {
        const langData = item.data;
        for (const key in langData) {
          const value = langData[key];
          if (value) {
            if (!(isString(value) || isFunction(value))) {
              console.error(
                `InstallFPE:Error ${item.locale} ${key} should be a string or function`,
              );
            }
          }
        }
      });
    }
  }
}
export const installFPE = (config: FpeApiInterface) => {
  //validating the components
  config?.components && validateComponents(config.components);

  //validating the custom routes
  config?.customRoutes && validateCustomRoutes(config.customRoutes);

  //validating the app root
  config?.appRoot && validateAppRoot(config.appRoot);

  //validating the i18n
  config?.i18n && validatei18n(config.i18n);

  //validating the lifecycle
  config?.lifecycle && validateLifecycle(config?.lifecycle);

  return config;
};