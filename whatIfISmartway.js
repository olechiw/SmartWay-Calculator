// Load the JSON with bin constants for Ton-Miles and Miles

// Global for all of the bin constants
var smartwayBinJSON;

// Globals for four different input forms
var currentPerformanceProfile;
var currentActivityProfile;
var targetPerformanceProfile;
var targetActivityProfile;

$(function () {
    // Load the bins JSON
    $.getJSON("Data/smartwayBins.json", function (data) {
        smartwayBinJSON = data;
        currentPerformanceProfile.bins = smartwayBinJSON;
        targetPerformanceProfile.bins = smartwayBinJSON;
    });

    // Object handling input for the CURRENT performance rankings
    currentPerformanceProfile = new PerformanceProfile(Model.currentFreightMethods,
        "activityPerformanceTable", "currentSimpleHeader",
        "currentDetailedHeader", updateEmissions);
    // Object handling input for the CURRENT activity
    currentActivityProfile = new ActivityProfile("#activityQuantityTable",
        onActivityChanged, Model.currentFreightMethods);

    // Object handling input for all of the TARGET performance rankings
    targetPerformanceProfile = new PerformanceProfile(Model.targetFreightMethods,
        "targetPerformanceTable", "targetSimpleHeader", "targetDetailedHeader", updateEmissions);
    // Object handling input for all of the TARGET activity
    targetActivityProfile = new ActivityProfile("#targetQuantityTable",
        onActivityChanged, Model.targetFreightMethods);

    // Setup event listeners
    $("#currentTab").click(function () { showTab(event, 'Current'); });
    $("#targetTab").click(function () { showTab(event, 'Target'); });
    $("#settingsTab").click(function () { showTab(event, 'Settings'); });

    $("#co2Tab").click(function () { showGraph(event, '#co2Chart'); });
    $("#noxTab").click(function () { showGraph(event, '#noxChart'); });
    $("#pmTab").click(function () { showGraph(event, '#pmChart'); });

    // Show the default tabs, 'Current' and 'CO2'
    $('#currentTab').trigger('click');
    $('#currentTab').addClass('active');
    $('#co2Tab').trigger('click');
    $('#co2Tab').addClass('active');

    $('#addCurrentActivity').click(addCurrentActivity);
    $("#addTargetActivity").click(addTargetActivity);

    $("#doDetailed").change(function () { onDetailedChange(); });
    $("#visualizationMetric").change(updateGraphs());
});

// Show one of the input tabs (called by tab buttons)
function showTab(event, val) {
    $('#inputColumn').find('.tablinks').removeClass('active');
    $(event.currentTarget).addClass('active');

    $('#inputColumn').children().hide();
    $('#inputColumn').children('#tabs').show();
    if (val === 'Current') {
        $('#inputColumn').children('#tabCurrent').show();
    }
    else if (val === 'Target') {
        $('#inputColumn').children('#tabTarget').show();
    }
    else if (val === 'Settings') {
        $('#inputColumn').children('#tabSettings').show();
    }
}

// Show one of the graphs (called by tab buttons)
function showGraph(event, val) {
    $('#graphColumn').find('.tablinks').removeClass('active');
    $(event.currentTarget).addClass('active');

    $('#graphColumn').children().hide();
    $('#graphColumn').children('#tabs').show();
    $('#graphColumn').children(val).show();
}

// Update all of the emissions calculations and UI
function updateEmissions() {
    updateEmissionsCalculations();
    updateEmissionsUI();
    updateSavingsUI();
}

// When the detailed checkbox changes
function onDetailedChange() {
    var detailed = $("#doDetailed").prop('checked');
    currentPerformanceProfile.setDetailed(detailed);
    targetPerformanceProfile.setDetailed(detailed);
}

// Update the target/current performance input fields
function updatePerformanceInputUI() {
    currentPerformanceProfile.updateInputUI();
    targetPerformanceProfile.updateInputUI();
}

// For output number formatting
function roundToTwo(num) {
    return +(Math.round(num + "e+2") + "e-2");
}

// When the add button for current activity input is clicked
function addCurrentActivity() {
    currentActivityProfile.addQuantityInputUI();
}
// When the add button for target activity input is clicked
function addTargetActivity() {
    targetActivityProfile.addQuantityInputUI();
}

// When the activity input, target or current, changes. Fired by activityprofiles
function onActivityChanged() {
    updatePerformanceInputUI();
    updateEmissions();
}

// Update the table for emissions
function updateEmissionsUI() {
    activeFreightMethods = [];
    // Get active methods from all current freightmethods
    $.each(Model.currentFreightMethods, function () {
        if (this.active) activeFreightMethods.push(this);
    });

    var table = document.getElementById("emissionsOutputTable");

    $("#emissionsOutputTable").empty();

    var currentCO2 = 0;
    var currentNOX = 0;
    var currentPM = 0;
    // Add row for emissions for each type
    for (var i = 0; i < activeFreightMethods.length; ++i) {
        var method = activeFreightMethods[i];
        var tableRow = createTableRow(
            createTableCell(method.type),
            createTableCell(roundToTwo(method.CO2).toLocaleString()),
            createTableCell(roundToTwo(method.NOX).toLocaleString()),
            createTableCell(roundToTwo(method.PM).toLocaleString()));

        table.appendChild(tableRow);
        currentCO2 += method.CO2;
        currentNOX += method.NOX;
        currentPM += method.PM;
    }

    // Create a row for totals
    var currentTableRow = createTableRow(
        createTableCell("TOTAL"),
        createTableCell(roundToTwo(currentCO2).toLocaleString()),
        createTableCell(roundToTwo(currentNOX).toLocaleString()),
        createTableCell(roundToTwo(currentPM).toLocaleString()));
    $("#emissionsOutputTable").append($(currentTableRow));
}

// Update the savings table, including the calculations and totals
function updateSavingsUI() {
    var table = document.getElementById("savingsTable");

    $("#savingsTable").empty();

    var targetCO2 = 0;
    var targetNOX = 0;
    var targetPM = 0;


    // Go through each method to calculate savings
    for (var i = 0; i < Model.currentFreightMethods.length; ++i) {

        var currentMethod = Model.currentFreightMethods[i];

        // Find the first "targetmethod" with same ID
        var targetMethod = $.grep(Model.targetFreightMethods,
            function (x) { return x.type === currentMethod.type; })[0];

        if (!currentMethod.active && !targetMethod.active) { continue; }

        targetCO2 += targetMethod.CO2;
        targetNOX += targetMethod.NOX;
        targetPM += targetMethod.PM;

        var tableRow = createTableRow(
            createTableCell(targetMethod.type),
            createTableCell(roundToTwo(targetMethod.CO2).toLocaleString()),
            createTableCell(roundToTwo(targetMethod.NOX).toLocaleString()),
            createTableCell(roundToTwo(targetMethod.PM).toLocaleString())
        );
        table.appendChild(tableRow);

    }

    // Create a totals row
    var totalsRow = createTableRow(
        createTableCell("TOTAL"),
        createTableCell(roundToTwo(targetCO2).toLocaleString()),
        createTableCell(roundToTwo(targetNOX).toLocaleString()),
        createTableCell(roundToTwo(targetPM).toLocaleString())
    );
    table.appendChild(totalsRow);

    updateGraphs();
}

// Update the graphs based on selected visualization metric
function updateGraphs() {
    var metric = $("#visualizationMetric").val();

    if (metric === "raw") {
        updateGraphsRaw();
    }
}

// Show the graphs with raw data, no percentages etc
function updateGraphsRaw() {

    var active = [];
    var getActive = function () {
        if (this.active && ($.inArray(this.type, active) === -1)) active.push(this.type);
    };

    // Collect all active models, no duplicates, from both lists
    $.each(Model.currentFreightMethods, getActive);
    $.each(Model.targetFreightMethods, getActive);
    var yTitle = "Emissions";

    // Create the series' for each pollutant
    function createAllSeries(pollutant) {
        var series = [];
        $.each(active, function () {
            var val = this.toString();
            var current =
                $.grep(Model.currentFreightMethods,
                    function (x) { return x.type === val; })[0][pollutant];

            var target =
                $.grep(Model.targetFreightMethods,
                    function (x) { return x.type === val; })[0][pollutant];

            var saved = (current - target);

            series.push({ name: val, data: [current, target, saved] });
        });

        return series;
    }
    var CO2 = createAllSeries("CO2");
    var NOX = createAllSeries("NOX");
    var PM = createAllSeries("PM");

    BarChart("co2Chart", "CO2", "Estimated Emissions in grams",
        ["<b>Current</b>", "<b>Target</b>", "<b>Savings</b>"], yTitle, "g", CO2);
    BarChart("noxChart", "NOX", "Estimated Emissions in grams",
        ["<b>Current</b>", "<b>Target</b>", "<b>Savings</b>"], yTitle, "g", NOX);
    BarChart("pmChart", "PM 2.5", "Estimated Emissions in grams",
        ["<b>Current</b>", "<b>Target</b>", "<b>Savings</b>"], yTitle, "g", PM);
}

// Call the profiles calculation functions (also update the bins that they use, for redundancy)
function updateEmissionsCalculations() {
    currentPerformanceProfile.bins = smartwayBinJSON;
    targetPerformanceProfile.bins = smartwayBinJSON;
    if ($("#doDetailed:checked").length > 0) {
        currentPerformanceProfile.updateEmissionsDetailed();
        targetPerformanceProfile.updateEmissionsDetailed();
    }
    else {
        currentPerformanceProfile.updateEmissionsSimple();
        targetPerformanceProfile.updateEmissionsSimple();
    }
}