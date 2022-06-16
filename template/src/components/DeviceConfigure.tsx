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
import React, {useState, useContext, useEffect, useCallback} from 'react';
import {RtcContext, ClientRole} from '../../agora-rn-uikit';
import DeviceContext from './DeviceContext';
import AgoraRTC from 'agora-rtc-sdk-ng';

interface Props {
  userRole: ClientRole;
}
interface deviceInfo {
  deviceId: string;
  groupId: string;
  kind: string;
  label: string;
}
interface changedDeviceInfo {
  device: deviceInfo;
  initAt: number;
  state: 'INACTIVE' | 'ACTIVE';
  updateAt: number;
}
const DeviceConfigure: React.FC<Props> = (props: any) => {
  const [selectedCam, setSelectedCam] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  const [deviceList, setDeviceList] = useState<any>([]);
  const rtc = useContext(RtcContext);

  const refreshDevices = useCallback(async () => {
    rtc.RtcEngine.getDevices(function (devices: deviceInfo[]) {
      /**
       * Some browsers list the same microphone twice with different Id's,
       * their group Id's match as they are the same physical device.
       * deviceId == default is an oddity in chrome which stores the user
       * preference
       */
      /**
       *  1. Fetch devices and filter so the deviceId with default value
       *    are exluded for both audio and video devices
       *  2. Store only unique devices with unique groupIds
       */

      const uniqueDevices = devices
        .filter(
          (device: deviceInfo) =>
            device?.deviceId !== 'default' &&
            (device.kind == 'audioinput' || device.kind == 'videoinput'),
        )
        .reduce((acc: deviceInfo[], device: deviceInfo) => {
          if (!acc.some((obj: any) => obj.groupId === device.groupId)) {
            acc.push(device);
          }
          return acc;
        }, []);
      console.log('DeviceTesting: set devices', uniqueDevices);
      setDeviceList(uniqueDevices);
    });
  }, []);

  useEffect(() => {
    AgoraRTC.onMicrophoneChanged = async (changedDevice: changedDeviceInfo) => {
      // When new audio device is plugged in ,refresh the devices list.
      console.log('DeviceTesting: audioTest on-microphone-changed');
      if (changedDevice && changedDevice.state === 'ACTIVE') {
        if (changedDevice.device?.kind === 'audioinput') {
          console.log('DeviceTesting: NEW device selected');
          setSelectedMic(changedDevice.device?.deviceId);
        }
      }
      if (changedDevice && changedDevice.state === 'INACTIVE') {
        if (changedDevice.device?.kind === 'audioinput') {
          console.log('DeviceTesting: device inactive');
          setSelectedMic('');
        }
      }
    };
    AgoraRTC.onCameraChanged = async (changedDevice: changedDeviceInfo) => {
      // When new video device is plugged in ,refresh the devices list.
      console.log('videoTest on-camera-changed');
      if (changedDevice && changedDevice.state === 'ACTIVE') {
        if (changedDevice.device?.kind === 'videoinput') {
          setSelectedCam(changedDevice.device?.deviceId);
        }
      }
      if (changedDevice && changedDevice.state === 'INACTIVE') {
        if (changedDevice.device?.kind === 'videoinput') {
          setSelectedCam('');
        }
      }
    };
  }, []);

  useEffect(() => {
    refreshDevices();
  }, [selectedCam, selectedMic]);

  useEffect(() => {
    if (!selectedMic || selectedMic.trim().length == 0) {
      for (const i in deviceList) {
        if (deviceList[i].kind === 'audioinput') {
          console.log('DeviceTesting: set selected device');
          setSelectedMic(deviceList[i].deviceId);
          break;
        }
      }
    }
    if (!selectedCam || selectedCam.trim().length == 0) {
      for (const i in deviceList) {
        if (deviceList[i].kind === 'videoinput') {
          console.log('DeviceTesting: set selected camera');
          setSelectedCam(deviceList[i].deviceId);
          break;
        }
      }
    }
  }, [deviceList]);

  useEffect(() => {
    if (selectedCam.length !== 0) {
      rtc.RtcEngine.changeCamera(
        selectedCam,
        () => {},
        (e: any) => console.log(e),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCam]);

  useEffect(() => {
    if (selectedCam.length !== 0) {
      rtc.RtcEngine.changeMic(
        selectedMic,
        () => {},
        (e: any) => console.log(e),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMic]);

  useEffect(() => {
    // See if device is empty
    // If stream exists and deviceIds are empty, check for devices again
    if (deviceList.length === 0) {
      refreshDevices();
    }
  }, [rtc]);

  return (
    <DeviceContext.Provider
      value={{
        selectedCam,
        setSelectedCam,
        selectedMic,
        setSelectedMic,
        deviceList,
        setDeviceList,
      }}>
      {true ? props.children : <></>}
    </DeviceContext.Provider>
  );
};

export default DeviceConfigure;
