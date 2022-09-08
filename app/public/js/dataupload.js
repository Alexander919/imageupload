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

//params: (<FormData object>, <POST path>)
export default async function uploadData(formData, path) {
    formData.set("fetch", "submitted by fetch function in client"); //let server know that response goes back to fetch
    const timer = showSpinner(spinnerId);

    try {
        const res = await fetch(`http://localhost:3000/${path}`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();

        hideSpinner(timer);

        if(data.render) { //html from the server
            document.querySelector("html").innerHTML = data.render;
        }else if (typeof data.redirect === "string")
            window.location = data.redirect;
    } catch (err) {
        console.dir(err);
        //window.location = "/test";
    } finally {
        hideSpinner(timer);
    }
}