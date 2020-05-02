'use strict'

function addPlayer(element) {
    let id = element.id
    let player =`"
        <div class="audio-track">
            <label>Track 1</label>
            <audio autoplay controls></audio>
        </div>
        `;
    element.innerHTML = player
}
