import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Keyboard,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import arrowBackIcon from './assets/arrow_back.png';
import arrowNextIcon from './assets/arrow_next.png';
import refreshIcon from './assets/refresh_page.png';
import incognitoIcon from './assets/incognito.png';

let browserRef = null;

// initial url for the browser
const url = 'https://www.google.com';

// functions to search using different engines
const searchEngines = {
  google: uri => `https://www.google.com/search?q=${uri}`,
  duckduckgo: uri => `https://duckduckgo.com/?q=${uri}`,
  bing: uri => `https://www.bing.com/search?q=${uri}`
};

function upgradeURL(uri, searchEngine = 'google') {
  const isURL = uri.split(' ').length === 1 && uri.includes('.');
  if (isURL) {
    if (uri.startsWith('https')) {
      return uri;
    }
    if (uri.startsWith('http')) {
      return uri;
    }
    uri = 'https://' + uri;
    return uri;
  }
  const encodedURI = encodeURI(uri);
  return searchEngines[searchEngine](encodedURI);
}

const injectedJavaScript = `
      true;
`;

class Browser extends Component {
  state = {
    currentURL: url,
    urlText: url,
    prettifiedUrl: '🔒 google.com',
    title: '',
    canGoForward: false,
    canGoBack: false,
    incognito: false,
    config: {
      detectorTypes: 'all',
      allowStorage: true,
      allowJavascript: true,
      allowCookies: true,
      allowLocation: true,
      allowCaching: true,
      defaultSearchEngine: 'google'
    }
  };

  get config() {
    const { incognito, config } = this.state;
    if (incognito) {
      return {
        ...config,
        allowStorage: false,
        allowCookies: false,
        allowLocation: false,
        allowCaching: false
      };
    }
    return config;
  }

  // toggle incognito mode
  toggleIncognito = () => {
    this.setState({
      prettifiedUrl: this.state.incognito
        ? 'Enter Address'
        : 'Private - Enter Address',
      incognito: !this.state.incognito
    });
    this.reload();
  };

  // load the url from the text input
  loadURL = () => {
    let { config, urlText, prettifiedUrl } = this.state;
    const { defaultSearchEngine } = config;
    const newURL = upgradeURL(urlText, defaultSearchEngine);
    prettifiedUrl = newURL;
    console.log(newURL);
    prettifiedUrl = prettifiedUrl.replace('https://www.', '');
    prettifiedUrl = prettifiedUrl.replace('http://www.', '');
    prettifiedUrl = prettifiedUrl.replace('http://', '');
    prettifiedUrl = prettifiedUrl.replace('https://', '');
    prettifiedUrl = prettifiedUrl.replace('www.', '');
    prettifiedUrl = prettifiedUrl.split('/')[0];
    if (newURL.startsWith('https:')) {
      prettifiedUrl = '🔒 ' + prettifiedUrl;
    }
    if (newURL.startsWith('http:')) {
      prettifiedUrl = 'Not secure - ' + prettifiedUrl;
    }
    if (this.state.incognito) {
      prettifiedUrl = 'Private - ' + prettifiedUrl;
    }
    this.setState({
      currentURL: newURL,
      urlText: newURL,
      prettifiedUrl
    });
    Keyboard.dismiss();
  };

  // update the text input
  updateUrlText = text => {
    this.setState({
      urlText: text,
      prettifiedUrl: text
    });
  };

  // go to the next page
  goForward = () => {
    if (browserRef && this.state.canGoForward) {
      browserRef.goForward();
    }
  };

  // go back to the last page
  goBack = () => {
    if (browserRef && this.state.canGoBack) {
      browserRef.goBack();
    }
  };

  reload = () => {
    if (browserRef) {
      browserRef.reload();
    }
  };

  setBrowserRef = browser => {
    if (!browserRef) {
      browserRef = browser;
    }
  };

  onBrowserError = syntheticEvent => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
  };

  onBrowserLoad = syntheticEvent => {
    const { canGoForward, canGoBack, title } = syntheticEvent.nativeEvent;
    this.setState({
      canGoForward,
      canGoBack,
      title
    });
  };

  onNavigationStateChange = navState => {
    const { canGoForward, canGoBack, title } = navState;
    this.setState({
      canGoForward,
      canGoBack,
      title
    });
  };

  // can prevent requests from fulfilling, good to log requests
  // or filter ads and adult content.
  filterRequest = request => {
    return true;
  };

  onBrowserMessage = event => {
    console.log('*'.repeat(10));
    console.log('Got message from the browser:', event.nativeEvent.data);
    console.log('*'.repeat(10));
  };

  render() {
    const { config, state } = this;
    const {
      currentURL,
      canGoForward,
      canGoBack,
      incognito,
      prettifiedUrl
    } = state;
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar
          backgroundColor={incognito ? '#333' : 'white'}
          animated
          barStyle='dark-content'
        />
        <View style={styles.browserBar}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: incognito ? 'white' : '#f1f1f1',
              width: Dimensions.get('window').width - 40,
              borderRadius: 12
            }}
          >
            <TextInput
              style={[
                styles.browserAddressBar,
                {
                  backgroundColor: incognito ? '#888' : '#f1f1f1',
                  color: incognito ? '#eee' : 'black'
                }
              ]}
              onChangeText={this.updateUrlText}
              value={prettifiedUrl}
              onSubmitEditing={this.loadURL}
              selectTextOnFocus
            />

            <TouchableOpacity onPress={this.reload}>
              <Image style={[styles.refreshIcon, {}]} source={refreshIcon} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.browserContainer}>
          <WebView
            ref={this.setBrowserRef}
            originWhitelist={['*']}
            source={{ uri: currentURL }}
            onLoad={this.onBrowserLoad}
            onError={this.onBrowserError}
            onNavigationStateChange={this.onNavigationStateChange}
            renderLoading={() => (
              <View
                style={{
                  position: 'absolute',
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: Dimensions.get('window').height,
                  width: Dimensions.get('window').width,
                  backgroundColor: 'white'
                }}
              >
                <ActivityIndicator />
              </View>
            )}
            onShouldStartLoadWithRequest={this.filterRequest}
            onMessage={this.onBrowserMessage}
            dataDetectorTypes={config.detectorTypes}
            thirdPartyCookiesEnabled={config.allowCookies}
            domStorageEnabled={config.allowStorage}
            javaScriptEnabled={config.allowJavascript}
            geolocationEnabled={config.allowLocation}
            cacheEnabled={config.allowCaching}
            injectedJavaScript={injectedJavaScript}
          />
          <View
            style={{
              height: 50,
              justifyContent: 'space-around',
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <TouchableOpacity onPress={this.goBack}>
              <Image
                style={[styles.refreshIcon, canGoBack ? {} : styles.disabled]}
                source={arrowBackIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={this.goForward}>
              <Image
                style={[
                  styles.refreshIcon,
                  canGoForward ? {} : styles.disabled
                ]}
                source={arrowNextIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={this.toggleIncognito}>
              <Image
                style={[styles.refreshIcon, incognito ? {} : styles.disabled]}
                source={incognitoIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

const X_WIDTH = 375;
const X_HEIGHT = 812;

const XSMAX_WIDTH = 414;
const XSMAX_HEIGHT = 896;

const { height, width } = Dimensions.get('window');

const isIPhoneX = () =>
  Platform.OS === 'ios' && !Platform.isPad && !Platform.isTVOS
    ? (width === X_WIDTH && height === X_HEIGHT) ||
      (width === XSMAX_WIDTH && height === XSMAX_HEIGHT)
    : false;

const StatusBarHeight = Platform.select({
  ios: isIPhoneX() ? 44 : 20,
  android: StatusBar.currentHeight,
  default: 0
});

const styles = StyleSheet.create({
  browser: {
    flex: 1
  },
  root: {
    flex: 1,
    marginTop: StatusBarHeight
  },
  refreshIcon: {
    width: 22,
    height: 22,
    resizeMode: 'cover'
  },
  disabled: {
    opacity: 0.3
  },

  browserBar: {
    height: 50,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: Dimensions.get('window').width,
    borderBottomColor: '#eee',
    borderBottomWidth: 1
  },
  browserAddressBar: {
    height: 40,
    backgroundColor: '#f1f1f1',
    borderRadius: 12,
    borderWidth: 0,
    paddingLeft: 8,
    textAlign: 'center',
    width: Dimensions.get('window').width - 80
  },
  browserContainer: {
    flex: 2
  }
});

export default Browser;
