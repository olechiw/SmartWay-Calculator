function addCheckBox(divName, text)
{
    var checkbox = document.createElement("input")
    checkbox.setAttribute("type", "checkbox")
    checkbox.name = "name"
    var p = document.createElement("p")
    p.appendChild(checkbox)
    document.getElementById(divName).appendChild(p)
}