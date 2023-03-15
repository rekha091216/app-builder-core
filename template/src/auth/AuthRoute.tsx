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
import React, {useEffect, useRef} from 'react';
import {Route, Redirect} from '../components/Router';
import Toast from '../../react-native-toast-message';
import type {RouteProps} from 'react-router';
import {useAuth} from './AuthProvider';
import isSDK from '../utils/isSDK';
import Loading from '../subComponents/Loading';

interface PrivateRouteProps extends RouteProps {
  children: React.ReactNode;
}

const AuthRoute: React.FC<PrivateRouteProps> = (props) => {
  const didMountRef = useRef(false);
  const {authenticated} = useAuth();

  useEffect(() => {
    if (!didMountRef.current) return;
    if (!authenticated) {
      Toast.show({
        type: 'error',
        text1: 'Authentication failed',
        visibilityTime: 1000,
      });
    }
    didMountRef.current = true;
  }, [authenticated]);

  //on SDK no fallback so even though authentication failed we will still show the routes
  //when user try to perform any operation it will get failed and throw regular error message
  if (isSDK()) {
    return <Route {...props} />;
  }

  return authenticated ? (
    <>
      <Route {...props} />
    </>
  ) : (
    <Loading text={'No Fallback..'} />
    // <Redirect
    //   to={{
    //     pathname: '/login',
    //   }}
    // />
  );
  // return (
  //   <Route
  //     {...props}
  //     render={({location}) => {
  //       return authenticated ? (
  //         props.children
  //       ) : (
  //         <Redirect
  //           to={{
  //             pathname: '/login',
  //             state: {
  //               from: location,
  //             },
  //           }}
  //         />
  //       );
  //     }}
  //   />
  // );
};

export default AuthRoute;
