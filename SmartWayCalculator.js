// Class which represents a single carrier type for either current or target activity
function CarrierModel(name) {
    // Carrier type
    this.type = name;
    // Whether it is currently used in UI
    this.active = false;
    // Whether the detailed percentages are invalid (not 100) or not
    this.invalid = false;

    // The activity units (Ton-Miles or Miles) and the corresponding scalar
    this.activityUnits = "Miles";
    this.activityQuantity = 0;

    // The current calculated amounts of pollution
    this.CO2 = 0;
    this.NOX = 0;
    this.PM = 0;

    // The general ranking, string value used to query Bin JSON
    this.smartWayGeneral = "NON";
    // The specific smartway usage, from Bin 1 to NON
    this.percentSmartWay = [0, 0, 0, 0, 0, 0];
}

// Class which handles the UI/input for performance levels, and runs calculations
function PerformanceInput(carriers, tableID, simpleHeaderID,
    detailedHeaderID, onEmissionsUpdate) {
    // DOM Object for where to put the UI
    this.table = jQuery(tableID);
    this.carriers = carriers;
    this.doDetailed = false;

    this.simpleHeader = jQuery(simpleHeaderID);
    this.detailedHeader = jQuery(detailedHeaderID);
    jQuery(this.detailedHeader).hide();

    this.onEmissionsUpdate = onEmissionsUpdate;

    // Toggle whether to do a detailed or simple input
    this.setDetailed = function (detailed) {
        // Show the correct table header
        if (detailed) {
            this.simpleHeader.hide();
            this.detailedHeader.show();
        } else {
            this.simpleHeader.show();
            this.detailedHeader.hide();
        }
        // Store the value
        this.doDetailed = detailed;

        // Recompute all the input boxes
        this.rebuildInputUI();
    };

    // Update the input fields, redoing every row of the table
    this.rebuildInputUI = function () {
        // Clear table
        jQuery(this.table).empty();

        // For a detailed NON-only row,such as barge, creates 6 readonly inputs
        var detailedNONRowCreator = function (carrier) {
            var output = "<tr>";
            output += "<th>" + carrier.type + "</th>";
            output +=
                '<td><input style="width:3em;" value="100" min="0" max="100" maxlength="3" readOnly="true" type="number"/></td>';
            for (var i = 0; i < 6; ++i)
                output +=
                '<td><input style="width:3em;" value="0" readOnly="true" type="number" min="0" max="100" maxlength="3"/></td>';
            output += "</tr>";
            return jQuery(output);
        };
        // For a simple NON-only row,such as barge, creates a select with only 1 option
        var simpleNONRowCreator = function (carrier) {
            var output = "<tr><th>" + carrier.type + "</th><td>";
            output += '<select class="form-select"><option value="NON">NON</option></select>';
            output += "</td></tr>";
            return jQuery(output);
        };
        var profile = this;
        // Function builder for when a detailed input changes
        var detailedChangeBuilder = function (carrier, inputIndex) {
            return function () {
                // Update the carriers model onchange
                carrier.percentSmartWay[5 - inputIndex] =
                    Number(event.currentTarget.value);
                profile.updateDetailedTotals();
                profile.onEmissionsUpdate();
            };
        };
        // Function builder for when a simple input changes (select)
        var simpleChangeBuilder = function (carrier) {
            return function () {
                carrier.smartWayGeneral = event.currentTarget.value;
                profile.onEmissionsUpdate();
            };
        };

        var optionAdder = function (select) {
            return function (text) {
                var option = jQuery('<option value="' + this.toString() + '">' + this.toString() +
                    '</option>');
                select.append(option);
            };
        };


        // One row per type
        for (var t = 0; t < this.carriers.length; ++t) {
            var carrier = this.carriers[t];
            if (!carrier.active || !carrier) {
                continue;
            }

            // If it is NON-Smartway only (rail, barge, etc.) then it needs to be readonly
            if (jQuery.inArray(carrier.type, Model.NonSmartwayCarriers) !== -1) {
                if (this.doDetailed) {
                    jQuery(this.table).append(detailedNONRowCreator(carrier));
                } else {
                    jQuery(this.table).append(simpleNONRowCreator(carrier));
                }
                carrier.percentSmartWay[5] = 100;
            }
            // Row of six inputs
            else if (this.doDetailed) {
                var detailedRow = jQuery("<tr></tr>");

                // Add type header
                var th = jQuery("<th>" + carrier.type + "</td>");
                detailedRow.append(th);

                // 0,1,2,3,4,5 from best to worst. UI is from worst to best so flip the index with 5-i
                for (var i = 0; i < 6; ++i) {
                    var td = jQuery("<td></td>");
                    var input = jQuery(
                        '<input type="number" min="0" max="100" maxLength="3" style="width:3em"></input>');
                    // Inverted because theyre stored in the opposite order
                    jQuery(input).val(carrier.percentSmartWay[5 - i]);

                    input.on('change keyup', detailedChangeBuilder(carrier, i));
                    td.append(jQuery(input));
                    detailedRow.append(td);
                }

                // Blank totals row
                jQuery(detailedRow).append('<td><b>0</b></td>');

                jQuery(this.table).append(detailedRow);
            }
            // Simple select
            else {
                var simpleRow = jQuery("<tr></tr>");

                // Add type label
                var thSimple = jQuery("<th>" + carrier.type + "</th>");
                simpleRow.append(thSimple);

                // Select which has the 6 bin options (stored in performancelevels array)
                var select = jQuery('<select class="form-select"></select>');

                jQuery.each(Model.PerformanceLevels, optionAdder(select));

                select.val(carrier.smartWayGeneral);
                select.change(simpleChangeBuilder(carrier));
                var selectTD = jQuery("<td></td>");
                selectTD.append(select);
                simpleRow.append(selectTD);

                jQuery(this.table).append(simpleRow);
            }
        }
        if (this.doDetailed) this.updateDetailedTotals();
    };

    // Update the total levels at the end and the "valid" member of each carrier
    this.updateDetailedTotals = function () {
        if (!jQuery("#doDetailed").prop("checked")) return;
        if (this.table.childElementCount === 0) {
            return;
        }

        // Get the active ones
        var activeCarriers = [];
        jQuery.each(this.carriers, function () {
            if (this.active) {
                activeCarriers.push(this);
            }
        });

        // Do totaling
        for (var i = 0; i < activeCarriers.length; ++i) {
            var carrier = activeCarriers[i];
            var row = this.table.children("tr:eq(" + i + ")");
            if (!row) continue;

            var td = row.children("th,td").last();

            // Sum all of the percentages
            var sum = carrier.percentSmartWay.reduce(function (total, num) {
                return total + num;
            });
            td.html("<b>" + sum + "</b>");
            // If computed value is invalid, mark that on the carrier for state checks
            if (sum === 100) {
                carrier.invalid = false;
            } else {
                carrier.invalid = true;
            }
            jQuery(row).append(td);
        }
    };
}

// Class which handles the UI/input for activity quantity input, including adding new activities
function ActivityInput(location, onProfileChanged, carriers,
    typeChange, typeSet, unitsChange, quantityChange) {
    this.locationID = location;
    this.onProfileChanged = onProfileChanged;
    this.carriers = carriers;

    this.typeChange = typeChange;
    this.unitsChange = unitsChange;
    this.quantityChange = quantityChange;
    this.typeSet = typeSet; // For when the type is set for the FIRST TIME ONLY
    this.promptText = "--- Select Carrier Type ---";
    this.addQuantityInputUI = function () {
        var obj = this;

        var typeSelect = jQuery('<select class="form-select"></select>');
        var carriers = this.carriers;
        typeSelect.empty().append(function () {
            var output = '<option>' + obj.promptText + '</option>';
            jQuery.each(carriers, function () {
                output += "<option>" + this.type + "</option>";
            });
            return output;
        });
        // Four times <td></td> for <Type, Quant, Units, Remove>
        jQuery(this.locationID).append("<tr><th></th><td></td><td></td><td></td></tr>");
        jQuery(this.locationID).find('tr').last().children("th:eq(0)").append(typeSelect);
        typeSelect.attr("haschanged", "false");
        typeSelect.change(function () {
            obj.onTypeChanged(this);
            jQuery(this).attr("haschanged", "true");
        });
        typeSelect.attr("name", "type");

        // Quantity number input
        var quantityInput = jQuery(
            '<input class="form-text" style="max-width:10em;" type="number" min="0" value="0" name="quantity"/>'
        );
        quantityInput.on('change keyup', function () {
            obj.onQuantityChanged(this);
        });

        // Select for the units
        var unitsInput =
            jQuery('<select class="form-select" style="max-width:7em;min-width:7em;">' +
                '<option value="Miles">Miles</option>' +
                '<option value="Ton-Miles">Ton-Miles</option>');
        unitsInput.change(function () {
            obj.onUnitsChanged(this);
        });
        unitsInput.attr("name", "units");

        var removeInput = jQuery('<input type="button" value="X" style="margin:0px;width:100%;"/>');
        removeInput.click(function () {
            obj.onRemove(this);
        });

        var row = jQuery(this.locationID).find('tr').last();
        jQuery(row).find('td:eq(0)').append(quantityInput);
        jQuery(row).find('td:eq(1)').append(unitsInput);
        jQuery(row).find('td:eq(2)').append(removeInput);

        this.updateSelectOptions();
    };

    this.getTypeByElement =
        function (input) {
            return jQuery(input).parent().parent().find('select').first().val();
        };

    // Fires when the type select value changes
    this.onTypeChanged =
        function (element, wasManual) {
            jQuery("body").css("cursor", "progress");
            // Clear all active carriers
            jQuery.each(carriers, function () {
                this.active = false;
                this.activityQuantity = 0;
            });
            var obj = this;

            // Update which types are active, and update their activityQuantity values
            jQuery(this.locationID).find('select[name=type]').each(function () {
                var type = jQuery(this).val();
                var carrier = jQuery.grep(obj.carriers, (function (x) {
                    return (x.type === type);
                }))[0];
                if (!carrier) return;

                carrier.active = true;
                carrier.activityQuantity = jQuery(this).parent().parent()
                    .find('input[name=quantity]').first().val();

                obj.carriers.splice(obj.carriers.indexOf(carrier), 1);
                obj.carriers.push(carrier);
            });
            this.updateSelectOptions();

            if (!wasManual) {
                this.typeChange(jQuery(element).parent().parent().index(), jQuery(element).val());
                this.onProfileChanged();

                if (jQuery(element).attr("haschanged") === "false") {
                    if (this.typeSet)
                        this.typeSet();
                }
            } else if (wasManual)
                jQuery(element).attr("haschanged", "true");

            jQuery("body").css("cursor", "default");
        };

    // A manual type set which updates the UI and the carrier
    this.setType =
        function (index, val) {

            var element = jQuery(this.locationID + " > tr:eq(" + index + ")")
                .find("select[name=type]").first();
            element.val(val);
            this.onTypeChanged(element, true);
        };

    // A manual units set which updates the UI and the carrier
    this.setUnits =
        function (index, val) {
            var element = jQuery(this.locationID + " > tr:eq(" + index + ")")
                .find("select[name=units]").first();
            element.val(val);
            this.onUnitsChanged(element, true);
        };

    // A manual quantity set which updates the UI and the carrier
    this.setQuantity =
        function (index, val) {
            var element = jQuery(this.locationID + " > tr:eq(" + index + ")")
                .find("input[type=number]").first();
            element.val(val);
            this.onQuantityChanged(element, true);
        };


    // Remove the active carriers as, keeping people from selecting twice for current or twice for target
    this.updateSelectOptions =
        function () {
            var profile = this;
            var availableOptions = [];
            jQuery.each(profile.carriers, function () {
                if (!this.active) availableOptions.push(this.type);
            });
            jQuery(this.locationID).find('select[name=type]').each(function () {
                var value = jQuery(this).val();
                // Remove the prompt text if it was not selected again
                if (jQuery(this).children("option").first().val() === profile.promptText && value !==
                    profile.promptText) {
                    jQuery(this).children("option").first().remove();
                }

                jQuery(this).children('option').each(function () {
                    if (jQuery(this).val() === value || jQuery.inArray(jQuery(this).val(),
                            availableOptions) !== -1) {
                        // Change the order because hiding it pushs it to the end
                        var index = -1;
                        for (var i = 0; i < Model.CarrierTypes.length; ++i)
                            if (Model.CarrierTypes[i] === jQuery(this).val())
                                index = i;

                        if (index !== 0)
                            // This fixes some reordering that goes on, but not entirely
                            jQuery(this).insertBefore(jQuery(this).parent().find('option:eq(' +
                                index + ')'));
                        jQuery(this).show();
                    } else {
                        jQuery(this).hide();
                    }
                });
            });
        };

    this.onUnitsChanged =
        function (element, wasManual) {
            jQuery("body").css("cursor", "progress");
            var type = this.getTypeByElement(event.currentTarget);
            var carrier = jQuery.grep(this.carriers, function (x) {
                return x.type === type;
            })[0];
            if (carrier)
                carrier.activityUnits = event.currentTarget.value;
            if (!wasManual) {
                if (this.unitsChange) this.unitsChange(
                    jQuery(element).parent().parent().index(),
                    jQuery(element).val());
                this.onProfileChanged();
            }
            jQuery("body").css("cursor", "default");
        };

    this.onQuantityChanged =
        function (element, wasManual) {
            jQuery("body").css("cursor", "progress");
            var jQueryinput = jQuery(event.currentTarget);
            var type = this.getTypeByElement(jQueryinput);
            var quantity = jQueryinput.val();

            var carrier = jQuery.grep(this.carriers, function (x) {
                return x.type === type;
            })[0];
            if (carrier) carrier.activityQuantity = quantity;
            if (!wasManual) {
                if (this.quantityChange) {
                    this.quantityChange(
                        jQuery(element).parent().parent().index(),
                        jQuery(element).val());
                }
                this.onProfileChanged();
            }
            jQuery("body").css("cursor", "default");
        };

    // When the remove button is clicked
    this.onRemove =
        function (element) {
            var type = this.getTypeByElement(event.currentTarget);
            if (type === this.promptText) {
                return;
            }
            var carrier = jQuery.grep(this.carriers, function (x) {
                return x.type === type;
            })[0];
            if (carrier) {
                carrier.activityQuantity = 0;
                carrier.percentSmartWay = [0, 0, 0, 0, 0, 0];
                carrier.active = false;
            }

            this.updateSelectOptions();
            jQuery(element).parent().parent().remove();
            this.onProfileChanged();
        };
}

var Model = {};
var UI = {};

jQuery(document).ready(function () {

    var JSON_URL = "smartway_bins_formatted.json";

    // Global freight model
    Model = {
        // The available general performance bins
        PerformanceLevels: [
            "1",
            "2",
            "3",
            "4",
            "5",
            "NON"
        ],
        // Carrier types which are only NON smartway tier
        NonSmartwayCarriers: [
            "Rail",
            "Barge",
            "Air-Long Haul",
            "Air-Short Haul"
        ],
        // Types of carriers
        CarrierTypes: [
            "Auto Carrier Trucking",
            "Dray Trucking",
            "Expedited Trucking",
            "Flatbed Trucking",
            "Heavy and Bulk Trucking",
            "LTL/Dry Van",
            "Mixed Trucking",
            "Moving Van Trucking",
            "Package Delivery Trucking",
            "Refrigerated Trucking",
            "Specialty Haul Trucking",
            "Tanker Trucking",
            "TL/Dry Van",
            "Logistics",
            "Multimodal",
            "Rail", //NON-ONLY, JSON data only needs to have a NON child
            "Barge", //NON-ONLY
            "Air-Long Haul", //NON-ONLY
            "Air-Short Haul" //NON-ONLY
        ],
        // The bins object, loaded from smartway_bins_formatted_0.json
        Bins: {}
    };
    // Create a carrier model for each type
    var createCarriers = function () {
        var result = [];
        if (Model.CarrierTypes) {
            jQuery.each(Model.CarrierTypes, function () {
                result.push(new CarrierModel(this.toString()));
            });
        }
        return result;
    };

    // The current carriers and usage input into the model
    Model.CurrentCarriers = createCarriers();
    // The target or goal carriers
    Model.TargetCarriers = createCarriers();

    // Start loading the bins data right away
    jQuery.getJSON(JSON_URL, function (data) {
        Model.Bins = data;

        // The begin button, here so that the user cannot continue without the bins
        jQuery("#hideIntro").click(function () {
            if (jQuery("#doDetailed").prop("checked")) {
                jQuery("#introDiv").hide();
                jQuery("[id^=detailedHeader]").show();
                jQuery("#appDiv").show();
                updateOutput();
                window.scrollTo(0, 0);
            } else if (jQuery("#doBasic").prop("checked")) {
                jQuery("#introDiv").hide();
                jQuery("[id^=basicHeader]").show();
                jQuery("#appDiv").show();
                updateOutput();
                window.scrollTo(0, 0);
            } else {
                alert("Please choose either basic or detailed Bin rankings!");
            }
        });
    });

    // Event for type set on UI.currentActivity, sync to UI.targetActivity
    var onCurrentTypeSet = function (index, val) {
        if (UI.targetActivity)
            UI.targetActivity.setType(index, val);
    };
    // Event for units set on UI.currentActivity, sync to UI.targetActivity
    var onCurrentUnitsSet = function (index, val) {
        if (UI.targetActivity)
            UI.targetActivity.setUnits(index, val);
    };
    // Event for activity set on UI.currentActivity, sync to UI.targetActivity
    var onCurrentQuantitySet = function (index, val) {
        if (UI.targetActivity)
            UI.targetActivity.setQuantity(index, val);
    };
    // When the add button for current activity input is clicked
    var addCurrentActivity = function () {
        if (UI.currentActivity)
            UI.currentActivity.addQuantityInputUI();
        if (jQuery("#currentQuantityTable > tr").length > jQuery("#targetQuantityTable > tr").length)
            addTargetActivity();
    };
    // When the add button for target activity input is clicked
    var addTargetActivity = function () {
        if (UI.targetActivity)
            UI.targetActivity.addQuantityInputUI();
    };

    // Object handling input for the CURRENT performance rankings
    UI.currentPerformance = new PerformanceInput(Model.CurrentCarriers,
        "#currentPerformanceTable", "#currentSimpleHeader",
        "#currentDetailedHeader", updateOutput);
    // Object handling input for the CURRENT activity
    // For CURRENT the event handlers like settype update the target model, for a one-way sync
    UI.currentActivity = new ActivityInput("#currentQuantityTable",
        onActivityChanged, Model.CurrentCarriers,
        onCurrentTypeSet, addCurrentActivity, onCurrentUnitsSet, onCurrentQuantitySet
    );

    // Object handling input for all of the TARGET performance rankings
    UI.targetPerformance = new PerformanceInput(Model.TargetCarriers,
        "#targetPerformanceTable", "#targetSimpleHeader", "#targetDetailedHeader", updateOutput);
    // Object handling input for all of the TARGET activity
    UI.targetActivity = new ActivityInput("#targetQuantityTable",
        onActivityChanged, Model.TargetCarriers,
        function () {}, addTargetActivity); // No syncing types for target values, for modal shift/usability reasons

    // Adds events for the tablinks to show the different tabs
    //  -Given id for parent div, tablinks parent, and name of tablinks
    var setupTabs = function (parentDiv, tabsNav, tablinksName) {
        jQuery(parentDiv + ' > div').hide(); // hide all child divs
        jQuery(parentDiv + ' div:first').show(); // show first child div
        jQuery(tabsNav + ' li:first').addClass('active');

        // Onclick for showing and hiding tabs
        jQuery('.menu-internal[name="' + tablinksName + '"]').click(function () {
            var targetTab = jQuery(this).attr('href');
            var currentTab = jQuery(tabsNav + ' > li.active > a').attr("href");
            if (!validateState(currentTab))
                return;
            jQuery(tabsNav + ' li').removeClass('active');
            // Highlight the tablink
            jQuery(tabsNav + ' li a[href="' + targetTab + '"]').parent().addClass('active');
            jQuery(parentDiv + ' > div').hide();
            // Show the tab
            jQuery(targetTab).show();

            // Fix for issues with graphs not filling their areas
            jQuery("#graph-1").highcharts().reflow();
            jQuery("#graph-2").highcharts().reflow();
            jQuery("#graph-3").highcharts().reflow();

            return false;
        });
    };
    setupTabs("#tabsDiv", "#inputTabsNav", "inputTab");
    setupTabs("#graphTabs", "#graphTabsNav", "graphTab");

    addCurrentActivity();

    // Radio buttons that set detailed/basic trigger change to update headers/PerformanceInput(s)
    jQuery("#doDetailed").change(onDetailedChange);
    jQuery("#doBasic").change(onDetailedChange);

    // Show the intro div and show the app when Begin is clicked
    jQuery("#appDiv").hide();
    jQuery("[id^=basicHeader]").hide();
    jQuery("[id^=detailedHeader]").hide();


    // Show the introduction instructions
    jQuery("#showIntro").click(function () {
        window.scrollTo(0, 0);
        jQuery("#introDiv").show();
        jQuery("#appDiv").hide();
        jQuery("[id^=basicHeader]").hide();
        jQuery("[id^=detailedHeader]").hide();
    });

    // Copy #tables div to new window and print it (no styling)
    jQuery("#printButton").click(function () {
        var printWindow = window.open('', 'PRINT', 'height=400,width=600');

        // Open a new window and put in the report for printing
        printWindow.document.write('<html><head><title>' + document.title + '</title>');
        printWindow.document.write('</head><body >');
        printWindow.document.write('<h1>' + document.title + '</h1>');
        printWindow.document.write(jQuery("#tables").html());
        printWindow.document.write('</body></html>');

        printWindow.document.close(); // necessary for IE >= 10
        printWindow.focus(); // necessary for IE >= 10*/

        printWindow.print();
        printWindow.close();
    });

    // For table headers, there are two headers one for each unit. Defaults to kg so hide pounds
    jQuery("[id^=pounds]").hide();
    jQuery("#outputUnitsSelect").change(updateTableUnits);
});

// Update all calculations, tables, and graphs
function updateOutput() {
    updateEmissionsCalculations();
    updateEmissionsTables();
    updateGraphs();
}

// Validate the state of the current tab and alert the user of issues
function validateState(tabID) {
    var carriers;
    // Get the carriers model relevant to the current tab
    switch (tabID) {
        // Current activity tab
        case "#tab-1":
            carriers = Model.CurrentCarriers;
            break;
            // Target activity tab
        case "#tab-2":
            carriers = Model.TargetCarriers;
            break;
    }
    // Passes because its not one of the input tabs, so no validation happens
    if (!carriers)
        return true;

    var passed = true;
    // Check each carrier for issues and inform the user if there are any
    jQuery.each(carriers, function () {
        if (!this || !this.active || !passed)
            return; // continue;
        // Activity Quantity is too little
        else if (Number(this.activityQuantity) <= 0) {
            alert("One of your Current Activity Quantities is Zero or Invalid!");
            passed = false;
            // Detailed values are not adding up to 100 (this.invalid === true)
        } else if (jQuery("#doDetailed").prop("checked") && this.invalid) {
            alert("One of your Current Activty Bins (%) does not add up to 100!");
            passed = false;
        }
    });

    return (passed);
}

// Call the profiles calculation functions (also update the bins that they use, for redundancy)
// This updates the MODEL
function updateEmissionsCalculations() {
    // Clears the quantity if inactive, used because remove button doesn't set to 0 (a bit redundant)
    var clearIfInactive = function () {
        if (!this.active) {
            this.activityQuantity = 0;
        }
    };
    jQuery.each(Model.CurrentCarriers, clearIfInactive);
    jQuery.each(Model.TargetCarriers, clearIfInactive);

    var outputEmissionsUnit = jQuery("#outputUnitsSelect").val();

    // The conversion factor all emissions are multplied by. Original is grams
    var factor = 1;
    if (outputEmissionsUnit === "US (lb)") { // g -> lb
        factor = (1 / 453.592);
    } else if (outputEmissionsUnit === "Metric (kg)") { // g -> kg
        factor = (1 / 1000);
    }

    // Function to update carrier groups, either updateEmissionsDetailed or updateEmissionsSimple
    var update;
    if (jQuery("#doDetailed").prop("checked")) {
        update = updateEmissionsDetailed;
    } else {
        update = updateEmissionsSimple;
    }
    update(factor, Model.CurrentCarriers);
    update(factor, Model.TargetCarriers);
}

// Update emissions for carrriers given emissions unit factor and the carriers to update
function updateEmissionsDetailed(factor, carriers) {
    if (!Model.Bins) return;
    for (var i = 0; i < carriers.length; ++i) {
        var carrier = carriers[i];

        if (!carrier || carrier.invalid) continue;

        // Clear current values so if it is not active it is 0 (if current is active while target isnt for example)
        carrier.CO2 = 0;
        carrier.NOX = 0;
        carrier.PM = 0;

        // If percentages dont add up, dont re-calculate
        if (!carrier.active) continue;

        var activity = carrier.activityQuantity;
        // Iterate through 6 different percents, do calculation for each
        for (var t = 0; t < carrier.percentSmartWay.length; ++t) {
            var binTag = Model.PerformanceLevels[t];
            if (jQuery.inArray(carrier.type, Model.NonSmartwayCarriers) !== -1 && binTag !== "NON") continue;
            var bin = Model.Bins[carrier.activityUnits][carrier.type][binTag];

            var percent = Number(carrier.percentSmartWay[t]) * 0.01;
            carrier.CO2 += Number(activity) * percent * bin.CO2 * factor;
            carrier.NOX += Number(activity) * percent * bin.NOX * factor;
            carrier.PM += Number(activity) * percent * bin.PM * factor;
        }
    }
}
// Update emissions for carrriers given emissions unit factor and the carriers to update
function updateEmissionsSimple(factor, carriers) {
    if (!Model.Bins) return;
    for (var i = 0; i < carriers.length; ++i) {
        var carrier = carriers[i];

        if (!carrier) continue;

        // Clear current values so if it is not active it is 0 (if current is active while target isnt for example)
        carrier.CO2 = 0;
        carrier.NOX = 0;
        carrier.PM = 0;

        if (!carrier.active) {
            continue;
        }

        // Do simple calculations with units/type/bin
        var bin = Model.Bins[carrier.activityUnits][carrier.type][carrier.smartWayGeneral];
        var CO2 = bin.CO2;
        var NOX = bin.NOX;
        var PM = bin.PM;
        // activity amount * activity emissions rating * unit conversion factor
        carrier.CO2 = CO2 * Number(carrier.activityQuantity) * factor;
        carrier.NOX = NOX * Number(carrier.activityQuantity) * factor;
        carrier.PM = PM * Number(carrier.activityQuantity) * factor;
    }
}

// Set the units of headers for all the tables based on what is selected
// Accomplished by hiding unused headers and showing used ones
function updateTableUnits() {
    var value = jQuery("#outputUnitsSelect").val();
    if (value === "Metric (kg)") {
        jQuery("[id^=kg]").show();
        jQuery("[id^=pounds]").hide();
    } else if (value === "US (lb)") {
        jQuery("[id^=kg]").hide();
        jQuery("[id^=pounds]").show();
    }
}

// When the detailed radio button changes, change the headers/display mode
function onDetailedChange() {
    var detailed = jQuery("#doDetailed").prop('checked');
    UI.currentPerformance.setDetailed(detailed);
    UI.targetPerformance.setDetailed(detailed);
}

// When the activity input, target or current, changes. Fired by activityprofiles
function onActivityChanged() {
    rebuildPerformanceInputUI();
    updateOutput();
}

// Update the target/current performance input fields (add/remove based on which are active)
function rebuildPerformanceInputUI() {
    UI.currentPerformance.rebuildInputUI();
    UI.targetPerformance.rebuildInputUI();
}

// Takes a number and adds commas/rounds to two
function format(number) {
    return (+(Math.round(number + "e+2") + "e-2")).toLocaleString();
}

// Update the savings table, including the calculations and totals
function updateEmissionsTables() {
    // Create a table data cell from text
    var createTableCell = function (text) {
        return jQuery("<td>" + text + "</td>");
    };
    // Create a table header from text
    var createTableHeader = function (text) {
        return jQuery("<th>" + text + "</th>");
    };

    // JQuery selectors for tables to put current/target values into (multiple places)
    var currentTables = "#currentTable,#currentTable1";
    var targetTables = "#targetTable,#targetTable1";

    jQuery(currentTables).empty();
    jQuery(targetTables).empty();
    jQuery("#savingsTableRaw").empty();
    jQuery("#savingsTablePercent").empty();

    var emissionTypes = ["CO2", "NOX", "PM"];
    // Model for CO2, NOX, and PM emissions which is used in all the calculations (current, target, saved, percent)
    var EmissionsGroup = function () {
        this.CO2 = 0;
        this.NOX = 0;
        this.PM = 0;
    };
    var currentTotal = new EmissionsGroup();
    var targetTotal = new EmissionsGroup();
    var savedTotal = new EmissionsGroup();

    // Function builder for checking if carriers are the same type, used in grep search
    var isSameType = function (val) {
        return function (val2) {
            return val.type === val2.type;
        };
    };

    // A function builder that takes cells and returns an iterator for an emission (string)
    // Used with jQuery.each(["CO2", "NOX", "PM"]), cellPopulator);
    var cellPopulator = function (currentCarrier, targetCarrier,
        currentCells, targetCells, savedCells, percentCells) {
        return function () {
            if (!currentCarrier || !targetCarrier) return;

            var emis = this.toString();
            var saved = (currentCarrier[emis] - targetCarrier[emis]);

            currentTotal[emis] += currentCarrier[emis];
            targetTotal[emis] += targetCarrier[emis];
            savedTotal[emis] += saved;
            currentCells.push(createTableCell(format(currentCarrier[emis])));
            targetCells.push(createTableCell(format(targetCarrier[emis])));
            savedCells.push(createTableCell(format(saved)));

            // Add percentage to row, can't divide by zero
            if (currentCarrier[emis] > 0) {
                percentCells.push(createTableCell(format(
                    (saved / currentCarrier[emis]) * 100)));
            } else percentCells.push(createTableCell("0"));
        };
    };

    var addAsRow = function (cells, table) {
        var row = jQuery("<tr></tr>");
        jQuery.each(cells, appender(row));
        row.appendTo(jQuery(table));
    };

    // Closure for event that appends to an object
    var appender = function (element) {
        return function () {
            jQuery(this).appendTo(element);
        };
    };

    // Go through each carrier to calculate savings
    for (var i = 0; i < Model.CurrentCarriers.length; ++i) {

        var currentCarrier = Model.CurrentCarriers[i];

        // Find the first "targetcarrier" with same ID
        var targetCarrier = jQuery.grep(Model.TargetCarriers,
            isSameType(currentCarrier))[0];

        if (!currentCarrier || !targetCarrier) {
            continue;
        }
        if (!currentCarrier.active && !targetCarrier.active) {
            continue;
        }

        // Each of the rows for target, saved, and percent tables (current is elsewhere)
        var currentCells = [createTableCell(targetCarrier.type)];
        var targetCells = [createTableCell(targetCarrier.type)];
        var savedCells = [createTableCell(targetCarrier.type)];
        var percentCells = [createTableCell(targetCarrier.type)];

        // Update all of the totals and add to the cells list for this row
        jQuery.each(emissionTypes, cellPopulator(currentCarrier, targetCarrier,
            currentCells, targetCells, savedCells, percentCells));

        // If carrier is inactive, only dad to emissions page
        if (currentCarrier.active)
            addAsRow(currentCells, currentTables);
        else
            addAsRow(currentCells, "#currentTable1");
        if (targetCarrier.active)
            addAsRow(targetCells, targetTables);
        else
            addAsRow(targetCells, "#targetTable1");
        addAsRow(savedCells, "#savingsTableRaw");
        addAsRow(percentCells, "#savingsTablePercent");
    }

    var currentTotalCells = [createTableHeader("TOTAL")];
    var targetTotalCells = [createTableHeader("TOTAL")];
    var rawTotalCells = [createTableHeader("TOTAL")];
    var percentTotalCells = [createTableHeader("TOTAL")];

    // Create a totals row for target
    jQuery.each(emissionTypes, function () {
        var emis = this.toString();

        currentTotalCells.push(createTableHeader(format(currentTotal[emis])));
        targetTotalCells.push(createTableHeader(format(targetTotal[emis])));
        rawTotalCells.push(createTableHeader(format(savedTotal[emis])));

        // Calculate the percentage, accouting for divide by zero
        if (currentTotal[emis] !== 0) {
            percentTotalCells.push(createTableHeader(format(
                (savedTotal[emis] / currentTotal[emis]) * 100)));
        } else {
            percentTotalCells.push(createTableHeader(format("0")));
        }
    });

    /*
    Append to all the tables
    */

    addAsRow(currentTotalCells, currentTables);
    addAsRow(targetTotalCells, targetTables);
    addAsRow(rawTotalCells, "#savingsTableRaw");
    addAsRow(percentTotalCells, "#savingsTablePercent");
}

// Show the graphs with raw data, no percentages etc
function updateGraphs() {

    var units = "Kilograms";
    var unitsShort = "kg";
    if (jQuery("#outputUnitsSelect").val() === "US (lb)") {
        units = "Pounds";
        unitsShort = "lb";
    }

    var active = [];
    // Fill active list if not already there
    var getActive = function () {
        if (this.active && (jQuery.inArray(this.type, active) === -1)) active.push(this.type);
    };

    // Collect all active models, no duplicates, from both lists
    jQuery.each(Model.CurrentCarriers, getActive);
    jQuery.each(Model.TargetCarriers, getActive);

    // Create the series for each pollutant
    function createAllSeries(pollutant) {
        var series = [];
        jQuery.each(active, function () {
            var val = this.toString();

            // finds the first carrier matching the query
            var current =
                jQuery.grep(Model.CurrentCarriers,
                    function (x) {
                        return x.type === val;
                    })[0][pollutant];

            // finds the first carrier matching the query     
            var target =
                jQuery.grep(Model.TargetCarriers,
                    function (x) {
                        return x.type === val;
                    })[0][pollutant];

            var saved = (current - target);

            series.push({
                name: val,
                data: [current, target, saved]
            });
        });

        return series;
    }
    var CO2 = createAllSeries("CO2");
    var NOX = createAllSeries("NOX");
    var PM = createAllSeries("PM");

    // Formatter for the tooltip, constructs the box for when you mouse over the graph
    var tooltipFormatter = function () {
        var values = this.series.data;

        // Calculate a percentage if current isnt 0 (no divide by zero)
        var percentage;
        if (values[0].y !== 0)
            percentage = (values[2].y / values[0].y) * 100;
        else
            percentage = 0;

        // Value in bold, label in color of series
        var string = '<span style="color:' + this.series.color + ';font-weight:bolder">' +
            this.series.name +
            ': </span><b>' +
            format(this.y) + ' ' + unitsShort + '</b>';

        if (this.x === 2)
            string += "<b>| " + format(percentage) + " %</b>";

        return string;
    };

    // Highcharts graph config, notably tooltipformatter and datalabel formatter
    var barGraph = function (locationID, title, series) {
        Highcharts.chart(locationID, {
            chart: {
                type: 'column'
            },
            exporting: {
                enabled: true
            },
            title: {
                text: title
            },
            subtitle: {
                text: "Estimated Emissions in " + units
            },
            xAxis: {
                categories: ["<b>Current</b>", "<b>Goal</b>", "<b>Savings</b>"]
            },
            yAxis: {
                title: {
                    text: '<b>Estimated Emissions (' + unitsShort + ')' + '</b>'
                }
            },
            tooltip: {
                // White
                backgroundColor: '#ffffff',
                headerFormat: '',
                formatter: tooltipFormatter,
                followPointer: true
            },
            plotOptions: {
                series: {
                    allowPointSelect: true
                },
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0,
                    dataLabels: {
                        enabled: true,
                        formatter: function () {
                            return (format(this.y)) + ' ' + unitsShort;
                        }
                    }
                }
            },
            series: series
        });
    };

    barGraph("graph-1", "CO2", CO2);
    barGraph("graph-2", "NOX", NOX);
    barGraph("graph-3", "PM 2.5", PM);
}