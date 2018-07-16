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
    let textNode = document.createTextNode(text);
    let td = document.createElement("td");
    td.appendChild(textNode);
    return td;
}

// Create a table row, populated with input forms, takes a variable amount of arguments
function createTableRow() {
    var tableRowElement = document.createElement("tr");
    if (arguments.length > 0) {
        for (let i = 0; i < arguments.length; ++i) {
            let arg = arguments[i];
            var td = document.createElement("td");
            td.appendChild(arg);
            td.style.padding = "8px";
            tableRowElement.appendChild(td);
        }
    }
    return tableRowElement;
}

// Dropdown menu for the performance levels
function createGeneralPerformanceSelect() {
    let select = document.createElement("select");

    $.each(performanceLevels, function () {
        let option = document.createElement("option");
        option.textContent = this;
        option.value = this;
        select.appendChild(option);
    });
    return select;
}