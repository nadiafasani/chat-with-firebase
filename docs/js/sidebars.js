(function() {
    'use strict'
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.forEach(function(tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl)
    })
})()

// gestione all'apertura della sidebar
function openNav() {
    document.getElementById("mySidebar").style.width = "250px";
    document.getElementById("main").style.marginLeft = "250px";
    document.getElementById("message-input").style.marginLeft = "250px";
    document.getElementById("open_nav_button").style.marginLeft = "250px";
    
}

// gestione alla chiusura della sidebar
function closeNav() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
    document.getElementById("message-input").style.marginLeft = "0px";
    document.getElementById("open_nav_button").style.marginLeft = "0px";
}