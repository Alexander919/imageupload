const spinnerId = "spinner";

const makeSpinner = id => {
    const div = document.createElement("div");
    div.id = id;
    div.innerHTML = `
        <h2>Loading...</h2>
    `;
    return div;
};

//TODO: spinner with a progress bar
//https://stackoverflow.com/a/72930021

function showSpinner() {
    let sp = makeSpinner(spinnerId);
    //show a spinner if uploading is taking too long
    const timer = setTimeout(() => {
        document.querySelector("body").appendChild(sp);
    }, 1000);

    return timer;
}

function hideSpinner(timer) {
    //hide a spinner
    const spinner = document.getElementById(spinnerId);
    if (spinner) spinner.remove();
    clearTimeout(timer);
}
//params: path (mandatory); 
//fetchData - object like { method: "POST", body: formData } or undefined (optional)
//params - object like { param1: "bla", param2: "bla bla" } or undefined (optional)
export default async function fetchData(path, fetchObj, params) {
    const searchParams = new URLSearchParams(params);
    const timer = showSpinner(spinnerId);

    return fetch(`http://localhost:3000/${path}/?${searchParams.toString()}`, fetchObj)
        .then(res => {
            hideSpinner(timer);
            return res.json();
        })
        .catch(e => console.error(e));
}