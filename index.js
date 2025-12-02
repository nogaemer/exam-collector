// Modified index.js to route all calls through a proxy Worker.
// Set API_BASE to your Worker URL, e.g. "https://exam-collector.workers.dev/api"
let containers = [];

let year = null;
let part = null
let download = false;

// TODO: set this to your worker URL, for example:
// const API_BASE = "https://exam-collector.workers.dev/api";
const API_BASE = "https://misty-firefly-1329.schwenoldnoah.workers.dev/api";

function selectSubject(elem) {
    let url = elem.id;
    year = null;
    part = null;
    download = false;
    document.getElementById("voice").innerHTML = "";


    getCategoryID(url);

    const buttons = document.getElementsByClassName("button-selector-active");

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("button-selector-active");
    }

    elem.classList.add("button-selector-active");
}

async function getCategoryID(url) {
    document.getElementById("result").innerHTML = "";
    year = null;
    part = null;

    url = url.replace("https://www.schullv.de/", "");
    const requestUrl = `${API_BASE}/v2/categories3?url=${encodeURIComponent(url)}&categoryId=undefined&isActive=false`;

    const requestOptions = {
        method: "GET",
        redirect: "follow",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    };

    try {
        const response = await fetch(requestUrl, requestOptions);
        if (!response.ok) throw new Error(`categories3 request failed with status ${response.status}`);
        const result = await response.json();
        // load containers and build UI
        containers = await getContainers(result.id);
        buildTreeYear();
    } catch (error) {
        console.error(error);
    }
}

document.getElementById("back").onclick = function() {
    document.getElementById("voice").innerHTML = "";

    if (download) {
        buildTree(year, part);
        download = false;
    } else if (part === null) {
        buildTreeYear();
        part = null;
        year = null;
        return;
    } else if (year === null){
        buildTree(year);
        part = null
    } else {
        buildTree(year);
        part = null;
    }
}

async function buildTreeLink(containerId) {
    document.getElementById("result").innerHTML = "";

    let aufgaben = document.createElement("a");
    aufgaben.innerHTML = "Download Aubgaben";
    getDownloadLink(containerId, false)
        .then((url) => aufgaben.href = url)
        .catch(() => aufgaben.href = "#");
    aufgaben.target = "_blank";
    document.getElementById("result").appendChild(aufgaben);

    let lösungen = document.createElement("a");
    lösungen.innerHTML = "Download Lösungen";
    getDownloadLink(containerId, true)
        .then((url) => lösungen.href = url)
        .catch(() => lösungen.href = "#");
    lösungen.target = "_blank";
    document.getElementById("result").appendChild(lösungen);
}

async function buildTree(containerIndex, deepContainerIndex = null) {

    document.getElementById("result").innerHTML = "";
    year = containerIndex;
    part = deepContainerIndex;

    let parentContainer = containers[containerIndex];
    if (deepContainerIndex !== null) {
        parentContainer = parentContainer.children[deepContainerIndex];
    }

    for (let i = 0; i < parentContainer.children.length; i++) {
        let container = parentContainer.children[i]

        let p = document.createElement("p");
        p.innerHTML = container.topic + (container.isLastElement ? "" : " ›")
        document.getElementById("result").appendChild(p);

        if (!container.isLastElement) {
            p.onclick = function(){buildTree(containerIndex, i)};
        } else {
            p.onclick = function(){
                buildTreeLink(container.containerId)
                if (container.subject && container.subject.name === "Englisch") buildVoice(container.containerId)
                download = true;
            };
        }
    }
}

async function buildTreeYear() {
    document.getElementById("result").innerHTML = "";

    for (let i = 0; i < containers.length; i++) {
        let container = containers[i]

        let p = document.createElement("p");
        p.innerHTML = container.topic;
        p.onclick = function(){buildTree(i)};
        document.getElementById("result").appendChild(p);
    }
}

async function getContainers(categoryId) {
    const url = `${API_BASE}/v2/categories/${encodeURIComponent(categoryId)}/light_containers2?isActive=false`;
    
    const requestOptions = {
        method: "GET",
        redirect: "follow",
        headers: {
            "Accept": "application/json"
        }
    };

    try {
        const response = await fetch(url, requestOptions);
        if (!response.ok) throw new Error(`getContainers failed with status ${response.status}`);
        const result = await response.json();
        containers = result;
    } catch (error) {
        console.error(error);
        containers = [];
    }

    return containers;
}

async function getDownloadLink(containerId, solution) {
    const label = solution ? "PWloesungen" : "PWaufgaben0";
    const url = `${API_BASE}/v2/containers/${encodeURIComponent(containerId)}/labels/${label}0000000/contents?isApp=false&isTablet=true&userId=null&isActive=false`;

    let pdfFile;

    const requestOptions = {
        method: "GET",
        redirect: "follow",
        headers: {
            "Accept": "application/json"
        }
    };

    try {
        const response = await fetch(url, requestOptions);
        if (!response.ok) throw new Error(`getDownloadLink failed with status ${response.status}`);
        const result = await response.json();
        pdfFile = result.pdfFile;
    } catch (error) {
        console.error(error);
        pdfFile = "";
    }
    return pdfFile;
}

async function buildVoice(containerId){
    const url = `${API_BASE}/v2/containers/${encodeURIComponent(containerId)}/labels/PWaufgaben00000000/contents?isApp=false&isTablet=true&userId=null&isActive=false`;

    let audio;

    const requestOptions = {
        method: "GET",
        redirect: "follow",
        headers: {
            "Accept": "application/json"
        }
    };

    try {
        const response = await fetch(url, requestOptions);
        if (!response.ok) throw new Error(`buildVoice failed with status ${response.status}`);
        const result = await response.json();
        audio = result.html;
    } catch (error) {
        console.error(error);
        audio = "";
    }

    try {
        const parsed = new DOMParser().parseFromString(audio, "text/html");
        const audioEl = parsed.getElementsByTagName("audio")[0];
        if (audioEl) {
            const voiceContainer = document.getElementById("voice");
            voiceContainer.innerHTML = "";
            voiceContainer.appendChild(audioEl);
        }
    } catch (error) {
        console.error(error);
    }
}

window.onload = function() {
    const englishButton = document.getElementsByClassName("englisch")[0];
    if (englishButton) {
        selectSubject(englishButton);
    }
};
