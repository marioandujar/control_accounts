/**
 * Created by marioandujar on 29/04/16.
 */
Number.prototype.formatMoney = function (c, d, t) {
    var n = this,
        c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

var expensives = null;
var incomes = null;

var options_mix = {
        chart: {
            zoomType: 'xy'
        },
        title: {
            text: 'Expensives VS Incomes'
        },
        xAxis: [{
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun','Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            labels: {
                formatter: function () {
                    return '<h5><a href="#" onclick="tagExpensivesByMonth(' + this.axis.categories.indexOf(this.value) + ')" >' + this.value + '</a></h5>'
                },
                useHTML: true
            },
            crosshair: true
        }],
        yAxis: [{ // Primary yAxis
            labels: {
                formatter: function () {
                    return (this.value.formatMoney(2, ',', '.') + ' €');
                },
                style: {
                    color: Highcharts.getOptions().colors[1]
                }
            },
            title: {
                text: 'Income',
                style: {
                    color: Highcharts.getOptions().colors[1]
                }
            }
        }, { // Secondary yAxis
            title: {
                text: 'Expensive',
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            },
            labels: {
                formatter: function () {
                    return (this.value.formatMoney(2, ',', '.') + ' €');
                },
                style: {
                    color: Highcharts.getOptions().colors[0]
                }
            },
            opposite: true
        }],
        tooltip: {
            shared: true
        },
        legend: {
            layout: 'vertical',
            align: 'left',
            x: 120,
            verticalAlign: 'top',
            y: 100,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
        },
        series: []
    };
var options_table  = {
        chart: {
            type: 'bar'
        },
        title: {
            text: 'Tags expensives'
        },
        xAxis: {
            categories: []
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Total Expensives'
            },
            labels: {
                formatter: function () {
                    return (this.value.formatMoney(2, ',', '.') + ' €');
                }
            }
        },
        legend: {
            reversed: true
        },
        plotOptions: {
            series: {
                stacking: 'normal'
            }
        },
        tooltip: {
            headerFormat: '<b>{point.x}</b>: {point.y:,.2f} €',
            pointFormat: ''
        },
        series: []
    };
var options = {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Expensives'
        },
        xAxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            labels: {
                formatter: function () {
                    return '<h5><a href="/month/' + new Date().getFullYear() + '/' + (this.axis.categories.indexOf(this.value) + 1).toString() + '">' + this.value + '</a></h5>'
                },
                useHTML: true
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Total Expensives'
            },
            labels: {
                formatter: function () {
                    return (this.value.formatMoney(2, ',', '.') + ' €');
                }
            },
            stackLabels: {
                enabled: true,
                style: {
                    fontWeight: 'bold',
                    color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                },
                formatter: function () {
                    return (this.total.formatMoney(2, ',', '.') + ' €');
                }

            }
        },
        legend: {
            align: 'right',
            x: -30,
            verticalAlign: 'top',
            y: 25,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
            borderColor: '#CCC',
            borderWidth: 1,
            shadow: false,
        },
        tooltip: {
            headerFormat: '<b>{point.x}</b><br/>',
            pointFormat: '{series.name}: {point.y:,.2f} €<br/>Total: {point.stackTotal:,.2f} €'
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                dataLabels: {
                    enabled: true,
                    color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
                    style: {
                        textShadow: '0 0 3px black'
                    },
                    formatter: function () {
                        return (this.y.formatMoney(2, ',', '.') + ' €');
                    }
                }
            }
        },
        series: []
    };
var createData = function (name) {
    var data = [];
    var collection = null;
    if (name == 'expensives') {
        collection = expensives;
    } else if (name == 'incomes') {
        collection = incomes;
    }
    var distinct = collection.map(function (obj) {
        return obj._id.month;
    });
    distinct = distinct.filter(function (v, i) {
        return distinct.indexOf(v) == i;
    });
    for (var i = 0; i < collection.length; i++) {
        var line = collection[i];
        var accesor = '';
        if ('account_name' in line._id) {
            accesor = 'account_name';
        } else if ('tag' in line._id) {
            accesor = 'tag';
        }
        if (data.filter(function (item) {
                return item.name == line._id[accesor]
            }).length == 0) {
            var data_line = [];
            for (var j = 0; j < distinct.length; j++) {
                data_line.push(0)
            }
            data.push({name: line._id[accesor], data: data_line});
        }
        data.filter(function (item) {
            return item.name == line._id[accesor]
        })[0].data[line._id.month - 1] = line.total * (name == 'expensives' ? -1 : 1);
    }
    return data;
};
var createDataMix = function () {
    var serie_expensive = {
        name: 'Expensive',
        type: 'column',
        yAxis: 1,
        tooltip: {
            formatter: function () {
                    return (this.total.formatMoney(2, ',', '.') + ' €');
                }
        },
        data: []};
    var serie_income = {
        name: 'Income',
        type: 'spline',
        tooltip: {
            formatter: function () {
                    return (this.total.formatMoney(2, ',', '.') + ' €');
                }
        },
        data: []};
    var distinct = expensives.map(function (obj) {
        return obj._id.month;
    });
    distinct = distinct.filter(function (v, i) {
        return distinct.indexOf(v) == i;
    });
    var total_e = 0;
    var total_i = 0;
    for(var i = 0; i < distinct.length; i++){
        var month = distinct[i];
        var total_expensive = 0;
        if (expensives.filter(function (item) {return item._id.month == month}).length > 0){
            $.each(expensives.filter(function (item) {return item._id.month == month}),function(i,m){
                total_expensive += m.total;
            });
        }
        total_e += total_expensive;
        var total_income = 0;
        if (incomes.filter(function (item) {return item._id.month == month}).length > 0){
            $.each(incomes.filter(function (item) {return item._id.month == month}),function(i,m){
                total_income += m.total;
            });
        }
        total_i += total_income;
        serie_expensive.data.push(total_expensive * (-1));
        serie_income.data.push(total_income);
    }
    options_mix.series = [serie_expensive, serie_income];

    var distinct_tag = expensives.map(function (obj) {
        return obj._id.tag;
    });
    distinct_tag = distinct_tag.filter(function (v, i) {
        return distinct_tag.indexOf(v) == i;
    });
    options_table.xAxis.categories = distinct_tag;
    var series_table_expensives = [{name: 'Expensives', data:[]}];
    for(var i = 0; i < distinct_tag.length; i++){
        var tag = distinct_tag[i];
        var total_expensive = 0;
        if (expensives.filter(function (item) {return item._id.tag == tag}).length > 0){
            $.each(expensives.filter(function (item) {return item._id.tag == tag}),function(i,m){
                total_expensive += m.total;
            });
        }
        series_table_expensives[0].data.push(total_expensive * (-1));
    }
    options_table.series = series_table_expensives;

    $('#labelIncome').after('<p class="text-info pull-righ">' + total_i.formatMoney(2, ',', '.') + ' €' + '</a>');
    $('#labelExpensive').after('<p class="text-danger pull-righ">' + (total_e * (-1)).formatMoney(2, ',', '.') + ' €' + '</a>');
};
var tagExpensivesByMonth = function (month) {
   var distinct_tag = expensives.filter(function(item){ return item._id.month == month + 1}).map(function (obj) {
        return obj._id.tag;
    });
    distinct_tag = distinct_tag.filter(function (v, i) {
        return distinct_tag.indexOf(v) == i;
    });
    options_table.xAxis.categories = distinct_tag;
    var series_table_expensives = [{name: 'Expensives', data:[]}];
    for(var i = 0; i < distinct_tag.length; i++){
        var tag = distinct_tag[i];
        var total_expensive = 0;
        if (expensives.filter(function (item) {return item._id.tag == tag && item._id.month == month + 1}).length > 0){
            $.each(expensives.filter(function (item) {return item._id.tag == tag && item._id.month == month + 1}),function(i,m){
                total_expensive += m.total;
            });
        }
        series_table_expensives[0].data.push(total_expensive * (-1));
    }

    options_table.series = series_table_expensives;
    options_table.title.text = 'Tags expensives ' +  options.xAxis.categories[month];
    $('#container_table').highcharts(options_table);
};

$(function () {
    $('#myTabs a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
        $('.tab-pane').removeClass('active');
        $($(this).attr('href')).addClass('active');
    });

    expensives = JSON.parse($('#expensives').val());
    incomes = JSON.parse($('#incomes').val());
    Highcharts.setOptions({
        lang: {
            decimalPoint: ',',
            thousandsSep: '.'
        }
    });

    var data_expensives = [];
    var data_incomes = [];

    createDataMix();
    $('#container_mix').highcharts(options_mix);
    $('#container_table').highcharts(options_table);

    data_expensives = createData('expensives');
    options['series'] = data_expensives;
    $('#container_expensives').highcharts(options);
    data_incomes = createData('incomes')
    options['series'] = data_incomes;
    options['title']['text'] = 'Incomes';
    options['yAxis']['title']['text'] = 'Total Incomes';
    $('#container_incomes').highcharts(options);
});