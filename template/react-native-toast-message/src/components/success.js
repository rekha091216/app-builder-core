import React from 'react';

import BaseToast from './base';
import { icons } from '../assets';
import colors from '../colors';

function SuccessToast(props) {
  return (
    <BaseToast
      {...props}
      style={{ borderLeftColor: colors.mantis }}
      leadingIcon={icons.success}
      text1Style={{ color: colors.black }}
      text2Style={{ color: colors.black }}
    />
  );
}

SuccessToast.propTypes = BaseToast.propTypes;

export default SuccessToast;
