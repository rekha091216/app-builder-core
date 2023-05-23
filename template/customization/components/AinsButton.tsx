import React from "react";
import { useState, useContext } from "react";
import Toggle from "../../src/atoms/Toggle";
import { View, Text, StyleSheet } from "react-native";
import { RtcContext } from "../../agora-rn-uikit";

const AinsButton = () => {

  const [ainsToggle, setAinsToggle] = useState(false);
  const { RtcEngine, dispatch } = useContext(RtcContext);

  const textStyle = StyleSheet.create({
    text: {
      color: $config.PRIMARY_ACTION_TEXT_COLOR,
      fontSize: 12,
      fontFamily: "Source Sans Pro",
      textAlign:'center',
      marginTop: "18px",
    },
  });

  const viewStyle = StyleSheet.create({
    container: {
      marginTop: "16px",
    },
  });

  const onAinsToggleSwitch = (value) => {
    if (value) {
      dispatch({
        type: "LocalNoiseSuppression",
        value: [1],
      });
      setAinsToggle(true);
    } else {
      dispatch({
        type: "LocalNoiseSuppression",
        value: [0],
      });
      setAinsToggle(false);
    }
  };

  const getHeading = () => {
    return "AINS";
  };

  return (
    <View style={viewStyle.container}>
      <Toggle
        disabled={$config.EVENT_MODE}
        isEnabled={ainsToggle}
        toggleSwitch={onAinsToggleSwitch}
        key="ains"
      />
      <Text key="ainslabel" style={textStyle.text}>
        {getHeading()}
      </Text>
    </View>
  );
};

export default AinsButton;
