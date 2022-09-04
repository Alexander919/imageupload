//a global Map of all Files
//map: id -> File
const FilesMap = new Map();

//const id = Array.from({length: 1000000}, () => `${Date.now()}${Math.random().toString(16).slice(2)}`);
//console.log((new Set(id)).size); //1000000
//generate unique id(tested with 1 million entries)
function getRandomId() {
    return `${Date.now()}${Math.random().toString(16).slice(2)}`;
}

//params: <form element>, <name of file input>
//return FormDate object
export function updateFileInput(form, fileInputName) {
    //const fileInput = this.form.querySelector("input[type='file']");
    //const fileInputName = fileInput.getAttribut("name");
    //this.formData = new FormData(this);

    //this.formData.delete(fileInputName);
    //FilesMap.forEach(file => this.formData.append(fileInputName, file));

    //modify the form's fileInput to represent the FilesMap
    const formData = new FormData(form);
    formData.delete(fileInputName);
    FilesMap.forEach(file => formData.append(fileInputName, file));
    return formData;

//update <input type="file">.files to represent the FilesMap
//    const dataTransfer = new DataTransfer();
//    FilesMap.forEach(file => dataTransfer.items.add(file));
//    //update contents of the file-input element
//    fileElem.files = dataTransfer.files;
}

//TODO: get rid of addEventListener and return a function instead
//TODO: rename to displayImagesToUpload
//TODO: pass in obj with form element instead of fileInput
export function setupDisplayImagesToUpload(fileInput, div) {
    //TODO: implement images drag and drop event

    //const { form } = obj; 
    //form.addEventListener("submit", updateFileInput.bind(obj));
    //return function() { ... }

    //triggered when we 'Open' new images
    fileInput.addEventListener("change", function() {
        //add new Files to FilesMap
        for (let file of this.files) {
            FilesMap.set(getRandomId(), file);
        }

        console.log(FilesMap);

        if (FilesMap.size) {
            const { html } = getImagesHTML(FilesMap);
            div.innerHTML = html;
            //If multiple identical EventListeners are registered on the same EventTarget with the same parameters the duplicate instances are discarded. 
            //They do not cause the EventListener to be called twice and since they are discarded they do not need to be removed with the removeEventListener method.
            div.querySelectorAll(".delete").forEach(delElement => {
                delElement.addEventListener("click", function() {
                    const imageEl = this.closest(".image"); //get the closest .image node
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
            </div>
        `
    };
}