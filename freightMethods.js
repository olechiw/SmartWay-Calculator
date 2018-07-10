class FreightMethodModel {
    constructor(name) {
        // The name of the movement type
        this.type = name;
        this.active = false;
        this.invalid = false;

        // The activity units (Ton-Miles or Miles) and the corresponding scalar
        this.activityUnits = "Miles";
        this.activityQuantity = 0;

        // The current calculated amounts of pollution
        this.CO2 = 0;
        this.NOX = 0;
        this.PM = 0;

        // The general ranking, 1-6 with 6 being NON
        this.smartWayGeneral = "NON";
        // The specific smartway usage, from Bin 1 to NON
        this.percentSmartWay = [0, 0, 0, 0, 0, 0];
    }
}

// Constant function to create a list of every method, used as the model
function createFreightMethods() {
    return [
        new FreightMethodModel("Auto Carrier Trucking"),
        new FreightMethodModel("Dray Trucking"),
        new FreightMethodModel("Expedited Trucking"),
        new FreightMethodModel("Flatbed Trucking"),
        new FreightMethodModel("Heavy and Bulk Trucking"),
        new FreightMethodModel("LTL/Dry Van"),
        new FreightMethodModel("Mixed Trucking"),
        new FreightMethodModel("Moving Van Trucking"),
        new FreightMethodModel("Package Delivery Trucking"),
        new FreightMethodModel("Refrigerated Trucking"),
        new FreightMethodModel("Specialty Haul Trucking"),
        new FreightMethodModel("Tanker Trucking"),
        new FreightMethodModel("TL/Dry Van"),
        new FreightMethodModel("Logistics"),
        new FreightMethodModel("Multimodal"),
        new FreightMethodModel("Rail"),
        new FreightMethodModel("Barge"),
        new FreightMethodModel("Air-Long Haul"),
        new FreightMethodModel("Air-Short Haul")];
}

// The global freight model, freightMethods and targetFreightMethods
var freightMethods = createFreightMethods();
var targetFreightMethods = createFreightMethods();

var freightUnits = [
    "Miles",
    "Ton-Miles"
];

var freightNonOnly = [
    "Rail",
    "Barge",
    "Air-Long Haul",
    "Air-Short Haul"
];