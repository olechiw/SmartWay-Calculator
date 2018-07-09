class ActivityProfile {
    constructor(location, onProfileChanged, methods) {
        this.locationID = location;
        this.onProfileChanged = onProfileChanged;
        this.methods = methods;
    }

    addQuantityInputUI() {
        let obj = this;

        let $typeSelect = $('<select></select>');
        let methods = this.methods;
        $typeSelect.empty().append(function () {
            let output = '';
            methods.forEach(function (method) {
                output += "<option>" + method.type + "</option>";
            });
            return output;
        });
        // Four times <td></td> for <Type, Quant, Units, Remove>
        $(this.locationID).append("<tr><td></td><td></td><td></td><td></td></tr>");
        $(this.locationID).find('tr').last().find('td').first().append($typeSelect);
        $typeSelect.combobox();
        $typeSelect.change(function () {
            obj.onTypeChanged(this);
        });
        $typeSelect.attr("name", "type");

        let $quantityInput = $('<input type="number" min="0" value="0" name="quantity"/>');
        $quantityInput.change(function () {
            obj.onQuantityChanged(this);
        });

        let $unitsInput =
            $('<select>'
                + '<option value="Miles">Miles</option>'
                + '<option value="Ton-Miles">Ton-Miles</option>');
        $unitsInput.change(function () {
            obj.onUnitsChanged(this);
        });
        $unitsInput.attr("name", "units");

        let $removeInput = $('<input type="button" value="X"/>');
        $removeInput.click(function () {
            obj.onRemove(this);
        });

        let row = $(this.locationID).find('tr').last();
        $(row).find('td:eq(1)').append($($quantityInput));
        $(row).find('td:eq(2)').append($($unitsInput));
        $(row).find('td:eq(3)').append($($removeInput));
    }

    getTypeByElement(input) {
        return $(input).parent().parent().find('select').first().val();
    }

    onTypeChanged(element) {
        let type = $(element).val();
        this.methods.forEach(function (method) {
            method.active = false;
            method.activityQuantity = 0;
        });
        // Update which types are active
        let obj = this;

        $(this.locationID).find('select[name=type]').each(function () {
            let type = obj.getTypeByElement(this);
            let method = obj.methods.find(x => x.type === type);
            method.active = true;
            method.activityQuantity = $(this).parent().parent()
            .find('input[name=quantity]').first().val();
        });
        this.onProfileChanged();
    }

    onUnitsChanged(element) {
        let type = this.getTypeByElement(event.currentTarget);
        let method = this.methods.find(x => x.type === type);
        method.activityUnits = event.currentTarget.value;
        this.onProfileChanged();
    }

    onQuantityChanged(element) {
        let $input = $(event.currentTarget);
        let type = this.getTypeByElement($input);
        let quantity = $input.val();

        this.methods.find(x => x.type === type)
            .activityQuantity = quantity;
        this.onProfileChanged();
    }

    onRemove(element) {
        let type = this.getTypeByElement(event.currentTarget);
        let method = this.methods.find(x => x.type === type);
        method.active = false;

        $(element).parent().parent().remove();
        this.onProfileChanged();
    }
}