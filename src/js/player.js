'use strict'

function addPlayer(element, autoplay=true) {
    let id = element.id
    let newTrack = document.createElement("div");
    newTrack.id = "audio-track"
    let trackHtml =`
            <label>Track 1</label>
            <audio autoplay controls></audio>
            <div id="latency-report">latency <span id="latency">unknown</span></div>
            <div id="echo-test"><button class="run-echo-test">Run Echo Test</button>audio round trip latency: <span id="echo-latency"></span></div>
        `;
    if (!autoplay) {
        trackHtml = trackHtml.replace("autoplay","");
    }
    newTrack.innerHTML = trackHtml;
    element.appendChild(newTrack);
    return newTrack;
}

export {addPlayer};
