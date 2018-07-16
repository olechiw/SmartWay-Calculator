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
    }

    // Update the input for performance, redoing every row of the table
    this.updateInputUI = function () {
        // Clear table
        $(this.table).empty();

        // For a detailed NON-only row,such as barge, creates 6 readonly inputs
        let detailedNONRowCreator = function (method) {
            let output = "<tr>";
            output += "<td>" + method.type + "</td>";
            output += '<td><input value="100" readOnly="true" type="number"/></td>';
            for (let i = 0; i < 5; ++i)
                output += '<td><input value="0" readOnly="true" type="number"/></td>';
            output += "</tr>";
            return output;
        };
        // For a simple NON-only row,such as barge, creates a select with only 1 option
        let simpleNONRowCreator = function (method) {
            let output = "<tr><td>" + method.type + "</td><td>";
            output += '<select><option value="NON">NON</option></select>';
            output += "</td></tr>";
            return output;
        };
        // One row per type
        for (let t = 0; t < this.methods.length; ++t) {

            let method = this.methods[t];
            if (!method.active) {
                continue;
            }

            // Static, non-smartway only, not detailed
            if ($.inArray(method.type, Model.freightNonOnly) !== -1) {
                if (this.doDetailed) {
                    let $row = $(detailedNONRowCreator(method));
                    $(this.table).append($row);
                }
                else {
                    let $row = $(simpleNONRowCreator(method));
                    $(this.table).append($row);
                }
                method.percentSmartWay[5] = 100;
            }
            // Row of six inputs
            else if (this.doDetailed) {
                let row = document.createElement("tr");

                // Add type header
                let t = document.createElement("th");
                t.appendChild(document.createTextNode(method.type));
                row.appendChild(t);

                // 0,1,2,3,4,5 from best to worst. UI is from worst to best so flip the index with 5-i
                for (let i = 0; i < 6; ++i) {
                    let td = document.createElement("td");
                    let input = document.createElement("input");
                    input.type = "number";
                    input.value = method.percentSmartWay[5 - i];
                    input.min = 0;
                    input.max = 100;

                    let profile = this;
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
                let row = document.createElement("tr");

                // Add type label
                let t = document.createElement("th");
                t.appendChild(document.createTextNode(method.type));
                row.appendChild(t);

                // Select which has the 6 bin options
                let select = createGeneralPerformanceSelect();
                select.value = method.smartWayGeneral;
                let profile = this;
                select.onchange = function () {
                    method.smartWayGeneral = event.currentTarget.value;
                    profile.updateEmissionsSimple();
                    profile.onEmissionsUpdate();
                };
                let td = document.createElement("td");
                td.appendChild(select);
                row.appendChild(td);

                this.table.appendChild(row);
            }
        }
    }

    this.updateEmissionsSimple = function () {
        for (let i = 0; i < this.methods.length; ++i) {
            let method = this.methods[i];

            if (!method.active) { continue; }

            // Do simple calculations with units/type/bin
            let bin = this.bins[method.activityUnits][method.type + method.smartWayGeneral];
            let CO2 = bin.CO2;
            let NOX = bin.NOX;
            let PM = bin.PM;
            method.CO2 = CO2 * Number(method.activityQuantity);
            method.NOX = NOX * Number(method.activityQuantity);
            method.PM = PM * Number(method.activityQuantity);
        }
    }

    this.updateEmissionsDetailed = function () {
        for (let i = 0; i < this.methods.length; ++i) {
            let method = this.methods[i];

            // If percentages dont add up, dont re-calculate
            if (method.invalid || !method.active) {
                continue;
            }

            method.CO2 = 0;
            method.NOX = 0;
            method.PM = 0;
            let activity = method.activityQuantity;
            // Iterate through 6 different percents, do calculation for each
            for (let i = 0; i < method.percentSmartWay.length; ++i) {
                let binTag = performanceLevels[i];
                if ($.inArray(method.type, Model.freightNonOnly) !== -1 && binTag != "NON") continue;
                let bin = this.bins[method.activityUnits][method.type + binTag];

                let percent = Number(method.percentSmartWay[i]) * 0.01;
                method.CO2 += Number(activity) * percent * bin.CO2;
                method.NOX += Number(activity) * percent * bin.NOX;
                method.PM += Number(activity) * percent * bin.PM;
            }
        }
    }

    // Update the total levels at the end and the "valid" member of each method
    this.updateDetailedTotals = function () {
        if (!doDetailed) {
            return;
        }
        if (this.table.childElementCount === 0) {
            return;
        }

        // Get the active ones
        let activeFreightMethods = [];
        $.each(this.methods, function () {
            if (this.active) {
                activeFreightMethods.push(this);
            }
        });

        // Do totaling
        for (let i = 0; i < activeFreightMethods.length; ++i) {
            let method = activeFreightMethods[i];
            let row = this.table.rows[i];

            // TOTAL ALREADY THERE - delete it
            if (row.cells.length > 7)
                row.deleteCell(7);

            // Sum all of the percentages
            let sum = method.percentSmartWay.reduce(function (total, num) {
                return total + num;
            });

            let label = document.createTextNode(sum);
            let td = document.createElement("td");
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
    }
}