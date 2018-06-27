// File for all of the performance rankings and their corresponding pollution coeffecients

var smartwayBinJSON = undefined;

var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200)
    {
        smartwayBinJSON = JSON.parse(this.responseText)
    }
}
xmlhttp.open("GET", "smartwayBin.json")
xmlhttp.send()