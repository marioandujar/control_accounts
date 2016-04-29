/**
 * Created by marioandujar on 29/04/16.
 */
Number.prototype.formatMoney = function(c, d, t){
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
$(function () {
    expensives = JSON.parse($('#expensives').val());
    incomes = JSON.parse($('#incomes').val());
    var data_expensives = [];
    var data_incomes = [];
    var distinct = expensives.map(function(obj) { return obj._id.month; });
    distinct = distinct.filter(function(v,i) { return distinct.indexOf(v) == i; });

    for(var i = 0; i < expensives.length; i++){
        var line = expensives[i];
        var accesor = '';
        if('account_name' in line._id){
            accesor = 'account_name';
        }else if('tag' in line._id){
            accesor = 'tag';
        }
        if(data_expensives.filter(function(item){return item.name == line._id[accesor]}).length == 0){
            var data = [];
            for(var j = 0;j < distinct.length; j++){ data.push(0) }
            data_expensives.push({name: line._id[accesor], data: data});
        }
        data_expensives.filter(function(item){return item.name == line._id[accesor]})[0].data[line._id.month - 1] = line.total * (-1);
    }
    distinct = incomes.map(function(obj) { return obj._id.month; });
    distinct = distinct.filter(function(v,i) { return distinct.indexOf(v) == i; });
    for(var i = 0; i < incomes.length; i++){
        var line = incomes[i];
        var accesor = '';
        if('account_name' in line._id){
            accesor = 'account_name';
        }else if('tag' in line._id){
            accesor = 'tag';
        }
        if(data_incomes.filter(function(item){return item.name == line._id[accesor]}).length == 0){
            var data = [];
            for(var j = 0;j < distinct.length; j++){ data.push(0) }
            data_incomes.push({name: line._id[accesor], data: data});
        }
        data_incomes.filter(function(item){return item.name == line._id[accesor]})[0].data[line._id.month - 1] = line.total;
    }
    Highcharts.setOptions({
    lang: {
        decimalPoint: ',',
        thousandsSep: '.'
    }
});
    var options = {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Expensives'
        },
        xAxis: {
            categories: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
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
        series: data_expensives
    }
    $('#container_expensives').highcharts(options);
    options['series'] = data_incomes;
    options['title']['text'] = 'Incomes';
    options['yAxis']['title']['text'] = 'Total Incomes';
    $('#container_incomes').highcharts(options);
});