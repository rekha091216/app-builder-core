import {StyleSheet, Text, View} from 'react-native';
import hexadecimalTransparency from '../utils/hexadecimalTransparency';
import React from 'react';

const RecordingInfo = ({recordingLabel = ''}) => {
  return (
    <View style={[styles.recordingView]}>
      <View style={[styles.recordingStatus]} />
      <Text style={styles.recordingText}>{recordingLabel}</Text>
    </View>
  );
};

export default RecordingInfo;

const styles = StyleSheet.create({
  recordingView: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: $config.ICON_BG_COLOR + hexadecimalTransparency['10%'],
    marginLeft: 20,
    borderWidth: 1,
    borderColor: $config.CARD_LAYER_3_COLOR,
    shadowColor: $config.HARD_CODED_BLACK_COLOR,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  recordingText: {
    fontSize: 12,
    lineHeight: 12,
    fontWeight: '400',
    fontFamily: 'Source Sans Pro',
    color: $config.SECONDARY_ACTION_COLOR + hexadecimalTransparency['50%'],
  },
  recordingStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: $config.SEMANTIC_ERROR,
    marginRight: 8,
  },
});