import React, {useContext} from 'react';
import {MinUidContext, MaxUidContext} from '../../../agora-rn-uikit';
import RenderComponent from './RenderComponent';
import {renderComponentObjectInterface, useFpe} from 'fpe-api';
import {isValidElementType} from '../../utils/common';

const VideoArrayRenderer = ({children}: {children: React.FC<any>}) => {
  const max = useContext(MaxUidContext);
  const min = useContext(MinUidContext);

  const FpeRenderComponent = useFpe((config) =>
    typeof config?.components?.videoCall === 'object' &&
    typeof config?.components?.videoCall?.renderComponentObject === 'object'
      ? config?.components?.videoCall?.renderComponentObject
      : undefined,
  );

  const getRenderComponent = (type: keyof renderComponentObjectInterface) => {
    //checking FPE providing the render component and whether its valid react element
    const FPEComp =
      FpeRenderComponent &&
      FpeRenderComponent[type] &&
      isValidElementType(FpeRenderComponent[type])
        ? FpeRenderComponent[type]
        : false;
    //if its valid element then return fpe comp other return the default component
    if (FPEComp) {
      return FPEComp;
    } else {
      return RenderComponent[type]
        ? RenderComponent[type]
        : RenderComponent['rtc'];
    }
  };

  const minArray = min.map((user, index) => {
    const MinComponent = getRenderComponent(user.type);
    return <MinComponent user={user} isMax={false} index={index} />;
  });

  const maxArray = max.map((user, index) => {
    const MaxComponent = getRenderComponent(user.type);
    return <MaxComponent user={user} isMax={false} index={index} />;
  });

  return <>{children(minArray, maxArray)}</>;
};

export default VideoArrayRenderer;