# Cordova AdMob Mediation Networks

This repository contains [AdMob Mediation Networks](https://firebase.google.com/docs/admob/android/mediation-networks) Cordova plugins designed to be used with [cordova-plugin-admob-free](https://github.com/ratson/cordova-plugin-admob-free).

## Supported Mediation Networks

* [InMobi](https://github.com/rehy/cordova-admob-mediation/tree/master/packages/cordova-admob-inmobi)
* [MobFox](https://github.com/rehy/cordova-admob-mediation/tree/master/packages/cordova-admob-mobfox)

## Contributing

This repo is designed to not store any of the library binary files,
contributor should change `scripts/download/index.js` and its releated files
to download and generate package code.

Running the following for generation,

```sh
npm run download
```
