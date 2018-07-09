function addQuantityInputUI(location,
    onTypeChanged,
    onQuantityChanged,
    onUnitsChanged,
    onRemove) {
    let $typeSelect = $('<select></select>');
    $typeSelect.empty().append(function () {
        let output = '';
        getAvailableActivities().forEach(function (activity) {
            output += "<option>" + activity.type + "</option>";
        });
        return output;
    });
    // Four times <td></td> for <Type, Quant, Units, Remove>
    $(location).append("<tr><td></td><td></td><td></td><td></td></tr>");
    $(location).find('tr').last().find('td').first().append($typeSelect);
    $typeSelect.combobox();
    $typeSelect.change(onTypeChanged);
    $typeSelect.attr("name", "type");

    let $quantityInput = $('<input type="number" min="0"/>');
    $quantityInput.change(onQuantityChanged);

    let $unitsInput =
        $('<select>'
            + '<option value="Miles">Miles</option>'
            + '<option value="Ton-Miles">Ton-Miles</option>');
    $unitsInput.change(onUnitsChanged);
    $typeSelect.attr("name", "units");

    let $removeInput = $('<input type="button" value="X"/>');
    $removeInput.click(onRemove);

    let row = $(location).find('tr').last();
    $(row).find('td:eq(1)').append($($quantityInput));
    $(row).find('td:eq(2)').append($($unitsInput));
    $(row).find('td:eq(3)').append($($removeInput));
    $(row).attr("name", $(location).find("tr").length);
}