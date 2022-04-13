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
import React, {useState, useContext} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
// import ColorContext from './ColorContext';
import {useHistory} from './Router';
import Clipboard from '../subComponents/Clipboard';
// import Illustration from '../subComponents/Illustration';
import platform from '../subComponents/Platform';
import PrimaryButton from '../atoms/PrimaryButton';
import SecondaryButton from '../atoms/SecondaryButton';
import icons from '../assets/icons';
import Toast from '../../react-native-toast-message';
import {BtnTemplate} from '../../agora-rn-uikit';
import styles from './styles';
import {useShareLink} from '../pages/ShareLink';
import {useString} from '../utils/useString';
import {MeetingInviteInterface} from 'src/language/default-labels/videoCallScreenLabels';

const Share = () => {
  const history = useHistory();
  const {urlView, urlHost, pstn, joinPhrase, roomTitle, hostControlCheckbox} =
    useShareLink((data) => data);
  const copiedToClipboardText = useString(
    'copiedToClipboardNotificationLabel',
  )();
  const meetingInviteText =
    useString<MeetingInviteInterface>('meetingInviteText');
  const meetingUrlText = useString('meetingUrlLabel')();
  const PSTNNumberText = useString('PSTNNumber')();
  const PSTNPinText = useString('PSTNPin')();
  const meetingIdText = useString('meetingIdLabel')();
  const hostIdText = useString('hostIdLabel')();
  // const {primaryColor} = useContext(ColorContext);
  // const pstn = {number: '+1 206 656 1157', dtmf: '2342'}
  const enterMeeting = () => {
    if (urlHost) {
      history.push(`/${joinPhrase}`);
    }
  };

  const copyToClipboard = () => {
    Toast.show({text1: copiedToClipboardText, visibilityTime: 1000});
    let stringToCopy = meetingInviteText({
      frontendEndpoint: $config.FRONTEND_ENDPOINT,
      hostControlCheckbox,
      platform,
      meetingName: roomTitle,
      url: {
        attendee: urlView,
        host: urlHost,
      },
      id: {
        attendee: urlView,
        host: urlHost,
      },
      pstn: pstn
        ? {
            number: pstn.number,
            pin: pstn.dtmf,
          }
        : undefined,
    });
    Clipboard.setString(stringToCopy);
  };

  const copyHostUrl = () => {
    Toast.show({text1: copiedToClipboardText, visibilityTime: 1000});
    let stringToCopy = '';
    $config.FRONTEND_ENDPOINT
      ? (stringToCopy += `${$config.FRONTEND_ENDPOINT}/${urlHost}`)
      : platform === 'web'
      ? (stringToCopy += `${window.location.origin}/${urlHost}`)
      : (stringToCopy += `${meetingIdText}: ${urlHost}`);
    Clipboard.setString(stringToCopy);
  };

  const copyAttendeeURL = () => {
    Toast.show({text1: copiedToClipboardText, visibilityTime: 1000});
    let stringToCopy = '';
    $config.FRONTEND_ENDPOINT
      ? (stringToCopy += `${$config.FRONTEND_ENDPOINT}/${urlView}`)
      : platform === 'web'
      ? (stringToCopy += `${window.location.origin}/${urlView}`)
      : (stringToCopy += `${meetingIdText}: ${urlView}`);
    Clipboard.setString(stringToCopy);
  };

  const copyPstn = () => {
    Toast.show({text1: copiedToClipboardText, visibilityTime: 1000});
    let stringToCopy = `${PSTNNumberText}: ${pstn?.number} ${PSTNPinText}: ${pstn?.dtmf}`;
    Clipboard.setString(stringToCopy);
  };

  const [dim, setDim] = useState([
    Dimensions.get('window').width,
    Dimensions.get('window').height,
    Dimensions.get('window').width > Dimensions.get('window').height,
  ]);
  let onLayout = (e: any) => {
    setDim([e.nativeEvent.layout.width, e.nativeEvent.layout.height]);
  };

  return (
    <View style={style.content} onLayout={onLayout}>
      <View style={style.leftContent}>
        <View>
          <Text style={style.heading}>{$config.APP_NAME}</Text>
          <Text style={style.headline}>{$config.LANDING_SUB_HEADING}</Text>
        </View>
        {hostControlCheckbox ? (
          <View style={style.urlContainer}>
            <View style={{width: '80%'}}>
              <Text style={style.urlTitle}>
                {$config.FRONTEND_ENDPOINT || platform === 'web'
                  ? useString('attendeeUrlLabel')()
                  : useString('attendeeIdLabel')()}
              </Text>
              <View style={style.urlHolder}>
                <Text
                  style={[
                    style.url,
                    Platform.OS === 'web' ? urlWeb : {opacity: 1},
                  ]}>
                  {$config.FRONTEND_ENDPOINT
                    ? `${$config.FRONTEND_ENDPOINT}/${urlView}`
                    : platform === 'web'
                    ? `${window.location.origin}/${urlView}`
                    : urlView}
                </Text>
              </View>
            </View>
            <View
              style={{
                marginLeft: 'auto',
                flexDirection: 'row',
                alignSelf: 'center',
              }}>
              <View
                style={{
                  backgroundColor: $config.PRIMARY_COLOR + '80',
                  width: 1,
                  height: 'auto',
                  marginRight: 15,
                }}
              />
              <View style={style.clipboardIconHolder}>
                <BtnTemplate
                  style={style.clipboardIcon}
                  color={$config.PRIMARY_COLOR}
                  name={'clipboard'}
                  onPress={() => copyAttendeeURL()}
                />
              </View>
            </View>
          </View>
        ) : (
          <></>
        )}
        <View style={style.urlContainer}>
          <View style={{width: '80%'}}>
            <Text style={style.urlTitle}>
              {$config.FRONTEND_ENDPOINT || platform === 'web'
                ? hostControlCheckbox
                  ? useString('hostUrlLabel')()
                  : meetingUrlText
                : hostControlCheckbox
                ? hostIdText
                : meetingIdText}
            </Text>
            <View style={style.urlHolder}>
              <Text
                style={[
                  style.url,
                  Platform.OS === 'web' ? urlWeb : {opacity: 1},
                ]}>
                {$config.FRONTEND_ENDPOINT
                  ? `${$config.FRONTEND_ENDPOINT}/${urlHost}`
                  : platform === 'web'
                  ? `${window.location.origin}/${urlHost}`
                  : urlHost}
              </Text>
            </View>
          </View>
          <View
            style={{
              marginLeft: 'auto',
              flexDirection: 'row',
              alignSelf: 'center',
            }}>
            <View
              style={{
                backgroundColor: $config.PRIMARY_COLOR + '80',
                width: 1,
                height: 'auto',
                marginRight: 15,
              }}
            />
            <View style={style.clipboardIconHolder}>
              <BtnTemplate
                style={style.clipboardIcon}
                color={$config.PRIMARY_COLOR}
                name={'clipboard'}
                onPress={() => copyHostUrl()}
              />
            </View>
          </View>
        </View>
        {pstn ? (
          <View style={style.urlContainer}>
            <View style={{width: '80%'}}>
              <Text style={style.urlTitle}>{useString('pstnLabel')()}</Text>
              <View>
                <View style={style.pstnHolder}>
                  <Text style={style.urlTitle}>
                    {useString('pstnNumberLabel')()}:{' '}
                  </Text>
                  <Text
                    style={[
                      style.url,
                      Platform.OS === 'web' ? urlWeb : {opacity: 1},
                    ]}>
                    {pstn?.number}
                  </Text>
                </View>
                <View style={style.pstnHolder}>
                  <Text style={style.urlTitle}>{useString('pin')()}: </Text>
                  <Text
                    style={[
                      style.url,
                      Platform.OS === 'web' ? urlWeb : {opacity: 1},
                    ]}>
                    {pstn?.dtmf}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{marginLeft: 'auto', flexDirection: 'row'}}>
              <View
                style={{
                  backgroundColor: $config.PRIMARY_COLOR + '80',
                  width: 1,
                  height: 'auto',
                  marginRight: 15,
                }}
              />
              <View style={style.clipboardIconHolder}>
                <BtnTemplate
                  style={style.clipboardIcon}
                  color={$config.PRIMARY_COLOR}
                  name={'clipboard'}
                  onPress={() => copyPstn()}
                />
              </View>
            </View>
          </View>
        ) : (
          <></>
        )}
        <PrimaryButton
          onPress={() => enterMeeting()}
          text={useString('enterMeetingAfterCreateButton')()}
        />
        <View style={{height: 10}} />
        <SecondaryButton
          onPress={() => copyToClipboard()}
          text={useString('copyInvite')()}
        />
      </View>
      {/* {dim[0] > dim[1] + 150 ? (
        <View style={style.full}>
          <Illustration />
        </View>
      ) : (
        <></>
      )} */}
    </View>
  );
};
const urlWeb = {wordBreak: 'break-all'};

const style = StyleSheet.create({
  full: {flex: 1},
  main: {
    flex: 2,
    justifyContent: 'space-evenly',
    marginHorizontal: '8%',
    marginVertical: '2%',
  },
  content: {flex: 6, flexDirection: 'row'},
  leftContent: {
    width: '100%',
    flex: 1,
    justifyContent: 'space-evenly',
    marginBottom: '12%',
    marginTop: '2%',
    // marginRight: '5%',
    marginHorizontal: 'auto',
    alignItems: 'center',
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: $config.PRIMARY_FONT_COLOR,
    marginBottom: 20,
  },
  headline: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    color: $config.PRIMARY_FONT_COLOR,
    marginBottom: 20,
  },
  inputs: {
    flex: 1,
    width: '100%',
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  checkboxHolder: {
    marginVertical: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxTitle: {
    color: $config.PRIMARY_FONT_COLOR,
    paddingHorizontal: 5,
    fontWeight: '700',
  },
  checkboxCaption: {color: '#333', paddingHorizontal: 5},
  checkboxTextHolder: {
    marginVertical: 0, //check if 5
    flexDirection: 'column',
  },
  urlContainer: {
    backgroundColor: $config.PRIMARY_COLOR + '22',
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    width: '100%',
    // minWidth: ''
    maxWidth: 700,
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  urlTitle: {
    color: $config.PRIMARY_FONT_COLOR,
    fontSize: 18,
    fontWeight: '700',
  },
  pstnHolder: {
    width: '100%',
    // paddingHorizontal: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 10,
  },
  urlHolder: {
    width: '100%',
    // paddingHorizontal: 10,
    // marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'center',
    // maxWidth: 600,
    minHeight: 30,
  },
  url: {
    color: $config.PRIMARY_FONT_COLOR,
    fontSize: 18,
    // textDecorationLine: 'underline',
  },
  // pstnHolder: {
  //   flexDirection: 'row',
  //   width: '80%',
  // },
  pstnMargin: {
    marginRight: '10%',
  },
  clipboardIconHolder: {
    width: 40,
    height: 40,
    marginVertical: 'auto',
  },
  clipboardIcon: {
    width: 40,
    height: 40,
    marginVertical: 'auto',
    opacity: 0.5,
    backgroundColor: 'transparent',
  },
});

export default Share;
