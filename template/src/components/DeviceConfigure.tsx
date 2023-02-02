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
import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {ClientRole} from '../../agora-rn-uikit';
import DeviceContext from './DeviceContext';
import AgoraRTC from 'agora-rtc-sdk-ng';
import {useRtc} from 'customization-api';

import type RtcEngine from '../../bridge/rtc/webNg/';

const log = (...args) => {
  console.log('[DeviceConfigure] ', ...args);
};

type WebRtcEngineInstance = InstanceType<typeof RtcEngine>;

interface Props {
  userRole: ClientRole;
}
type deviceInfo = MediaDeviceInfo;
type deviceId = deviceInfo['deviceId'];
type deviceKind = deviceInfo['kind'];

const DeviceConfigure: React.FC<Props> = (props: any) => {
  const rtc = useRtc();
  const [selectedCam, setUiSelectedCam] = useState('');
  const [selectedMic, setUiSelectedMic] = useState('');
  const [selectedSpeaker, setUiSelectedSpeaker] = useState('');
  const [deviceList, setDeviceList] = useState<deviceInfo[]>([]);

  const {RtcEngine} = rtc as unknown as {RtcEngine: WebRtcEngineInstance};
  const {localStream} = RtcEngine;

  const refreshDeviceList = useCallback(async () => {
    let updatedDeviceList: MediaDeviceInfo[];
    await RtcEngine.getDevices(function (devices: deviceInfo[]) {
      log('Fetching all devices: ', devices);
      /**
       * Some browsers list the same microphone twice with different Id's,
       * their group Id's match as they are the same physical device.
       * deviceId == default is an oddity in chrome which stores the user
       * preference
       */
      /**
       *  1. Fetch devices and filter so the deviceId with empty
       *     values are exluded
       *  2. Store only unique devices with unique groupIds
       */

      updatedDeviceList = devices.filter(
        (device: deviceInfo) =>
          // device?.deviceId !== 'default' &&
          device?.deviceId !== '' &&
          (device.kind == 'audioinput' ||
            device.kind == 'videoinput' ||
            device.kind == 'audiooutput'),
      );

      log('Setting unique devices', updatedDeviceList);
      setDeviceList(updatedDeviceList);
    });

    return updatedDeviceList;
  }, []);

  const getAgoraTrackDeviceId = (type: 'audio' | 'video') => {
    const mutedState =
      //@ts-ignore
      type === 'audio' ? !RtcEngine.isAudioEnabled : !RtcEngine.isVideoEnabled;

    let currentDevice: string;

    if (mutedState) {
      currentDevice =
        //@ts-ignore
        type === 'audio' ? RtcEngine.audioDeviceId : RtcEngine.videoDeviceId;
      log(`Agora ${type} Engine is using`, currentDevice);
    } else {
      currentDevice = localStream[type]
        ?.getMediaStreamTrack()
        .getSettings().deviceId;
      log(`Agora ${type} Track is using`, currentDevice);
    }
    return currentDevice ?? '';
  };

  /**
   * Retrieves the devices being used by agora tracks and
   * updates the selected Ui states with them.
   * Ignores for audioOutput since state acts as ground
   * truth.
   */
  const syncSelectedDeviceUi = (kind?: deviceKind) => {
    log('Refreshing', kind ?? 'all');
    switch (kind) {
      case 'audioinput':
        setUiSelectedMic(getAgoraTrackDeviceId('audio'));
        break;
      case 'videoinput':
        setUiSelectedCam(getAgoraTrackDeviceId('video'));
        break;
      case 'audiooutput':
        break;
      default:
        setUiSelectedMic(getAgoraTrackDeviceId('audio'));
        setUiSelectedCam(getAgoraTrackDeviceId('video'));
    }
  };

  /**
   * Sets the devices to first item on the devices list
   * optionally takes device list to use that instead
   * of state which might be stale
   */
  const fallbackToFirstDevice = (
    kind: deviceKind,
    uniqueDevices?: MediaDeviceInfo[],
  ) => {
    const deviceListLocal = uniqueDevices || deviceList;
    switch (kind) {
      case 'audioinput':
        const audioInputFallbackDeviceId = deviceListLocal.find(
          (device) => device.kind === 'audioinput',
        )?.deviceId;
        setSelectedMic(audioInputFallbackDeviceId);
        break;
      case 'videoinput':
        const videoInputFallbackDeviceId = deviceListLocal.find(
          (device) => device.kind === 'videoinput',
        )?.deviceId;
        setSelectedCam(videoInputFallbackDeviceId);
        break;
      case 'audiooutput':
        const audioOutputFallbackDeviceId = deviceListLocal.find(
          (device) => device.kind === 'audiooutput',
        )?.deviceId;

        setSelectedSpeaker(audioOutputFallbackDeviceId);
        break;
    }
  };

  useEffect(() => {
    // Labels are empty in firefox when permission is granted first time
    // refresh device list if labels are empty

    // If stream exists and selected devices are empty, check for devices again
    if (!selectedCam || selectedCam.trim().length == 0) {
      log('useEffect[rtc]: Device list populated but No selected cam');
      syncSelectedDeviceUi('videoinput');
    }

    if (!selectedMic || selectedMic.trim().length == 0) {
      log('useEffect[rtc]: Device list populated but No selected mic');
      syncSelectedDeviceUi('audioinput');
    }

    if (!selectedSpeaker || selectedSpeaker.trim().length == 0) {
      log('useEffect[rtc]: Device list populated but No selected speaker');
      // Initializes ui with first speaker in device list
      setUiSelectedSpeaker(
        deviceList.find((device) => device.kind === 'audiooutput')?.deviceId,
      );
    }

    if (
      deviceList.length === 0 ||
      deviceList.find((device: MediaDeviceInfo) => device.label === '')
    ) {
      log('useEffect[rtc]: Empty device list');
      refreshDeviceList();
    }
  }, [rtc]);

  // Port this to useEffectEvent(https://beta.reactjs.org/reference/react/useEffectEvent) when
  // released
  useEffect(() => {
    AgoraRTC.onMicrophoneChanged = async (changedDevice) => {
      log(
        `mic: on-microphone-changed from ${selectedMic}`,
        changedDevice.device.label,
        changedDevice.state,
        changedDevice,
      );
      // Extracted because we want to perform fallback with the latest
      // device list, state update will be handled with next render
      const updatedDeviceList = await refreshDeviceList();
      if (
        changedDevice.device.deviceId === selectedMic &&
        changedDevice.state === 'INACTIVE'
      ) {
        fallbackToFirstDevice('audioinput', updatedDeviceList);
      }
      if (selectedMic === 'default') {
        setSelectedMic('default');
      }
    };
  }, [selectedMic]);

  useEffect(() => {
    AgoraRTC.onPlaybackDeviceChanged = async (changedDevice) => {
      log(
        `speaker: on-playback-changed from ${selectedSpeaker}`,
        changedDevice.device.label,
        changedDevice.state,
        changedDevice,
      );
      const updatedDeviceList = await refreshDeviceList();
      if (
        changedDevice.device.deviceId === selectedMic &&
        changedDevice.state === 'INACTIVE'
      ) {
        fallbackToFirstDevice('audiooutput', updatedDeviceList);
      }
      if (selectedMic === 'default') {
        setSelectedSpeaker('default');
      }
    };
  }, [selectedSpeaker]);

  useEffect(() => {
    AgoraRTC.onCameraChanged = async (changedDevice) => {
      log('cam: on-camera-changed');
      const updatedDeviceList = await refreshDeviceList();
      if (
        changedDevice.device.deviceId === selectedCam &&
        changedDevice.state === 'INACTIVE'
      ) {
        fallbackToFirstDevice('videoinput', updatedDeviceList);
      }
    };
  }, [selectedCam]);

  const setSelectedMic = (deviceId: deviceId) => {
    log('Setting mic to', deviceId);
    return new Promise((res, rej) => {
      RtcEngine.changeMic(
        deviceId,
        () => {
          syncSelectedDeviceUi('audioinput');
          res();
        },
        (e: any) => {
          console.error('DeviceConfigure: Error setting mic', e);
          rej(e);
        },
      );
    });
  };

  const setSelectedCam = (deviceId: deviceId) => {
    log('Setting cam to', deviceId);
    return new Promise((res, rej) => {
      RtcEngine.changeCamera(
        deviceId,
        () => {
          syncSelectedDeviceUi('videoinput');
          res();
        },
        (e: any) => {
          console.error('Device Configure: Error setting webcam', e);
          rej(e);
        },
      );
    });
  };

  const setSelectedSpeaker = (deviceId: deviceId) => {
    log('Setting speaker to', deviceId);
    return new Promise((res, rej) => {
      RtcEngine.changeSpeaker(
        deviceId,
        () => {
          setUiSelectedSpeaker(deviceId);
          res();
        },
        (e: any) => {
          console.error('Device Configure: Error setting speaker', e);
          rej(selectedSpeaker);
        },
      );
    });
  };

  return (
    <DeviceContext.Provider
      value={{
        selectedCam,
        setSelectedCam,
        selectedMic,
        setSelectedMic,
        selectedSpeaker,
        setSelectedSpeaker,
        deviceList,
        setDeviceList,
      }}>
      {props.children}
    </DeviceContext.Provider>
  );
};

export default DeviceConfigure;
