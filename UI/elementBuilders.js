var performanceLevels = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "NON"
];

// Create a table data cell from text
function createTableCell(text) {
    var textNode = document.createTextNode(text);
    var td = document.createElement("td");
    td.appendChild(textNode);
    return td;
}

// Create a table row, populated with input forms, takes a variable amount of arguments
function createTableRow() {
    var tableRowElement = document.createElement("tr");
    if (arguments.length > 0) {
        for (var i = 0; i < arguments.length; ++i) {
            var arg = arguments[i];
            var td = document.createElement("td");
            td.appendChild(arg);
            tableRowElement.appendChild(td);
        }
    }
    return tableRowElement;
}

// Dropdown menu for the performance levels
function createGeneralPerformanceSelect() {
    var select = document.createElement("select");

    $.each(performanceLevels, function () {
        var option = document.createElement("option");
        option.textContent = this;
        option.value = this;
        select.appendChild(option);
    });
    return select;
}