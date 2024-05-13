let containers = [];

let year = null;
let part = null
let download = false;

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
    url = `https://www.schullv.de/api/v2/categories3?url=${url}&categoryId=undefined&isActive=false`;

    const requestOptions = {
        method: "GET",
        redirect: "follow",
        headers: {
            "Content-Type": "application/json",
            "Connection": "keep-alive",
            "Accept": "application/json"
        }
    };

    await fetch(url, requestOptions)
        .then((response) => response.json())
        .then((result) => {
            containers = getContainers(result.id).then(() => buildTreeYear());
            buildTreeYear();
        })
        .catch((error) => console.error(error));


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
        .then((url) => aufgaben.href = url);
    aufgaben.target = "_blank";
    document.getElementById("result").appendChild(aufgaben);

    let lösungen = document.createElement("a");
    lösungen.innerHTML = "Download Lösungen";
    getDownloadLink(containerId, true)
        .then((url) => lösungen.href = url);
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
                if (container.subject.name === "Englisch") buildVoice(container.containerId)
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
    let url = `https://www.schullv.de/api/v2/categories/${categoryId}/light_containers2?isActive=false`;
    
    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    await fetch(url, requestOptions)
        .then((response) => response.json())
        .then((result) => {
            containers = result;
        })
        .catch((error) => console.error(error));

    return containers;
}

async function getDownloadLink(containerId, solution) {
    let url = `https://www.schullv.de/api/v2/containers/${containerId}/labels/${solution ? "PWloesungen" : "PWaufgaben0"}`
            + `0000000/contents?isApp=false&isTablet=true&userId=null&isActive=false`;

    let pdfFile;
    let htmlContent;

    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    await fetch(url, requestOptions)
        .then((response) => response.json())
        .then((result) => {
            pdfFile = result.pdfFile
            htmlContent = result.html
        })
        .catch((error) => console.error(error));
    return pdfFile;
}

async function buildVoice(containerId){
    let url = `https://www.schullv.de/api/v2/containers/${containerId}/labels/PWaufgaben`
        + `00000000/contents?isApp=false&isTablet=true&userId=null&isActive=false`;

    let audio;

    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    await fetch(url, requestOptions)
        .then((response) => response.json())
        .then((result) => audio = result.html)
        .catch((error) => console.error(error));

    try {
        document.getElementById("voice").appendChild(
            new DOMParser()
                .parseFromString(audio, "text/html")
                .getElementsByTagName("audio")[0]
        )
    } catch (error) {

    }

}


window.onload = selectSubject(document.getElementsByClassName("englisch")[0]);



