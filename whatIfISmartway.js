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
    $.getJSON("smartwayBins.json", function (data) {
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

    $("#doDetailed").change(function () { onDetailedChange($("#doDetailed:checked").length > 0); });
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
function onDetailedChange(doDetailed) {
    let detailed = doDetailed.checked;
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

    let table = document.getElementById("emissionsOutputTable");

    $("#emissionsOutputTable").empty();

    let currentCO2 = 0;
    let currentNOX = 0;
    let currentPM = 0;
    // Add row for emissions for each type
    for (let i = 0; i < activeFreightMethods.length; ++i) {
        let method = activeFreightMethods[i];
        let tableRow = createTableRow(
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
    let currentTableRow = createTableRow(
        createTableCell("TOTAL"),
        createTableCell(roundToTwo(currentCO2).toLocaleString()),
        createTableCell(roundToTwo(currentNOX).toLocaleString()),
        createTableCell(roundToTwo(currentPM).toLocaleString()));
    $("#emissionsOutputTable").append($(currentTableRow));
}

// Update the savings table, including the calculations and totals
function updateSavingsUI() {
    let table = document.getElementById("savingsTable");

    $("#savingsTable").empty();

    let targetCO2 = 0;
    let targetNOX = 0;
    let targetPM = 0;

    // Go through each method to calculate savings
    for (let i = 0; i < Model.currentFreightMethods.length; ++i) {

        let currentMethod = Model.currentFreightMethods[i];
        // Find the first "targetmethod" with same ID
        let targetMethod = $.grep(Model.targetFreightMethods,
            function (x) { return x.type === currentMethod.type; })[0];

        if (!currentMethod.active && !targetMethod.active) { continue; }

        targetCO2 += targetMethod.CO2;
        targetNOX += targetMethod.NOX;
        targetPM += targetMethod.PM;

        let tableRow = createTableRow(
            createTableCell(targetMethod.type),
            createTableCell(roundToTwo(targetMethod.CO2).toLocaleString()),
            createTableCell(roundToTwo(targetMethod.NOX).toLocaleString()),
            createTableCell(roundToTwo(targetMethod.PM).toLocaleString())
        );
        table.appendChild(tableRow);

    }

    // Create a totals row
    let tableRow = createTableRow(
        createTableCell("TOTAL"),
        createTableCell(roundToTwo(targetCO2).toLocaleString()),
        createTableCell(roundToTwo(targetNOX).toLocaleString()),
        createTableCell(roundToTwo(targetPM).toLocaleString())
    );
    table.appendChild(tableRow);

    updateGraphs();
}

// Update the graphs based on selected visualization metric
function updateGraphs() {
    let metric = $("#visualizationMetric").val();

    if (metric === "raw") {
        updateGraphsRaw();
    }
}

// Show the graphs with raw data, no percentages etc
function updateGraphsRaw() {

    let active = [];
    let getActive = function () {
        if (this.active && ($.inArray(this.type, active) === -1)) active.push(this.type);
    };

    // Collect all active models, no duplicates, from both lists
    $.each(Model.currentFreightMethods, getActive);
    $.each(Model.targetFreightMethods, getActive);
    let yTitle = "Emissions";

    // Create the series' for each pollutant
    function createAllSeries(pollutant) {
        let series = [];
        $.each(active, function () {
            let val = this.toString();
            let current =
                $.grep(Model.currentFreightMethods,
                    function (x) { return x.type === val; })[0][pollutant];

            let target =
                $.grep(Model.targetFreightMethods,
                    function (x) { return x.type === val; })[0][pollutant];

            let saved = (current - target);

            series.push({ name: val, data: [current, target, saved] });
        });

        return series;
    }
    let CO2 = createAllSeries("CO2");
    let NOX = createAllSeries("NOX");
    let PM = createAllSeries("PM");

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