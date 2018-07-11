// Takes labels, followed by lists of data for each series
function Chart(locationID, title, subtitle, xAxisLabels, yAxisTitle, units, series) {
    Highcharts.chart(locationID, {
        chart: {
            type: 'column'
        },
        exporting: {
            enabled: false
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
                text: '<b>' + yAxisTitle + ' (' + units + ')' + '</b>'
            }
        },
        tooltip: {
            backgroundColor: '#ffffff',
            headerFormat: '',
            pointFormatter: function() {
                return '<b><span style="color:' + this.series.color +
                 '">' + this.series.name + ': </span>' +
                  this.y.toLocaleString() + ' ' + units + '</b>';
            },
            hideDelay: 250,
            useHTML: true,
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
                        return (this.y).toLocaleString();
                    }
                }
            }
        },
        series: series
    })
}