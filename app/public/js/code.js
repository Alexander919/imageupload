function imageUpload(formId, spinnerId, host) {
    document.getElementById(formId)
        .addEventListener("submit", async function (e) {
            e.preventDefault();

            let spinner = null;
            //show a spinner if uploading is taking too long
            const timer = setTimeout(() => {
                spinner = document.getElementById(spinnerId);
                spinner.classList.remove("hidden");
            }, 1000);

            try {
                const res = await fetch(host, {
                    method: "POST",
                    body: new FormData(this),
                    //headers: {
                    //    "Content-Type": "multipart/form-data",
                    //},
                });
                const data = await res.json();
                //hide a spinner
                if (spinner) spinner.classList.add("hidden");

                clearTimeout(timer);
                window.location = data.redirect;
            } catch (err) {
                console.error(err);
            }
        });

}