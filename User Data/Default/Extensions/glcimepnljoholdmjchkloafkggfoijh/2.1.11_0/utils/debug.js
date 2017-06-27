function isDebug() {
    return false;
}

function consoleLog(msg) {
    if (isDebug()) {
        console.log(msg);
    }
}