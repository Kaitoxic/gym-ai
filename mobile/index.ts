import { enableScreens } from 'react-native-screens';
import { registerRootComponent } from 'expo';

import App from './App';

// Enable native screens for React Navigation (required on Android for correct behavior)
enableScreens();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
