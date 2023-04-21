import {gql, useMutation} from '@apollo/client';
import {RoomInfoContextInterface} from '../components/room-info/useRoomInfo';
import {useSetRoomInfo} from '../components/room-info/useSetRoomInfo';
import SDKEvents from '../utils/SdkEvents';

const CREATE_CHANNEL = gql`
  mutation CreateChannel(
    $title: String!
    $backendURL: String!
    $enablePSTN: Boolean
  ) {
    createChannel(
      title: $title
      backendURL: $backendURL
      enablePSTN: $enablePSTN
    ) {
      passphrase {
        host
        view
      }
      channel
      title
      pstn {
        number
        dtmf
      }
    }
  }
`;
/**
 * Returns an asynchronous function to create a meeting with the given options.
 */
export default function useCreateRoom() {
  const [createChannel, {error}] = useMutation(CREATE_CHANNEL);
  const {setRoomInfo} = useSetRoomInfo();
  return async (
    roomTitle: string,
    enablePSTN?: boolean,
    isSeparateHostLink?: boolean,
  ) => {
    const res = await createChannel({
      variables: {
        title: roomTitle,
        backendURL: $config.BACKEND_ENDPOINT,
        enablePSTN: enablePSTN,
      },
    });
    if (error) {
      throw error;
    }
    if (res && res?.data && res?.data?.createChannel) {
      let roomInfo: Partial<RoomInfoContextInterface['data']> = {
        roomId: {
          attendee: '',
        },
      };
      if (res?.data?.createChannel?.passphrase?.view) {
        roomInfo.roomId.attendee = res.data.createChannel.passphrase.view;
      }
      if (res?.data?.createChannel?.passphrase?.host) {
        roomInfo.roomId.host = res.data.createChannel.passphrase.host;
      }
      if (enablePSTN === true && res?.data?.createChannel?.pstn) {
        roomInfo.pstn = {
          number: res.data.createChannel.pstn.number,
          pin: res.data.createChannel.pstn.dtmf,
        };
      }
      setRoomInfo({
        data: {
          isHost: true,
          isSeparateHostLink: isSeparateHostLink ? true : false,
          meetingTitle: roomTitle,
          roomId: roomInfo?.roomId,
          pstn: roomInfo?.pstn,
        },
      });
      SDKEvents.emit(
        'create',
        roomInfo.roomId.host,
        roomInfo.roomId.attendee,
        roomInfo?.pstn,
      );
    } else {
      throw new Error(`An error occurred in parsing the channel data.`);
    }
  };
}
