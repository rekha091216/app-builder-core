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
import React, {useState} from 'react';
import {Platform} from 'react-native';
import KeyboardManager from 'react-native-keyboard-manager';
import AppWrapper from './AppWrapper';
import {
  MeetingInfoContextInterface,
  MeetingInfoDefaultValue,
  MeetingInfoProvider,
} from './components/meeting-info/useMeetingInfo';
import {SetMeetingInfoProvider} from './components/meeting-info/useSetMeetingInfo';
import {ShareLinkProvider} from './components/useShareLink';
import AppRoutes from './AppRoutes';

// hook can't be used in the outside react function calls. so directly checking the platform.
if (Platform.OS === 'ios') {
  KeyboardManager.setEnable(true);
  KeyboardManager.setEnableAutoToolbar(false);
  KeyboardManager.setShouldShowToolbarPlaceholder(false);
  KeyboardManager.setShouldResignOnTouchOutside(true);
}

//Extending the UI Kit Type defintion to add custom attribute to render interface
declare module 'agora-rn-uikit' {
  interface DefaultRenderInterface {
    name: string;
    screenUid: number;
    offline: boolean;
  }
  interface RtcPropsInterface {
    screenShareUid: number;
    screenShareToken?: string;
  }
}

const App: React.FC = () => {
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfoContextInterface>(
    MeetingInfoDefaultValue,
  );

  return (
    <AppWrapper>
      <SetMeetingInfoProvider value={{setMeetingInfo}}>
        <MeetingInfoProvider value={{...meetingInfo}}>
          <ShareLinkProvider>
            <AppRoutes />
          </ShareLinkProvider>
        </MeetingInfoProvider>
      </SetMeetingInfoProvider>
    </AppWrapper>
  );
};

export default App;
