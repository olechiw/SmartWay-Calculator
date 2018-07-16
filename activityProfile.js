function ActivityProfile(location, onProfileChanged, methods) {
    this.locationID = location;
    this.onProfileChanged = onProfileChanged;
    this.methods = methods;
    this.addQuantityInputUI = function () {
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
            $('<select>' +
                '<option value="Miles">Miles</option>' +
                '<option value="Ton-Miles">Ton-Miles</option>');
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

        this.updateSelectOptions();
    }

    this.getTypeByElement =
        function (input) {
            return $(input).parent().parent().find('select').first().val();
        }

    this.onTypeChanged =
        function (element) {
            let type = $(element).val();
            this.methods.forEach(function (method) {
                method.active = false;
                method.activityQuantity = 0;
            });
            // Update which types are active
            let obj = this;

            $(this.locationID).find('select[name=type]').each(function () {
                let type = $(this).val();
                let method = obj.methods.find(function (x) { return (x.type === type); });
                if (!method) return;
                method.active = true;
                method.activityQuantity = $(this).parent().parent()
                    .find('input[name=quantity]').first().val();

                obj.methods.splice(obj.methods.indexOf(method), 1);
                obj.methods.push(method);
            });
            this.updateSelectOptions();
            this.onProfileChanged();
        }


    // Remove the active options 
    this.updateSelectOptions =
        function () {
            let profile = this;
            let availableOptions = [];
            profile.methods.forEach(function (method) {
                if (!method.active) availableOptions.push(method.type);
            });
            $(this.locationID).find('select[name=type]').each(function () {
                let value = $(this).val();
                $(this).children('option').each(function () {
                    if ($(this).val() === value || availableOptions.includes($(this).val())) {
                        // Change the order because hiding it pushs it to the end
                        let select = this;
                        let index = createFreightMethods().findIndex(
                            function (x) { return x.type === $(select).val(); });
                        $(this).insertBefore($(this).parent().find('option:eq(' + index + ')'));
                        $(this).show();
                    }
                    else {
                        $(this).hide();
                    }
                })
            });
        };

    this.onUnitsChanged =
        function (element) {
            let type = this.getTypeByElement(event.currentTarget);
            let method = this.methods.find(function (x) { return x.type === type; });
            method.activityUnits = event.currentTarget.value;
            this.onProfileChanged();
        }

    this.onQuantityChanged =
        function (element) {
            let $input = $(event.currentTarget);
            let type = this.getTypeByElement($input);
            let quantity = $input.val();

            this.methods.find(function (x) { return x.type === type; })
                .activityQuantity = quantity;
            this.onProfileChanged();
        }

    this.onRemove =
        function (element) {
            let type = this.getTypeByElement(event.currentTarget);
            let method = this.methods.find(function (x) { return x.type === type; });
            if (method) {
                method.activityQuantity = 0;
                method.percentSmartWay = [0, 0, 0, 0, 0, 0];
                method.active = false;
            }

            this.updateSelectOptions();
            $(element).parent().parent().remove();
            this.onProfileChanged();
        }
}