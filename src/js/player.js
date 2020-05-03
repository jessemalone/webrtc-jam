'use strict'

function addPlayer(element) {
    let id = element.id
    let newTrack = document.createElement("div");
    newTrack.id = "audio-track"
    newTrack.innerHTML =`
            <label>Track 1</label>
            <audio autoplay controls></audio>
        `;
    element.appendChild(newTrack);
    return newTrack.lastElementChild;
}

export {addPlayer};
