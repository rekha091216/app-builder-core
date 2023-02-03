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
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {
  SHARE_LINK_CONTENT_TYPE,
  useShareLink,
} from '../../components/useShareLink';
import Popup from '../../atoms/Popup';
import Spacer from '../../atoms/Spacer';
import PrimaryButton from '../../atoms/PrimaryButton';
import TertiaryButton from '../../atoms/TertiaryButton';
import ThemeConfig from '../../theme';
import {CopyMeetingInfo} from '../../components/Share';
import {useIsDesktop} from '../../utils/common';
import {useVideoCall} from '../useVideoCall';

const InvitePopup = () => {
  const {setShowInvitePopup, showInvitePopup} = useVideoCall();
  const isDesktop = useIsDesktop()('popup');
  const {copyShareLinkToClipboard} = useShareLink();
  return (
    <Popup
      modalVisible={showInvitePopup}
      setModalVisible={setShowInvitePopup}
      title="Invite others to join this meeting"
      showCloseIcon={true}
      containerStyle={{alignItems: isDesktop ? 'center' : 'stretch'}}
      contentContainerStyle={style.contentContainer}>
      <CopyMeetingInfo showSubLabel={false} />
      <View style={isDesktop ? style.btnContainer : style.btnContainerMobile}>
        {isDesktop ? (
          <View style={{flex: 1}}>
            <TertiaryButton
              text={'CANCEL'}
              textStyle={style.btnText}
              containerStyle={{
                width: '100%',
                height: 48,
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: ThemeConfig.BorderRadius.medium,
              }}
              onPress={() => {
                setShowInvitePopup(false);
              }}
            />
          </View>
        ) : null}
        {isDesktop ? <Spacer size={10} horizontal={true} /> : <></>}
        <View style={{flex: 1}}>
          <PrimaryButton
            textStyle={style.btnText}
            containerStyle={{
              minWidth: 'auto',
              width: '100%',
              borderRadius: ThemeConfig.BorderRadius.medium,
              height: 48,
              paddingVertical: 12,
              paddingHorizontal: 12,
            }}
            onPress={() => {
              copyShareLinkToClipboard(SHARE_LINK_CONTENT_TYPE.MEETING_INVITE);
            }}
            text={'COPY INVITATION'}
          />
        </View>
      </View>
    </Popup>
  );
};

export default InvitePopup;

const style = StyleSheet.create({
  btnContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 48,
  },
  btnContainerMobile: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  btnText: {
    fontWeight: '600',
    fontSize: 16,
  },
  contentContainer: {
    padding: 24,
    minWidth: 342,
  },
});