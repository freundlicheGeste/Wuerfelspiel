function debugLog(msg) {
    let el = document.getElementById("debugLog");
    if (!el) {
        el = document.createElement("div");
        el.id = "debugLog";
        el.style.position = "fixed";
        el.style.bottom = "0";
        el.style.left = "0";
        el.style.right = "0";
        el.style.maxHeight = "40%";
        el.style.overflow = "auto";
        el.style.background = "rgba(0,0,0,0.3)";
        el.style.color = "#0f0";
        el.style.fontSize = "12px";
        el.style.padding = "6px";
        el.style.zIndex = "9999";
        document.body.appendChild(el);
    }

    el.innerHTML += `<div>${msg}</div>`;
}