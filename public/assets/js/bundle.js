/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/js/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/js/index.js":
/*!*************************!*\
  !*** ./src/js/index.js ***!
  \*************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _player__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./player */ \"./src/js/player.js\");\n/* harmony import */ var _rtc__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./rtc */ \"./src/js/rtc.js\");\n/* harmony import */ var _signaller__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./signaller */ \"./src/js/signaller.js\");\n\n\n\n\n\n\nconst mediaStreamConstraints = {\n    audio: {\n        autoGainContol: false,\n        echoCancellation: false,\n        latency: 0.05,\n        noiseSuppression: false,\n        channelCount: 1\n    },\n    video: false\n}\nlet offerSignaller = new _signaller__WEBPACK_IMPORTED_MODULE_2__[\"RTCSignaller\"](window.location.host);\nlet iceSignaller = new _signaller__WEBPACK_IMPORTED_MODULE_2__[\"ICESignaller\"](window.location.host);\nlet localPeer;\n\nfunction handleLocalMediaStreamError(error) {\n    console.log(error);\n}\n\nfunction gotLocalMediaStream(stream) {\n    // Add Player\n    let tracks = document.getElementById(\"tracks\");\n    let track = _player__WEBPACK_IMPORTED_MODULE_0__[\"addPlayer\"](tracks, false);\n    track.srcObject = stream;\n\n    // Create peer connection\n    localPeer = _rtc__WEBPACK_IMPORTED_MODULE_1__[\"createPeer\"](function (event) {\n        iceSignaller.sendIce(event);\n    });\n    localPeer.addStream(stream);\n\n    // Create offer\n    const offerOptions = {\n        offerToReceiveAudio: 1,\n    }\n    localPeer.createOffer(offerOptions)\n        .then(function(offer){\n            localPeer.setLocalDescription(offer).then(()=>{}).catch(_rtc__WEBPACK_IMPORTED_MODULE_1__[\"logError\"]);\n        offerSignaller.sendOffer(offer);\n        }).catch(_rtc__WEBPACK_IMPORTED_MODULE_1__[\"logError\"]);\n\n}\n\nfunction gotRemoteMediaStream(event) {\n    console.log(\"got remote stream\");\n    // Set up ICE handling\n    iceSignaller.onIce(function (ice) {\n        console.log(\"GOT REMOTE ICE\");\n        if (ice  != null) {\n            var candidate = new RTCIceCandidate(ice);\n            localPeer.addIceCandidate(candidate);\n        }\n    });\n    // Add player\n    let tracks = document.getElementById(\"tracks\");\n    let remoteTrack = _player__WEBPACK_IMPORTED_MODULE_0__[\"addPlayer\"](tracks);\n    remoteTrack.srcObject = event.stream;\n}\n\n// Handle remote offer\nofferSignaller.onOffer(function(offer) {\n    console.log(\"GOT OFFER\");\n\n    // Create remote peer connection\n    console.log(offer.type);\n    if (offer.type === \"answer\") {\n        var sdp_id = offer.sdp.match(/o=.*/)[0];\n        var local_sdp_id = localPeer.localDescription.sdp.match(/o=.*/)[0];\n        if (sdp_id != local_sdp_id) {\n            console.log(\"got an answer\");\n            localPeer.setRemoteDescription(offer);\n            localPeer.onaddstream = gotRemoteMediaStream\n        }\n    } else if (offer.type === \"offer\") {\n        var sdp_id = offer.sdp.match(/o=.*/)[0];\n        var local_sdp_id = localPeer.localDescription.sdp.match(/o=.*/)[0];\n\n        if (sdp_id != local_sdp_id) {\n            console.log(\"got remote offer\");\n            localPeer.setRemoteDescription(offer);\n            localPeer.createAnswer().then(function(answer) {\n                console.log(\"sending answer\");\n                localPeer.setLocalDescription(answer);\n                offerSignaller.sendOffer(answer);\n            });\n            localPeer.onaddstream = gotRemoteMediaStream\n        }\n    }\n});\n\n// Get local media stream\nnavigator.mediaDevices.getUserMedia(mediaStreamConstraints)\n    .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);\n\n\n\n//# sourceURL=webpack:///./src/js/index.js?");

/***/ }),

/***/ "./src/js/message.js":
/*!***************************!*\
  !*** ./src/js/message.js ***!
  \***************************/
/*! exports provided: Message */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Message\", function() { return Message; });\n\n\nfunction Message(type,data,recipient_guid) {\n    this.type = type;\n    this.data = data;\n    this.recipient_guid = recipient_guid;\n}\n\n\n\n\n//# sourceURL=webpack:///./src/js/message.js?");

/***/ }),

/***/ "./src/js/player.js":
/*!**************************!*\
  !*** ./src/js/player.js ***!
  \**************************/
/*! exports provided: addPlayer */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"addPlayer\", function() { return addPlayer; });\n\n\nfunction addPlayer(element, autoplay=true) {\n    let id = element.id\n    let newTrack = document.createElement(\"div\");\n    newTrack.id = \"audio-track\"\n    let trackHtml =`\n            <label>Track 1</label>\n            <audio autoplay controls></audio>\n        `;\n    if (!autoplay) {\n        trackHtml = trackHtml.replace(\"autoplay\",\"\");\n    }\n    newTrack.innerHTML = trackHtml;\n    element.appendChild(newTrack);\n    return newTrack.lastElementChild;\n}\n\n\n\n\n//# sourceURL=webpack:///./src/js/player.js?");

/***/ }),

/***/ "./src/js/rtc.js":
/*!***********************!*\
  !*** ./src/js/rtc.js ***!
  \***********************/
/*! exports provided: createPeer, logError */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"createPeer\", function() { return createPeer; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"logError\", function() { return logError; });\n\n\nfunction createPeer(iceCandidateHandler) {\n    const config = {\n        iceServers: [\n            {urls: [\"stun:stun1.l.google.com:19302\"]},\n            {urls: [\"stun:stun2.l.google.com:19302\"]}\n        ]\n    }\n    let localPeerConnection = new RTCPeerConnection(config)\n    localPeerConnection.addEventListener('icecandidate', iceCandidateHandler);\n\n    return localPeerConnection;\n}\n\nfunction logError(error) {\n  console.log(\"rtc error\");\n  console.log(error);\n}\n\n\n//# sourceURL=webpack:///./src/js/rtc.js?");

/***/ }),

/***/ "./src/js/signaller.js":
/*!*****************************!*\
  !*** ./src/js/signaller.js ***!
  \*****************************/
/*! exports provided: Signaller */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Signaller\", function() { return Signaller; });\n/* harmony import */ var _message__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./message */ \"./src/js/message.js\");\n\n\n\n\nfunction Signaller(websocket) {\n    this.websocket = websocket;\n    this.offerHandler = function(){};\n    this.answerHandler = function(){};\n    this.announceHandler = function(){};\n    this.iceHandler = function(){};\n    this.websocket.onmessage = (event) => this.messageHandler(event);\n}\n\nSignaller.prototype.messageHandler = function(event) {\n    let data = JSON.parse(event.data)\n    let message = new _message__WEBPACK_IMPORTED_MODULE_0__[\"Message\"](data.type, data.data, data.recipient_guid)\n    switch (message.type) {\n        case 'offer':\n            this.offerHandler(message);\n            break;\n        case 'answer':\n            this.answerHandler(message);\n            break;\n        case 'ice':\n            this.iceHandler(message);\n    }\n}\n\nSignaller.prototype.announce = function() {\n    let message = new _message__WEBPACK_IMPORTED_MODULE_0__[\"Message\"](\"announce\",\"announce\",\"\");\n    this.websocket.send(JSON.stringify(message));\n}\n\nSignaller.prototype.sendOffer = function(offer, recipient_guid) {\n    let message = new _message__WEBPACK_IMPORTED_MODULE_0__[\"Message\"](\"offer\",JSON.stringify(offer),recipient_guid);\n    this.websocket.send(JSON.stringify(message));\n}\n\nSignaller.prototype.setOfferHandler = function(handler) {\n    this.offerHandler = handler;\n}\n\nSignaller.prototype.sendAnswer = function(answer, recipient_guid) {\n    let message = new _message__WEBPACK_IMPORTED_MODULE_0__[\"Message\"](\"answer\",JSON.stringify(answer),recipient_guid);\n    this.websocket.send(JSON.stringify(message));\n}\n\nSignaller.prototype.setAnswerHandler = function(handler) {\n    this.answerHandler = handler;\n}\n\nSignaller.prototype.sendIce = function(candidate, recipient_guid) {\n    let message = new _message__WEBPACK_IMPORTED_MODULE_0__[\"Message\"](\"ice\",JSON.stringify(candidate),recipient_guid);\n    this.websocket.send(JSON.stringify(message));\n}\n\nSignaller.prototype.setIceHandler = function(handler) {\n    this.iceHandler = handler;\n}\n\n\n\n\n\n//# sourceURL=webpack:///./src/js/signaller.js?");

/***/ })

/******/ });