function ActivityProfile(location, onProfileChanged, methods) {
    this.locationID = location;
    this.onProfileChanged = onProfileChanged;
    this.methods = methods;
    this.addQuantityInputUI = function () {
        var obj = this;

        var $typeSelect = $('<select></select>');
        var methods = this.methods;
        $typeSelect.empty().append(function () {
            var output = '';
            $.each(methods, function () {
                output += "<option>" + this.type + "</option>";
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

        var $quantityInput = $('<input type="number" min="0" value="0" name="quantity"/>');
        $quantityInput.change(function () {
            obj.onQuantityChanged(this);
        });

        var $unitsInput =
            $('<select>' +
                '<option value="Miles">Miles</option>' +
                '<option value="Ton-Miles">Ton-Miles</option>');
        $unitsInput.change(function () {
            obj.onUnitsChanged(this);
        });
        $unitsInput.attr("name", "units");

        var $removeInput = $('<input type="button" value="X"/>');
        $removeInput.click(function () {
            obj.onRemove(this);
        });

        var row = $(this.locationID).find('tr').last();
        $(row).find('td:eq(1)').append($($quantityInput));
        $(row).find('td:eq(2)').append($($unitsInput));
        $(row).find('td:eq(3)').append($($removeInput));

        this.updateSelectOptions();
    };

    this.getTypeByElement =
        function (input) {
            return $(input).parent().parent().find('select').first().val();
        };

    this.onTypeChanged =
        function (element) {
            $("body").css("cursor", "progress");
            $.each(methods, function () {
                this.active = false;
                this.activityQuantity = 0;
            });
            // Update which types are active
            var obj = this;

            $(this.locationID).find('select[name=type]').each(function () {
                var type = $(this).val();
                var method = $.grep(obj.methods, (function (x) { return (x.type === type); }))[0];
                if (!method) return;
                method.active = true;
                method.activityQuantity = $(this).parent().parent()
                    .find('input[name=quantity]').first().val();

                obj.methods.splice(obj.methods.indexOf(method), 1);
                obj.methods.push(method);
            });
            this.updateSelectOptions();
            this.onProfileChanged();
            $("body").css("cursor", "default");
        };


    // Remove the active options 
    this.updateSelectOptions =
        function () {
            var profile = this;
            var availableOptions = [];
            $.each(profile.methods, function () {
                if (!this.active) availableOptions.push(this.type);
            });
            $(this.locationID).find('select[name=type]').each(function () {
                var value = $(this).val();
                $(this).children('option').each(function () {
                    if ($(this).val() === value || $.inArray($(this).val(), availableOptions) !== -1) {
                        // Change the order because hiding it pushs it to the end
                        var methods = createFreightMethods();
                        var index = -1;
                        for (var i = 0; i < methods.length; ++i)
                            if (methods[i].type === $(this).val())
                                index = i;

                        $(this).insertBefore($(this).parent().find('option:eq(' + index + ')'));
                        $(this).show();
                    }
                    else {
                        $(this).hide();
                    }
                });
            });
        };

    this.onUnitsChanged =
        function (element) {
            $("body").css("cursor", "progress");
            var type = this.getTypeByElement(event.currentTarget);
            var method = $.grep(this.methods, function (x) { return x.type === type; })[0];
            method.activityUnits = event.currentTarget.value;
            this.onProfileChanged();
            $("body").css("cursor", "default");
        };

    this.onQuantityChanged =
        function (element) {
            $("body").css("cursor", "progress");
            var $input = $(event.currentTarget);
            var type = this.getTypeByElement($input);
            var quantity = $input.val();

            $.grep(this.methods, function (x) { return x.type === type; })[0]
                .activityQuantity = quantity;
            this.onProfileChanged();
            $("body").css("cursor", "default");
        };

    this.onRemove =
        function (element) {
            var type = this.getTypeByElement(event.currentTarget);
            var method = $.grep(this.methods, function (x) { return x.type === type; })[0];
            if (method) {
                method.activityQuantity = 0;
                method.percentSmartWay = [0, 0, 0, 0, 0, 0];
                method.active = false;
            }

            this.updateSelectOptions();
            $(element).parent().parent().remove();
            this.onProfileChanged();
        };
}