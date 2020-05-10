'use strict'

function addPlayer(element, autoplay=true) {
    let id = element.id
    let newTrack = document.createElement("div");
    newTrack.id = "audio-track"
    let trackHtml =`
            <label>Track 1</label>
            <audio autoplay controls></audio>
        `;
    if (!autoplay) {
        trackHtml = trackHtml.replace("autoplay","");
    }
    newTrack.innerHTML = trackHtml;
    element.appendChild(newTrack);
    return newTrack.lastElementChild;
}

export {addPlayer};
