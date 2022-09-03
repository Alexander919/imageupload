//create a global Map of all Files
//map: id -> File
const FilesMap = new Map();

let fileElem, fileSelect, fileList;
//register submit event
//params: (<form id>, <POST path>, [[func to run before fetch], [params to func]])
//createSubmitImageUploadEvent("editForm", "edit", updateFileInput, FilesMap, fileElem);

//update <input type="file">.files to represent the FilesMap
export function updateFileInput() {
    const dataTransfer = new DataTransfer();
    FilesMap.forEach(file => dataTransfer.items.add(file));
    //update contents of the file-input element
    fileElem.files = dataTransfer.files;
}

export function displayImagesToUpload(fileInput, selectLink, imagesList) {
    fileElem = document.getElementById(fileInput);
    fileSelect = document.getElementById(selectLink);
    fileList = document.getElementById(imagesList);

    fileSelect.addEventListener("click", e => {
        e.preventDefault(); // prevent navigation to "#"
        if (fileElem) fileElem.click();
    });

    //triggered when we 'Open' new images
    fileElem.addEventListener("change", function () {
        //add new Files to FilesMap
        for (let file of this.files) {
            //const id = Array.from({length: 1000000}, () => `${Date.now()}${Math.random().toString(16).slice(2)}`);
            //console.log((new Set(id)).size); //1000000
            //generate unique id(tested with 1 million entries)
            const id = `${Date.now()}${Math.random().toString(16).slice(2)}`;
            FilesMap.set(id, file);
        }

        console.log(FilesMap);

        if (FilesMap.size) {
            const { html } = getImagesHTML(FilesMap);
            fileList.innerHTML = html;
            //If multiple identical EventListeners are registered on the same EventTarget with the same parameters the duplicate instances are discarded. 
            //They do not cause the EventListener to be called twice and since they are discarded they do not need to be removed with the removeEventListener method.
            fileList.querySelectorAll(".delete").forEach(delElement => {
                delElement.addEventListener("click", function () {
                    const imageEl = this.closest(".image");
                    const id = imageEl.dataset.id;
                    //remove the div with class .image from the DOM
                    imageEl.remove();
                    //on delete modify the global map of Files
                    FilesMap.delete(id);
                });
            });
        }
    });
}




function getImagesHTML(filesMap) {
    //Array.from(Iterable, mapFn)
    const html = Array.from(filesMap, ([id, file]) => {
        return `
                <div class="image" data-id="${id}">
                    <span class="delete">&#9851;</span>
                    <div>
                        <ul>
                            <li>Name: ${file.name} </li>
                            <li>Size: ${file.size} </li>
                        </ul>
                        <div>
                            <img height="100" onload="${URL.revokeObjectURL(file.src)}" src="${URL.createObjectURL(file)}">
                            <br>
                        </div>
                    </div>
                </div>
                `;
    });

    return {
        html: `
                <div class="images">
                    ${html.join("\n")}
                </div>`
    };
}