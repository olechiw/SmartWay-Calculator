// File for all of the performance rankings and their corresponding pollution coeffecients

var smartwayBinJSON = undefined;

var xmlhttp = new XMLHttpRequest();
xmlhttp.onload = function () {
    smartwayBinJSON = JSON.parse(xmlhttp.responseText)
}
xmlhttp.open("GET", "smartwayBins.json")
xmlhttp.send()