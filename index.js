/**
 * @format
 */

import { AppRegistry, I18nManager, Text, TextInput } from 'react-native';
import React from 'react';
import App from './App';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Global Text alignment patch
if (Text.render) {
  const oldTextRender = Text.render;
  Text.render = function(...args) {
    const origin = oldTextRender.call(this, ...args);
    return React.cloneElement(origin, {
      style: [{ textAlign: 'right' }, origin.props.style]
    });
  };
}

if (TextInput.render) {
  const oldTextInputRender = TextInput.render;
  TextInput.render = function(...args) {
    const origin = oldTextInputRender.call(this, ...args);
    return React.cloneElement(origin, {
      style: [{ textAlign: 'right' }, origin.props.style]
    });
  };
}
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
