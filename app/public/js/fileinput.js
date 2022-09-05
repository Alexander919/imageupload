
import  displayImagesToUpload from "/js/fileimages.js"
//get query string key-value pairs
const entries = (new URL(import.meta.url)).searchParams.entries();

const body = {};
for(const [ key, value ] of entries) {
    body[key] = value;
}

const { form: formId, file, list, select } = body;

const fileElem = document.getElementById(file);
const fileSelect = document.getElementById(select);
const fileList = document.getElementById(list);
const form = document.getElementById(formId);

if(fileSelect) {
    fileSelect.addEventListener("click", e => {
        e.preventDefault(); // prevent navigation to "#"
        if (fileElem) fileElem.click();
    });
}

//will also add submit event to the form
fileElem.addEventListener("change", displayImagesToUpload(form, fileList));