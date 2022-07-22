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
import React, {useState, useContext, useEffect, useRef} from 'react';
import RtmEngine, {RtmAttribute} from 'agora-react-native-rtm';
import {PropsContext, useLocalUid} from '../../agora-rn-uikit';
import ChatContext, {controlMessageEnum} from './ChatContext';
import {RtcContext} from '../../agora-rn-uikit';
import {messageSourceType, messageActionType} from './ChatContext';
import {Platform} from 'react-native';
import {backOff} from 'exponential-backoff';
import {useString} from '../utils/useString';
import {isAndroid, isWeb} from '../utils/common';
import StorageContext from './StorageContext';
import {useRenderContext} from 'fpe-api';
import {useScreenContext} from './contexts/ScreenShareContext';
import {safeJsonParse, timeNow} from '../rtm/utils';
import {messageType} from '../rtm/types';
import EventUtils from '../custom-events/EventUtils';
import EventAttributes from '../custom-events/EventAttributes';
import RTMEngine from '../rtm/RTMEngine';
import {filterObject} from '../utils';
import {hasJsonStructure} from '../rtm/utils';

const adjustUID = (number: number) => {
  if (number < 0) {
    number = 0xffffffff + number + 1;
  }
  return number;
};

const stringifyPayload = (
  source: messageSourceType,
  type: messageActionType,
  msg: string,
) => {
  return JSON.stringify({
    source,
    type,
    msg,
  });
};

const parsePayload = (data: string) => {
  return JSON.parse(data);
};

const RtmConfigure = (props: any) => {
  const localUid = useLocalUid();
  const {callActive} = props;
  const {rtcProps} = useContext(PropsContext);
  const {RtcEngine, dispatch} = useContext(RtcContext);
  const {renderList, renderPosition} = useRenderContext();
  const renderListRef = useRef({renderList: renderList});
  const renderPositionRef = useRef({renderPosition: renderPosition});

  /**
   * inside event callback state won't have latest value.
   * so creating ref to access the state
   */
  useEffect(() => {
    renderPositionRef.current.renderPosition = renderPosition;
  }, [renderPosition]);

  useEffect(() => {
    renderListRef.current.renderList = renderList;
  }, [renderList]);

  const {setScreenShareData, screenShareData} = useScreenContext();

  const {store, setStore} = useContext(StorageContext);
  const getInitialUsername = () =>
    store?.displayName ? store.displayName : '';
  const [displayName, setDisplayName] = useState(getInitialUsername());

  const [login, setLogin] = useState<boolean>(false);

  const [hasUserJoinedRTM, setHasUserJoinedRTM] = useState<boolean>(false);
  const [onlineUsersCount, setTotalOnlineUsers] = useState<number>(0);

  const userText = useString('remoteUserDefaultLabel')();
  const pstnUserLabel = useString('pstnUserLabel')();
  const getScreenShareName = useString('screenshareUserName');

  let engine = useRef<RtmEngine>(null!);
  const timerValueRef: any = useRef(5);

  React.useEffect(() => {
    setTotalOnlineUsers(
      Object.keys(
        filterObject(renderList, ([k, v]) => v?.type === 'rtc' && !v.offline),
      ).length,
    );
  }, [renderList]);

  useEffect(() => {
    // Update the username in localstorage when username changes
    if (setStore) {
      setStore((prevState) => {
        return {
          ...prevState,
          token: store?.token || null,
          displayName: displayName,
        };
      });
    }
    if (callActive) {
      broadcastUserAttributes(
        [
          {
            key: 'name',
            value: displayName,
          },
        ],
        controlMessageEnum.userNameChanged,
      );
    }
  }, [displayName]);

  React.useEffect(() => {
    const handBrowserClose = () => {
      engine.current.leaveChannel(rtcProps.channel);
    };

    if (!isWeb) return;
    window.addEventListener('beforeunload', handBrowserClose);
    // cleanup this component
    return () => {
      window.removeEventListener('beforeunload', handBrowserClose);
    };
  }, []);

  const doLoginAndSetupRTM = async () => {
    try {
      await engine.current.login({
        uid: localUid.toString(),
        token: rtcProps.rtm,
      });
      timerValueRef.current = 5;
      setAttribute();
    } catch (error) {
      setTimeout(async () => {
        timerValueRef.current = timerValueRef.current + timerValueRef.current;
        doLoginAndSetupRTM();
      }, timerValueRef.current * 1000);
    }
  };

  const setAttribute = async () => {
    const rtmAttributes = [
      {key: 'name', value: displayName || userText},
      {key: 'screenUid', value: String(rtcProps.screenShareUid)},
    ];
    try {
      await engine.current.setLocalUserAttributes(rtmAttributes);
      rtmAttributes.forEach((attr: RtmAttribute) => {
        EventAttributes.set(localUid.toString(), {
          key: attr.key,
          value: attr.value,
        });
      });
      timerValueRef.current = 5;
      joinChannel();
    } catch (error) {
      setTimeout(async () => {
        timerValueRef.current = timerValueRef.current + timerValueRef.current;
        setAttribute();
      }, timerValueRef.current * 1000);
    }
  };

  const addOrUpdateLocalUserAttributes = async (attributes: RtmAttribute[]) => {
    try {
      await engine.current.addOrUpdateLocalUserAttributes(attributes);
    } catch (error) {
      console.log('error while local user addOrUpdateAttributes: ', error);
    }
  };

  const joinChannel = async () => {
    try {
      await engine.current.joinChannel(rtcProps.channel);
      timerValueRef.current = 5;
      await getMembers();
      setHasUserJoinedRTM(true);
    } catch (error) {
      setTimeout(async () => {
        timerValueRef.current = timerValueRef.current + timerValueRef.current;
        joinChannel();
      }, timerValueRef.current * 1000);
    }
  };

  const updateRenderListState = (uid: number, data: any) => {
    dispatch({type: 'UpdateRenderList', value: [uid, data]});
  };

  const getMembers = async () => {
    try {
      await engine.current
        .getChannelMembersBychannelId(rtcProps.channel)
        .then((data) => {
          data.members.map(async (member: any) => {
            const backoffAttributes = backOff(
              async () => {
                const attr = await engine.current.getUserAttributesByUid(
                  member.uid,
                );
                for (const key in attr.attributes) {
                  if (attr.attributes.hasOwnProperty(key)) {
                    return attr;
                  } else {
                    throw attr;
                  }
                }
              },
              {
                retry: (e, idx) => {
                  console.log(
                    `[retrying] Attempt ${idx}. Fetching ${member.uid}'s name`,
                    e,
                  );
                  return true;
                },
              },
            );
            try {
              const attr = await backoffAttributes;
              console.log('[user attributes]:', {attr});
              const uid = parseInt(member.uid);
              const screenUid = parseInt(attr?.attributes?.screenUid);
              //start - updating user data in rtc
              const userData = {
                name:
                  String(member.uid)[0] === '1'
                    ? pstnUserLabel
                    : attr?.attributes?.name || userText,
                screenUid: screenUid,
                //below thing for livestreaming
                type: 'rtc',
              };
              updateRenderListState(uid, userData);
              //end- updating user data in rtc

              //start - updating screenshare data in rtc
              const screenShareData = {
                name: getScreenShareName(attr?.attributes?.name || userText),
                //below thing for livestreaming
                type: 'screenshare',
              };
              updateRenderListState(screenUid, screenShareData);
              //end - updating screenshare data in rtc
              //setting screenshare data
              setScreenShareData((prevState) => {
                return {
                  ...prevState,
                  [screenUid]: {
                    name: getScreenShareName(
                      attr?.attributes?.name || userText,
                    ),
                    isActive: renderPositionRef.current.renderPosition.filter(
                      (i) => i === screenUid,
                    ).length
                      ? true
                      : false,
                  },
                };
              });
              for (const [key, value] of Object.entries(attr?.attributes)) {
                EventAttributes.set(member.uid, {
                  key,
                  value: value as string,
                });
                if (hasJsonStructure(value as string)) {
                  const [err, result] = safeJsonParse(value as string);
                  const payloadValue = result?.value || '';
                  const payloadAction = result?.action || '';
                  const data = {
                    evt: key,
                    payload: {
                      ...result,
                      value: payloadValue,
                      action: payloadAction,
                    },
                  };
                  customEventDispatcher(data, member.uid, timeNow());
                }
              }
            } catch (e) {
              console.error(`Could not retrieve name of ${member.uid}`, e);
            }
          });
          setLogin(true);
          console.log('RTM init done');
        });
      timerValueRef.current = 5;
    } catch (error) {
      setTimeout(async () => {
        timerValueRef.current = timerValueRef.current + timerValueRef.current;
        getMembers();
      }, timerValueRef.current * 1000);
    }
  };

  const init = async () => {
    engine.current = RTMEngine.getInstance().engine;
    RTMEngine.getInstance().setLoginInfo(localUid.toString(), rtcProps.channel);

    engine.current.on('connectionStateChanged', (evt: any) => {
      //console.log(evt);
    });
    engine.current.on('error', (evt: any) => {
      // console.log(evt);
    });
    engine.current.on('channelMemberJoined', (data: any) => {
      const backoffAttributes = backOff(
        async () => {
          const attr = await engine.current.getUserAttributesByUid(data.uid);
          for (const key in attr.attributes) {
            if (attr.attributes.hasOwnProperty(key)) {
              return attr;
            } else {
              throw attr;
            }
          }
        },
        {
          retry: (e, idx) => {
            console.log(
              `[retrying] Attempt ${idx}. Fetching ${data.uid}'s name`,
              e,
            );
            return true;
          },
        },
      );
      async function getname() {
        try {
          const attr = await backoffAttributes;
          console.log('[user attributes]:', {attr});
          const uid = parseInt(data.uid);
          const screenUid = parseInt(attr?.attributes?.screenUid);
          //start - updating user data in rtc
          const userData = {
            name:
              String(data.uid)[0] === '1'
                ? pstnUserLabel
                : attr?.attributes?.name || userText,
            screenUid: screenUid,
            //below thing for livestreaming
            type: 'rtc',
          };
          updateRenderListState(uid, userData);
          //start - updating user data in rtc
          //setting screenshare data
          setScreenShareData((prevState) => {
            return {
              ...prevState,
              [screenUid]: {
                name: getScreenShareName(attr?.attributes?.name || userText),
                isActive: false,
              },
            };
          });
          for (const [key, value] of Object.entries(attr?.attributes)) {
            EventAttributes.set(data.uid, {
              key,
              value: value as string,
            });
          }
        } catch (e) {
          console.error(`Could not retrieve name of ${data.uid}`, e);
        }
      }
      getname();
    });

    engine.current.on('channelMemberLeft', (data: any) => {
      console.log('user left', data);
      // Chat of left user becomes undefined. So don't cleanup
      const uid = data?.uid ? parseInt(data?.uid) : undefined;
      if (!uid) return;
      //updating the rtc data
      updateRenderListState(uid, {
        offline: true,
      });
    });

    engine.current.on('messageReceived', (evt: any) => {
      const {peerId, ts, text} = evt;
      const textObj = parsePayload(text);
      const {type, msg} = textObj;

      let arr = new Int32Array(1);
      arr[0] = parseInt(peerId);

      const timestamp = timeNow();

      const sender = isAndroid ? arr[0] : peerId;

      if (type === messageActionType.Control) {
        switch (msg) {
          case controlMessageEnum.muteVideo:
            RtcEngine.muteLocalVideoStream(true);
            dispatch({
              type: 'LocalMuteVideo',
              value: [0],
            });
            break;
          case controlMessageEnum.muteAudio:
            RtcEngine.muteLocalAudioStream(true);
            dispatch({
              type: 'LocalMuteAudio',
              value: [0],
            });
            break;
          case controlMessageEnum.kickUser:
            dispatch({
              type: 'EndCall',
              value: [],
            });
            break;
          default:
            break;
        }
      } else if (type === messageType.CUSTOM_EVENT) {
        console.log('CUSTOM_EVENT_API: inside custom event type ', evt);
        try {
          customEventDispatcher(msg, sender, timestamp);
        } catch (error) {
          console.log('error while dispacthing', error);
        }
      }
    });

    engine.current.on('channelMessageReceived', (evt) => {
      const {uid, channelId, text, ts} = evt;
      const textObj = parsePayload(text);
      const [err, result] = safeJsonParse(text);
      const {type, msg} = textObj;
      let arr = new Int32Array(1);
      arr[0] = parseInt(uid);

      const sender = Platform.OS ? arr[0] : uid;
      const timestamp = ts ? (parseInt(ts) === 0 ? timeNow() : ts) : timeNow();

      if (channelId === rtcProps.channel) {
        if (
          type === messageType.CONTROL_GROUP ||
          type === messageActionType.Control
        ) {
          let actionMsg = '';
          if (hasJsonStructure(msg)) {
            const [err, result] = safeJsonParse(msg);
            if (!err) {
              const {action} = result;
              actionMsg = action;
            }
          } else {
            actionMsg = msg;
          }
          switch (actionMsg) {
            case controlMessageEnum.muteVideo:
              RtcEngine.muteLocalVideoStream(true);
              dispatch({
                type: 'LocalMuteVideo',
                value: [0],
              });
              break;
            case controlMessageEnum.muteAudio:
              RtcEngine.muteLocalAudioStream(true);
              dispatch({
                type: 'LocalMuteAudio',
                value: [0],
              });
              break;
            case controlMessageEnum.userNameChanged:
              const {payload: payloadData} = JSON.parse(msg);
              if (payloadData && payloadData.name) {
                const uidNumber = parseInt(uid);
                updateRenderListState(uidNumber, {name: payloadData.name});
                setScreenShareData((prevState) => {
                  return {
                    ...prevState,
                    [renderListRef.current.renderList[uidNumber].screenUid]: {
                      ...prevState[
                        renderListRef.current.renderList[uidNumber].screenUid
                      ],
                      name: getScreenShareName(payloadData.name || userText),
                    },
                  };
                });
              }
              break;
            default:
              break;
            //   throw new Error('Unsupported message type');
          }
        } else if (type === messageType.CUSTOM_EVENT) {
          console.log('CUSTOM_EVENT_API: inside custom event type ', evt);
          try {
            customEventDispatcher(msg, sender, timestamp);
          } catch (error) {
            console.log('error while dispacthing', error);
          }
        }
      }
    });

    doLoginAndSetupRTM();
  };

  const customEventDispatcher = async (
    data: {
      evt: string;
      payload: {
        level: 1 | 2 | 3;
        action: string;
        value: string;
      };
    },
    sender: string,
    ts: number,
  ) => {
    console.log('CUSTOM_EVENT_API: inside customEventDispatcher ', data);
    const {evt, payload} = data;
    // Step 1: Set local attributes
    if (payload?.level === 3) {
      const rtmAttribute = {key: evt, value: JSON.stringify(data.payload)};
      await engine.current.addOrUpdateLocalUserAttributes([rtmAttribute]);
      EventAttributes.set(localUid.toString(), rtmAttribute);
    }
    // Step 2: Emit the event
    try {
      console.log('CUSTOM_EVENT_API:  emiting event: ');
      EventUtils.emit(evt, {payload, sender, ts});
    } catch (error) {
      console.log('CUSTOM_EVENT_API: error while emiting event: ', error);
    }
  };

  const sendMessage = async (msg: string) => {
    if (msg.trim() === '') return;
    const text = stringifyPayload(
      messageSourceType.Core,
      messageActionType.Normal,
      msg,
    );
    await (engine.current as RtmEngine).sendMessageByChannelId(
      rtcProps.channel,
      text,
    );
  };

  const sendMessageToUid = async (msg: string, uid: number) => {
    if (msg.trim() === '') return;
    let adjustedUID = uid;
    if (adjustedUID < 0) {
      adjustedUID = adjustUID(uid);
    }
    const text = stringifyPayload(
      messageSourceType.Core,
      messageActionType.Normal,
      msg,
    );
    await (engine.current as RtmEngine).sendMessageToPeer({
      peerId: adjustedUID.toString(),
      offline: false,
      text,
    });
  };

  const sendControlMessage = async (msg: string) => {
    const text = stringifyPayload(
      messageSourceType.Core,
      messageActionType.Control,
      msg,
    );
    await (engine.current as RtmEngine).sendMessageByChannelId(
      rtcProps.channel,
      text,
    );
  };

  const sendControlMessageToUid = async (msg: string, uid: number) => {
    if (uid < 0) {
      uid = adjustUID(uid);
    }
    const text = stringifyPayload(
      messageSourceType.Core,
      messageActionType.Control,
      msg,
    );
    await (engine.current as RtmEngine).sendMessageToPeer({
      peerId: uid.toString(),
      offline: false,
      text,
    });
  };

  const end = async () => {
    callActive
      ? (await (engine.current as RtmEngine).logout(),
        await (engine.current as RtmEngine).destroyClient(),
        // setLogin(false),
        console.log('RTM cleanup done'))
      : {};
  };

  useEffect(() => {
    callActive ? init() : (console.log('waiting to init RTM'), setLogin(true));
    return () => {
      end();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rtcProps.channel, rtcProps.appId, callActive]);

  const broadcastUserAttributes = async (
    attributes: RtmAttribute[],
    ctrlMsg: controlMessageEnum,
  ) => {
    // 1. Update my attributes in attribute-list
    await addOrUpdateLocalUserAttributes(attributes);

    let formattedAttributes: any = {};
    // Transform the array into object of key value pair
    attributes.map((attribute) => {
      let key = Object.values(attribute)[0];
      let value = Object.values(attribute)[1];
      formattedAttributes[key] = value;
    });
    // 2. Update my attributes in rtm and screenshare and livestream
    if ('name' in formattedAttributes) {
      updateRenderListState(localUid, {name: formattedAttributes['name']});
      setScreenShareData((prevState) => {
        return {
          ...prevState,
          [renderListRef.current.renderList[localUid].screenUid]: {
            ...prevState[renderListRef.current.renderList[localUid].screenUid],
            name: getScreenShareName(formattedAttributes['name'] || userText),
          },
        };
      });
    }
    /**
     * 3. Broadcast my updated attributes to everyone
     * send payload and control message as string
     */
    const msgAsString = JSON.stringify({
      action: ctrlMsg,
      payload: {...formattedAttributes},
    });
    sendControlMessage(msgAsString);
  };

  return (
    <ChatContext.Provider
      value={{
        hasUserJoinedRTM,
        sendControlMessage,
        sendControlMessageToUid,
        sendMessage,
        sendMessageToUid,
        broadcastUserAttributes,
        engine: engine.current,
        localUid: localUid,
        onlineUsersCount,
        setDisplayName,
        displayName,
      }}>
      {login ? props.children : <></>}
    </ChatContext.Provider>
  );
};

export default RtmConfigure;
