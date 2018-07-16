/*
An object responsible for modeling performance of all carriers, and also constructing/updating a user-interface to match it
*/

function PerformanceProfile(freightMethods, tableID, simpleHeaderID,
    detailedHeaderID, onEmissionsUpdate) {
    // DOM Object for where to put the UI
    this.table = document.getElementById(tableID);
    this.methods = freightMethods;
    this.doDetailed = false;

    this.simpleHeader = document.getElementById(simpleHeaderID);
    this.detailedHeader = document.getElementById(detailedHeaderID);

    this.onEmissionsUpdate = onEmissionsUpdate;
    this.bins = undefined;

    // Toggle whether to do a detailed or simple input
    this.setDetailed = function (detailed) {
        if (detailed) {
            $(this.simpleHeader).hide();
            $(this.detailedHeader).show();
        }
        else {
            $(this.simpleHeader).show();
            $(this.detailedHeader).hide();
        }
        this.doDetailed = detailed;

        this.updateInputUI();
    };

    // Update the input for performance, redoing every row of the table
    this.updateInputUI = function () {
        // Clear table
        $(this.table).empty();

        // For a detailed NON-only row,such as barge, creates 6 readonly inputs
        var detailedNONRowCreator = function (method) {
            var output = "<tr>";
            output += "<td>" + method.type + "</td>";
            output += '<td><input value="100" readOnly="true" type="number"/></td>';
            for (var i = 0; i < 5; ++i)
                output += '<td><input value="0" readOnly="true" type="number"/></td>';
            output += "</tr>";
            return output;
        };
        // For a simple NON-only row,such as barge, creates a select with only 1 option
        var simpleNONRowCreator = function (method) {
            var output = "<tr><td>" + method.type + "</td><td>";
            output += '<select><option value="NON">NON</option></select>';
            output += "</td></tr>";
            return output;
        };
        // One row per type
        for (var t = 0; t < this.methods.length; ++t) {

            var method = this.methods[t];
            if (!method.active) {
                continue;
            }

            // Static, non-smartway only, not detailed
            if ($.inArray(method.type, Model.freightNonOnly) !== -1) {
                if (this.doDetailed) {
                    var $row = $(detailedNONRowCreator(method));
                    $(this.table).append($row);
                }
                else {
                    var $row = $(simpleNONRowCreator(method));
                    $(this.table).append($row);
                }
                method.percentSmartWay[5] = 100;
            }
            // Row of six inputs
            else if (this.doDetailed) {
                var row = document.createElement("tr");

                // Add type header
                var t = document.createElement("th");
                t.appendChild(document.createTextNode(method.type));
                row.appendChild(t);

                // 0,1,2,3,4,5 from best to worst. UI is from worst to best so flip the index with 5-i
                for (var i = 0; i < 6; ++i) {
                    var td = document.createElement("td");
                    var input = document.createElement("input");
                    input.type = "number";
                    input.value = method.percentSmartWay[5 - i];
                    input.min = 0;
                    input.max = 100;

                    var profile = this;
                    input.onchange = function () {
                        // Update the freightmethods model onchange
                        method.percentSmartWay[5 - i] =
                            Number(event.currentTarget.value);
                        profile.updateDetailedTotals();
                        profile.updateEmissionsDetailed();
                        profile.onEmissionsUpdate();
                    };
                    td.appendChild(input);
                    row.appendChild(td);
                }


                this.table.appendChild(row);
            }
            // Simple select
            else {
                var row = document.createElement("tr");

                // Add type label
                var t = document.createElement("th");
                t.appendChild(document.createTextNode(method.type));
                row.appendChild(t);

                // Select which has the 6 bin options
                var select = createGeneralPerformanceSelect();
                select.value = method.smartWayGeneral;
                var profile = this;
                select.onchange = function () {
                    method.smartWayGeneral = event.currentTarget.value;
                    profile.updateEmissionsSimple();
                    profile.onEmissionsUpdate();
                };
                var td = document.createElement("td");
                td.appendChild(select);
                row.appendChild(td);

                this.table.appendChild(row);
            }
        }
    };

    this.updateEmissionsSimple = function () {
        for (var i = 0; i < this.methods.length; ++i) {
            var method = this.methods[i];

            if (!method.active) { continue; }

            // Do simple calculations with units/type/bin
            var bin = this.bins[method.activityUnits][method.type + method.smartWayGeneral];
            var CO2 = bin.CO2;
            var NOX = bin.NOX;
            var PM = bin.PM;
            method.CO2 = CO2 * Number(method.activityQuantity);
            method.NOX = NOX * Number(method.activityQuantity);
            method.PM = PM * Number(method.activityQuantity);
        }
    };

    this.updateEmissionsDetailed = function () {
        for (var i = 0; i < this.methods.length; ++i) {
            var method = this.methods[i];

            // If percentages dont add up, dont re-calculate
            if (method.invalid || !method.active) {
                continue;
            }

            method.CO2 = 0;
            method.NOX = 0;
            method.PM = 0;
            var activity = method.activityQuantity;
            // Iterate through 6 different percents, do calculation for each
            for (var i = 0; i < method.percentSmartWay.length; ++i) {
                var binTag = performanceLevels[i];
                if ($.inArray(method.type, Model.freightNonOnly) !== -1 && binTag != "NON") continue;
                var bin = this.bins[method.activityUnits][method.type + binTag];

                var percent = Number(method.percentSmartWay[i]) * 0.01;
                method.CO2 += Number(activity) * percent * bin.CO2;
                method.NOX += Number(activity) * percent * bin.NOX;
                method.PM += Number(activity) * percent * bin.PM;
            }
        }
    };

    // Update the total levels at the end and the "valid" member of each method
    this.updateDetailedTotals = function () {
        if (!doDetailed) {
            return;
        }
        if (this.table.childElementCount === 0) {
            return;
        }

        // Get the active ones
        var activeFreightMethods = [];
        $.each(this.methods, function () {
            if (this.active) {
                activeFreightMethods.push(this);
            }
        });

        // Do totaling
        for (var i = 0; i < activeFreightMethods.length; ++i) {
            var method = activeFreightMethods[i];
            var row = this.table.rows[i];

            // TOTAL ALREADY THERE - delete it
            if (row.cells.length > 7)
                row.deleteCell(7);

            // Sum all of the percentages
            var sum = method.percentSmartWay.reduce(function (total, num) {
                return total + num;
            });

            var label = document.createTextNode(sum);
            var td = document.createElement("td");
            td.appendChild(label);
            if (sum != 100) {
                td.style.color = "red";
                method.invalid = true;
            }
            else {
                td.style.color = "green";
                method.invalid = false;
            }
            row.appendChild(td);
        }
    };
}