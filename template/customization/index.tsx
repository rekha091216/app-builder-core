import {customize, ControlsComponentsArray} from 'customization-api';
import React, {createContext, useState} from 'react';
import AinsButton from './components/AinsButton';

function BottomBar() {
  const componentArray = ControlsComponentsArray.map((E) => (
    <div>
      <E showControls={false} isDesktop />
    </div>
  ));
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-evenly',
        flexDirection: 'row',
        flex: 1,
      }}>
      {componentArray.slice(0, 2)}
      {componentArray.slice(3, 5)}
      <AinsButton />
      {componentArray.slice(5, 6)}
    </div>
  );
}

const myContext = createContext({});

const userCustomization = customize({
  components: {
    videoCall: {
      bottomBar: BottomBar,
    },
    appRoot: (props) => {
      const [ainsEnabled, setAinsEnabled] = useState(true);
      return (
        <myContext.Provider
          value={{
            ainsEnabled,
            setAinsEnabled,
          }}>
            
          {props.children}
        </myContext.Provider>
      );
    },
  },
});

export default userCustomization;