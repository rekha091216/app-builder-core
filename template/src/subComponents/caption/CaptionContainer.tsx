import {StyleSheet, Text, View} from 'react-native';
import React from 'react';

import Caption from './Caption';
import {useCaption} from './useCaption';
import ThemeConfig from '../../../src/theme';
import {isMobileUA} from '../../utils/common';

const CaptionContainer = () => {
  const {isCaptionON} = useCaption();
  return isCaptionON ? (
    <View style={isMobileUA() ? styles.mobileContainer : styles.container}>
      <Caption />
    </View>
  ) : null;
};

export default CaptionContainer;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    minHeight: 80,
    marginHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: $config.CARD_LAYER_1_COLOR,
    borderRadius: ThemeConfig.BorderRadius.small,
    paddingLeft: 260,
  },
  mobileContainer: {
    marginHorizontal: 0,
    padding: 16,
  },
});
