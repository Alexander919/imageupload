const spinnerId = "loading";

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

export async function uploadFiles(form, path) {
    const { spinner, timer } = showSpinner(spinnerId);

    try {
        const res = await fetch(`http://localhost:3000/${path}`, {
            method: "POST",
            body: new FormData(form),
        });
        const data = await res.json();

        hideSpinner(spinner, timer);

        if (typeof data.redirect === "string")
            window.location = data.redirect;
    } catch (err) {
        console.error(err);
    }
}