import React, {SetStateAction, useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Spacer from '../atoms/Spacer';
import Popup from '../atoms/Popup';
import TertiaryButton from '../atoms/TertiaryButton';
import PrimaryButton from '../atoms/PrimaryButton';
import ThemeConfig from '../theme';
import DimensionContext from '../components/dimension/DimensionContext';

interface RemoveMeetingPopupProps {
  modalVisible: boolean;
  setModalVisible: React.Dispatch<SetStateAction<boolean>>;
  removeUserFromMeeting: () => void;
  username: string;
}
const RemoveMeetingPopup = (props: RemoveMeetingPopupProps) => {
  const {getDimensionData} = useContext(DimensionContext);
  const {isDesktop} = getDimensionData();
  const removeMeetingLabelHeading = 'Remove ' + props.username + '?';
  const removeMeetingLabelSubHeading = `Once removed, ${props.username} will still be able to rejoin the meeting later.`;

  const cancelBtnLabel = 'CANCEL';
  const removeBtnLabel = 'REMOVE';
  return (
    <Popup
      modalVisible={props.modalVisible}
      setModalVisible={props.setModalVisible}
      showCloseIcon={false}
      contentContainerStyle={styles.contentContainer}>
      <Text style={styles.heading}>{removeMeetingLabelHeading}</Text>
      <Spacer size={8} />
      <Text style={styles.subHeading}>{removeMeetingLabelSubHeading}</Text>
      <Spacer size={32} />
      <View style={isDesktop ? styles.btnContainer : styles.btnContainerMobile}>
        <View style={{flex: 1}}>
          <TertiaryButton
            containerStyle={{
              width: '100%',
              height: 48,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 8,
            }}
            textStyle={styles.btnText}
            text={cancelBtnLabel}
            onPress={() => props.setModalVisible(false)}
          />
        </View>
        {isDesktop ? <Spacer size={10} horizontal={true} /> : <></>}
        <View style={{flex: 1}}>
          <PrimaryButton
            containerStyle={{
              minWidth: 'auto',
              width: '100%',
              borderRadius: 8,
              height: 48,
              backgroundColor: $config.SEMANTIC_ERROR,
              paddingVertical: 12,
              paddingHorizontal: 12,
              marginBottom: isDesktop ? 0 : 20,
            }}
            textStyle={styles.btnText}
            text={removeBtnLabel}
            onPress={props.removeUserFromMeeting}
          />
        </View>
      </View>
    </Popup>
  );
};

export default RemoveMeetingPopup;

const styles = StyleSheet.create({
  btnContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 24,
    maxWidth: 342,
  },
  btnText: {
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
  },
  btnContainerMobile: {
    flexDirection: 'column-reverse',
  },
  heading: {
    fontFamily: ThemeConfig.FontFamily.sansPro,
    fontWeight: '600',
    fontSize: 22,
    color: $config.SEMANTIC_ERROR,
  },
  subHeading: {
    fontFamily: ThemeConfig.FontFamily.sansPro,
    fontWeight: '400',
    fontSize: 14,
    color: $config.FONT_COLOR,
  },
});
