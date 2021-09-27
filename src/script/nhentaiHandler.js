const electron = require("electron");
const ipc = electron.ipcRenderer;

var code = $("#code");

// When submit, open dialog to get filepath
$("#submit").on("click", () => {
    // Validate input
    if (!code.val() || isNaN(code.val())) {
        displayErrorInput();
        return;
    }

    // Display Loading...
    displayLoading();

    // Open dialod
    ipc.send("openF");
});

// Dialog Result
ipc.on("filepaths", function (event, message) {
    // If user didn't choose valid pathname => display Error
    if (message == undefined || message.length === 0) {
        displayError();
        return;
    }

    // Download file
    ipc.send("writeFiles", code.val(), message[0]);
});

// If result is error => display Error
ipc.on("error", displayError);

// If result is done => display Done
ipc.on("done", displayDone);

// Handle display...
function displayError() {
    $("#loading").addClass("d-none");
    $("#error").removeClass("d-none");
    $("#submit").attr("disabled", false);
}

function displayErrorInput() {
    $("#loading").addClass("d-none");
    $("#error-input").removeClass("d-none");
    $("#submit").attr("disabled", false);
}

function displayDone() {
    $("#loading").addClass("d-none");
    $("#success").removeClass("d-none");
    $("#submit").attr("disabled", false);
}

function displayLoading() {
    $("#success").addClass("d-none");
    $("#error").addClass("d-none");
    $("#error-input").addClass("d-none");

    $("#submit").attr("disabled", true);
    $("#loading").removeClass("d-none");
}
