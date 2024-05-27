let currentsong = new Audio();
let song = [];
let currfolder = "";

// Function to convert seconds to MM:SS format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    seconds = Math.floor(seconds);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

// Function to fetch and display songs from a folder
async function getSongs(folder) {
    currfolder = folder;
    //try {
        // Fetch the list of songs from the folder
        let response = await fetch(`/${folder}/`);
        if (!response.ok) {
            throw new Error(`Failed to fetch songs from ${folder}`);
        }
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let anchors = div.getElementsByTagName("a");
        song = [];
        
        // Filter out the mp3 files and store their names in the song array
        for (let i = 0; i < anchors.length; i++) {
            const element = anchors[i];
            if (element.href.endsWith(".mp3")) {
                song.push(element.href.split(`/${folder}/`)[1]);
            }
        }

        // Display the list of songs in the UI
        let songul = document.querySelector(".songlist ul");
        songul.innerHTML = "";
        for (const sang of song) {
            songul.innerHTML += `<li>
                <img src="spotify-img/music.svg" alt="">
                <div class="info">
                    <div>${decodeURIComponent(sang.replaceAll("%20", " "))}</div>
                    <div>Song artist</div>
                </div>
                <div class="playnow">
                    <span>Play now</span>
                    <img src="spotify-img/play.svg" alt="">
                </div>
            </li>`;
        }

     // Add event listeners to play the song when clicked
     Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
            
        });
    });

    return song; // Return the song array
// } catch (error) {
//     console.error(`Error fetching songs: ${error}`);
//     return []; // Return an empty array if there's an error
// }
}

// Function to play or pause the current song
const playMusic = (track, pause = false) => {
    currentsong.src = `/${currfolder}/` + track;
    if (!pause) {
        currentsong.play();
        document.getElementById("play").src = "spotify-img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = track;
    document.querySelector(".songtime").innerHTML = "00:00/00:00";
}

// Function to fetch and display albums
async function displayAlbums() {
    try {
        // Fetch the list of albums
        let response = await fetch(`/songs/`);
        if (!response.ok) {
            throw new Error('Failed to fetch album data');
        }
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let anchors = div.getElementsByTagName("a");
        let cardcontainer = document.querySelector(".cardcontainer");
        // Display the albums in the UI
        for (let i = 0; i < anchors.length; i++) {
            const anchor = anchors[i];
            if (anchor.href.includes("/songs/")) {
                let folderName = anchor.href.split("/songs/")[1].replace("/", "");

                // Fetch the JSON file for each album
                let jsonResponse = await fetch(`/songs/${folderName}/info.json`);
                if (!jsonResponse.ok) {
                    throw new Error(`Failed to fetch JSON for ${folderName}`);
                }
                let jsonData = await jsonResponse.json();

                cardcontainer.innerHTML += `
                    <div class="card" data-folder="${folderName}">
                    <div class="play">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http:// www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" stroke="#141834" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                                </svg>
                        </div>

                        <img src="/songs/${folderName}/cover.jpg" alt="${folderName} cover">
                        <div class="album-info">
                            <h3>${jsonData.title}</h3>
                            <p>${jsonData.description}</p>
                        </div>
                    </div>`;
            }
        }


        // Add event listeners to display songs when an album is clicked
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async () => {
                let folder = e.getAttribute("data-folder");
                await getSongs(`songs/${folder}`);
                // Play the first song of the selected album
                if (song.length > 0) {
                    playMusic(song[0]);
                }
            });
        });
        
    } catch (error) {
        console.error(`Error displaying albums: ${error}`);
    }
}
// Event listener for the hamburger menu to show the side menu
document.querySelector(".ham").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
});

// Event listener for the close button to hide the side menu
document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
});

// Event listener to play or pause the current song
document.getElementById("play").addEventListener("click", () => {
    if (currentsong.paused) {
        currentsong.play();
        document.getElementById("play").src = "spotify-img/pause.svg";
    } else {
        currentsong.pause();
        document.getElementById("play").src = "spotify-img/play.svg";
    }
});

// Update the seekbar and song time display as the song plays
currentsong.addEventListener("timeupdate", () => {
    let songDuration = secondsToMinutesSeconds(currentsong.duration);
    let songCurrentTime = secondsToMinutesSeconds(currentsong.currentTime);
    document.querySelector(".songtime").innerHTML = `${songCurrentTime}/${songDuration}`;
    document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
});

// Event listener for seekbar to seek to a different part of the song
document.querySelector(".seekbar").addEventListener("click", e => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentsong.currentTime = (currentsong.duration * percent) / 100;
});

// Event listener to play the previous song
document.getElementById("previous").addEventListener("click", () => {
    let index = song.indexOf(currentsong.src.split("/").pop());
    if ((index - 1) >= 0) {
        playMusic(song[index - 1]);
    }
});

// Event listener to play the next song
document.getElementById("next").addEventListener("click", () => {
    let index = song.indexOf(currentsong.src.split("/").pop());
    if ((index + 1) < song.length) {
        playMusic(song[index + 1]);
    }
});

// Event listener to change the volume
document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
    currentsong.volume = parseInt(e.target.value) / 100;
});

// Event listener to mute/unmute the song
document.querySelector(".volume>img").addEventListener("click", e=>{ 
    if(e.target.src.includes("volume.svg")){
        e.target.src = e.target.src.replace("volume.svg", "mute.svg")
        currentsong.volume = 0;
        document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
    }
    else{
        e.target.src = e.target.src.replace("mute.svg", "volume.svg")
        currentsong.volume = .10;
        document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
    }

})
// Event listener to automatically play the next song when the current one ends
currentsong.addEventListener("ended", () => {
    let index = song.indexOf(currentsong.src.split("/").pop());
    if ((index + 1) < song.length) {
        playMusic(song[index + 1]);
    }
});

// Main function to initialize the app and play the default song
async function main() {
    // Display all albums on the page
    await displayAlbums();

    // Get songs from the default folder and play the first song
    // Replace "songs/Arjit" with your default folder
   await getSongs("songs/Arjit");  
   playMusic(song[0], true);
}

// Initialize the app
main();


