import React from 'react';
import {Text} from 'react-native';
import ScreenshareParticipants from './ScreenshareParticipants';
import Participant from './Participant';
import {useString} from '../../utils/useString';
import {UidType, useLocalUid} from '../../../agora-rn-uikit';
import {useMeetingInfo, useRender} from 'customization-api';
import Spacer from '../../atoms/Spacer';
import {useVideoMeetingData} from '../contexts/VideoMeetingDataContext';

export default function AllHostParticipants(props: any) {
  const localUid = useLocalUid();
  //commented for v1 release
  //const remoteUserDefaultLabel = useString('remoteUserDefaultLabel')();
  const remoteUserDefaultLabel = 'User';
  const {renderList} = useRender();
  const getParticipantName = (uid: UidType) => {
    return renderList[uid]?.name || remoteUserDefaultLabel;
  };
  const {hostUids} = useVideoMeetingData();
  const {
    data: {isHost},
  } = useMeetingInfo();
  const {
    isMobile = false,
    handleClose,
    updateActionSheet,
    uids,
    emptyMessage,
  } = props;
  return (
    <>
      {uids.length == 0 ? (
        emptyMessage ? (
          <Text
            style={{
              alignSelf: 'center',
              paddingVertical: 20,
              fontFamily: 'Source Sans Pro',
              fontWeight: '400',
              fontSize: 14,
              lineHeight: 12,
              color: $config.FONT_COLOR,
            }}>
            {emptyMessage}
          </Text>
        ) : (
          <></>
        )
      ) : (
        <>
          <Spacer size={4} />
          {/* User should see his name first */}
          {uids.filter((uid) => uid === localUid).length > 0 ? (
            <Participant
              isLocal={true}
              isAudienceUser={false}
              name={getParticipantName(localUid)}
              user={renderList[localUid]}
              showControls={true}
              isHostUser={hostUids.indexOf(localUid) !== -1}
              key={localUid}
              isMobile={isMobile}
              handleClose={handleClose}
              updateActionSheet={updateActionSheet}
            />
          ) : (
            <></>
          )}
          {/* Others Users in the call */}
          {uids
            .filter((uid) => uid !== localUid)
            .map((uid) =>
              renderList[uid]?.type === 'screenshare' ? (
                <ScreenshareParticipants
                  name={getParticipantName(uid)}
                  key={uid}
                />
              ) : (
                <Participant
                  isLocal={false}
                  isAudienceUser={false}
                  name={getParticipantName(uid)}
                  user={renderList[uid]}
                  showControls={renderList[uid]?.type === 'rtc' && isHost}
                  isHostUser={hostUids.indexOf(uid) !== -1}
                  key={uid}
                  isMobile={isMobile}
                  handleClose={handleClose}
                  updateActionSheet={updateActionSheet}
                />
              ),
            )}
        </>
      )}
    </>
  );
}
