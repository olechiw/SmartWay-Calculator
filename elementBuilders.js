var performanceLevels = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "NON"
]

// Create the full-click checkbox format
function createCheckBox(label) {
    var labelElement = document.createElement("label")
    var checkboxElement = document.createElement("input")
    checkboxElement.name = "checkbox";
    checkboxElement.type = "checkbox"
    labelElement.textContent = label
    labelElement.classList.add("multiCheckBox", "inlineBlock")
    labelElement.appendChild(checkboxElement)
    return labelElement
}

// Create a table data cell from text
function createTableCell(text) {
    let textNode = document.createTextNode(text)
    let td = document.createElement("td")
    td.appendChild(textNode)
    return td
}

// Create a table row, populated with input forms, takes a variable amount of arguments
function createTableRow() {
    var tableRowElement = document.createElement("tr")
    if (arguments.length > 0) {
        for (let i = 0; i < arguments.length; ++i) {
            let arg = arguments[i]
            var td = document.createElement("td")
            td.appendChild(arg)
            td.style.padding = "8px"
            tableRowElement.appendChild(td)
        }
    }
    return tableRowElement
}

// Dropdown menu for the performance levels
function createGeneralPerformanceSelect() {
    let select = document.createElement("select")

    performanceLevels.forEach(function (rank) {
        let option = document.createElement("option")
        option.textContent = rank
        option.value = rank
        select.appendChild(option)
    })
    return select
}