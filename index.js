/**
 * @format
 */

import { AppRegistry, I18nManager, Text, TextInput, Platform } from 'react-native';
import React from 'react';
import App from './App';
import { FONT_FAMILY } from './src/theme/typography';

// Enforce standard LTR view coordinate system so Android React Native doesn't flip icons/containers
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

const DEFAULT_FONT = FONT_FAMILY.regular;

// Default Persian typography and natural right-aligned text
if (Text.defaultProps == null) {
  Text.defaultProps = {};
}
Text.defaultProps.style = [
  { fontFamily: DEFAULT_FONT, textAlign: 'right', writingDirection: 'rtl' },
  Text.defaultProps.style,
];

if (TextInput.defaultProps == null) {
  TextInput.defaultProps = {};
}
TextInput.defaultProps.style = [
  { fontFamily: DEFAULT_FONT, textAlign: 'right', writingDirection: 'rtl' },
  TextInput.defaultProps.style,
];

import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
