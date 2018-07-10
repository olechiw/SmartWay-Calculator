// Takes labels, followed by lists of data for each series
function Chart(locationID, title, subtitle, xAxisLabels, yAxisTitle, units, series) {
    Highcharts.chart(locationID, {
        chart: {
            type: 'column'
        },
        title: {
            text: title
        },
        subtitle: {
            text: subtitle
        },
        xAxis: {
            categories: xAxisLabels,
            crosshair: true
        },
        yAxis: {
            title: {
                text: yAxisTitle + ' (' + units + ')'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.1f} ' + units + '</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        series: series
    })
}