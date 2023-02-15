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
import React, {createContext, ReactChildren, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // '@react-native-community/async-storage';
import useMount from './useMount';

type rememberedDevicesListEntries = Record<
  string,
  'switch-on-connect' | 'ignore-on-connect'
>;

export interface StoreInterface {
  token: string;
  displayName: string;
  selectedLanguageCode: string;
  rememberedDevicesList: Record<
    MediaDeviceInfo['kind'],
    rememberedDevicesListEntries
  >;
  activeDeviceId: Record<MediaDeviceInfo['kind'], string>;
}

export interface StorageContextInterface {
  store: StoreInterface;
  setStore: React.Dispatch<React.SetStateAction<StoreInterface>> | null;
}

export const initStoreValue: StoreInterface = {
  token: null,
  displayName: '',
  selectedLanguageCode: '',
  rememberedDevicesList: {
    audioinput: {},
    audiooutput: {},
    videoinput: {},
  },
  activeDeviceId: {
    audioinput: '',
    audiooutput: '',
    videoinput: '',
  },
};

const initStorageContextValue = {
  store: initStoreValue,
  setStore: null,
};

const StorageContext = createContext<StorageContextInterface>(
  initStorageContextValue,
);

export default StorageContext;

export const StorageConsumer = StorageContext.Consumer;

export const StorageProvider = (props: {children: React.ReactNode}) => {
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<StoreInterface>(initStoreValue);

  // Initialize and hydrate store
  useMount(() => {
    const hydrateStore = async () => {
      try {
        const storeString = await AsyncStorage.getItem('store');
        if (storeString === null) {
          await AsyncStorage.setItem('store', JSON.stringify(initStoreValue));
          setReady(true);
        } else {
          const storeFromStorage = JSON.parse(storeString);
          Object.keys(initStoreValue).forEach((key) => {
            if (!storeFromStorage[key])
              storeFromStorage[key] = initStoreValue[key];
          });
          setStore(storeFromStorage);
          setReady(true);
        }
        console.log('store hydrated', storeString);
        setReady(true);
      } catch (e) {
        console.error('problem hydrating store', e);
      }
    };
    hydrateStore();
  });

  // Sync store with the context
  useEffect(() => {
    const syncStore = async () => {
      try {
        await AsyncStorage.setItem('store', JSON.stringify(store));
        console.log('store synced with value', store);
      } catch (e) {
        console.log('problem syncing the store', e);
      }
    };
    ready && syncStore();
  }, [store, ready]);
  return (
    <StorageContext.Provider value={{store, setStore}}>
      {ready ? props.children : <></>}
    </StorageContext.Provider>
  );
};
