const spinnerId = "notify-message";

function showSpinner(spinnerId) {
    let spinner = null;
    //show a spinner if uploading is taking too long
    const timer = setTimeout(() => {
        spinner = document.getElementById(spinnerId);
        spinner.classList.remove("hidden");
    }, 1000);

    return { spinner, timer };
}

function hideSpinner(spinner, timer) {
    //hide a spinner
    if (spinner) spinner.classList.add("hidden");
    clearTimeout(timer);
}

function createSubmitImageUploadEvent(formId, path, func, ...params) {

    document.getElementById(formId).addEventListener("submit", async function(e) {
        //prevent form submission
        e.preventDefault();

        if(func)
            func(...params);

        const { spinner, timer } = showSpinner(spinnerId);

        try {
            const res = await fetch(`http://localhost:3000/${path}`, {
                method: "POST",
                body: new FormData(this),
                //headers: {
                //    "Content-Type": "multipart/form-data",
                //},
            });
            const data = await res.json();

            hideSpinner(spinner, timer);

            if (typeof data.redirect === "string")
                window.location = data.redirect;
        } catch (err) {
            console.error(err);
        }
    });
}