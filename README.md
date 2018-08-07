# what-if-I-smartway

A simple calculator for the EPA Smartway program which will estimate based on Bin rankings how much a shipper can benefit from moving toward various performance tiers of Smartway carriers


#index.html

The drupal HTML content, html source. Just copy into drupal.


#script.html

The drupal JS content, including all the JS code + dependencies(highcharts). Just copy into drupal.


#SmartWayCalculator.html

A standalone html file for use with SmartWayCalculator.js + smartway_bin_formatted.json
Imports dependencies (jquery, highcharts) and styles from epa.gov

#SmartWayCalculator.js

Same js content as script.html, but has a different (local) json reference, and doesnt contain any html for other dependencies.

#smartway_bins_formatted.json

SmartWay Bins 2018 put in json format, organized as so:
{ Unit: { Carrier Type: { Bin: number } } }