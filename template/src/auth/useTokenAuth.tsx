import React, {useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwt_decode from 'jwt-decode';
import StorageContext from '../components/StorageContext';
import SdkEvents from '../utils/SdkEvents';
import isSDK from '../utils/isSDK';
const REFRESH_TOKEN_DURATION_IN_SEC = 59;

const useTokenAuth = () => {
  const {setStore} = useContext(StorageContext);
  const [serverToken, setServerToken] = React.useState(null);
  const [tokenExpiresAt, setTokenExpiresAt] = React.useState(0);

  const storeToken = (token: string) => {
    setStore && setStore((store) => ({...store, token}));
    //updated the sdk token in localstorage if appbuilder refreshed then will get the refreshed token
    AsyncStorage.setItem('SDK_TOKEN', token);
    setServerToken(token);
  };

  const validateToken = (token: string) => {
    if (token && token.trim() !== '') {
      const decoded = jwt_decode(token);
      const expiresAt = decoded?.exp * 1000;
      if (Date.now() >= expiresAt) {
        if (isSDK()) {
          SdkEvents.emit('did-token-expire');
        }
        throw 'Token expired. Pass a new token';
      }
    } else {
      if (isSDK()) {
        SdkEvents.emit('token-not-found');
      }
      throw 'Token is missing in the options';
    }
    return true;
  };

  const getRefreshToken = async () => {
    await fetch(`${$config.BACKEND_ENDPOINT}/v1/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: serverToken ? `Bearer ${serverToken}` : '',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.token) {
          storeToken(data.token);
        }
      });
  };

  useEffect(() => {
    if (!tokenExpiresAt) return;

    const timer = setInterval(() => {
      const diffInSeconds = Math.floor(
        Math.abs(tokenExpiresAt - Date.now()) / 1000,
      );
      // const minutesLeft = Math.floor(diffInSeconds / 60) % 60;
      // const secondsLeft = (diffInSeconds - minutes * 60) % 60;

      if (diffInSeconds < REFRESH_TOKEN_DURATION_IN_SEC) {
        try {
          if (isSDK()) {
            SdkEvents.emit('will-token-expire');
          }
          getRefreshToken();
          clearInterval(timer);
        } catch (error) {
          clearInterval(timer);
        }
      }
      if (diffInSeconds < 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [tokenExpiresAt]);

  useEffect(() => {
    const syncToken = async () => {
      if (!serverToken) return;
      const decoded = jwt_decode(serverToken);
      const expiresAt = decoded?.exp * 1000;
      if (Date.now() >= expiresAt) {
        if (isSDK()) {
          SdkEvents.emit('did-token-expire');
        }
        throw 'Token expired. Pass a new token';
      } else {
        setTokenExpiresAt(expiresAt);
      }
    };
    syncToken();
  }, [serverToken]);

  const enableTokenAuth = async (tokenparam?: string) => {
    return new Promise(async (resolve, reject) => {
      let token = '';
      try {
        if (tokenparam) {
          token = tokenparam;
        } else {
          token = await AsyncStorage.getItem('SDK_TOKEN');
        }
        if (token) {
          if (validateToken(token)) {
            storeToken(token);
            resolve(true);
          } else {
            if (isSDK()) {
              SdkEvents.emit('did-token-expire');
            }
            throw new Error('Token expired');
          }
        } else {
          if (isSDK()) {
            SdkEvents.emit('token-not-found');
          }
          throw new Error('Token not found');
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const tokenLogout = async (cookieLogout: boolean = false) => {
    const serverToken = await AsyncStorage.getItem('SDK_TOKEN');
    return new Promise((resolve, reject) => {
      try {
        fetch(
          `${$config.BACKEND_ENDPOINT}/v1/logout`,
          cookieLogout
            ? {credentials: 'include'}
            : {
                headers: {
                  authorization: serverToken ? `Bearer ${serverToken}` : '',
                },
              },
        )
          .then((response) => response.text())
          .then((_) => {
            resolve(true);
            storeToken(null);
          })
          .catch((_) => {
            reject(false);
          });
      } catch (error) {
        reject(false);
      }
    });
  };

  return {
    enableTokenAuth,
    tokenLogout,
  };
};

export default useTokenAuth;
