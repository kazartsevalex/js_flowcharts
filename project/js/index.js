"use strict";

(function($) {
    var Flowchart = function(width, height, datatype, draw) {
        return {
            width: width,
            height: height,
            padding: 50,
            shift: 0.5,
            controls: {
                datatype: document.getElementById(datatype),
                draw: document.getElementById(draw)
            },
            dataType: "",
            fieldsY: ['dollar', 'euro'],
            fieldsX: ['day'],            
            colors: {},
            defaults: {
                canvas: null,
                chartData: null,
                startPoint: {},
                xPoints: {},
                yPoints: {},
                xAxe: null,
                yAxe: null,
                xAxeTitleObj: null,
                yAxeTitleObj: null,
                xDashes: null,
                yDashes: null,
                xMarks: null,
                yMarks: null,
                pointsY: {},
                pointsX: {},
                paths: {},
                pathTitles: {},
                active: ''
            },
            createCanvas: function(parentId, canvasId) {            
                paper.install(window);
                var canvas = document.createElement('canvas');
                canvas.id = canvasId;
                canvas.style.width = this.width + 'px';
                canvas.style.height = this.height + 'px';
                document.getElementById(parentId).appendChild(canvas);
                paper.setup(canvas);
                this.canvas = canvas;
            },
            createAxesPoints: function() {
                var _this = this,
                    padding = _this.padding - _this.shift;
                    
                this.yPoints = {
                    start: new Point(padding, padding),
                    end: new Point(padding, _this.height - padding)
                };
                
                this.xPoints = {
                    start: new Point(padding, _this.height - padding),
                    end: new Point(_this.width - padding, _this.height - padding)
                };
            },
            drawAxes: function() {
                var _this = this;
                    
                this.yAxe = new Path();
                this.yAxe.strokeColor = 'black';                
                this.yAxe.add(_this.yPoints.start, _this.yPoints.end);
                
                this.xAxe = new Path();
                this.xAxe.strokeColor = 'black';                
                this.xAxe.add(_this.xPoints.start, _this.xPoints.end);
            },
            createAxesTitles: function(xAxeTitle, yAxeTitle) {
                this.xAxeTitleObj = new PointText(-999, -999);
                this.xAxeTitleObj.content = xAxeTitle;
                this.yAxeTitleObj = new PointText(-999, -999);
                this.yAxeTitleObj.content = yAxeTitle;
            },
            drawAxesTitles: function() {
                var _this = this,
                    point = new Point(
                        _this.xPoints.end.x + 5, 
                        _this.xPoints.end.y + _this.xAxeTitleObj.fontSize + 5
                    );
                _this.xAxeTitleObj.point = point;
                _this.xAxeTitleObj.fillColor = 'black';
                
                point = new Point(
                    _this.yPoints.start.x - _this.yAxeTitleObj.content.length * 8 - 5, 
                    _this.yPoints.start.y - 5
                );
                _this.yAxeTitleObj.point = point;
                _this.yAxeTitleObj.fillColor = 'black';
            },
            drawChart: function() {     
                var _this = this, dataLength, stepX, stepY;       
                _this.chartData = [];
                _this.startPoint = {
                    x: _this.xPoints.start.x,
                    y: _this.xPoints.start.y
                };
                
                switch (_this.dataType) {
                    case 'json':
                        _this.chartData = JSON.parse(dataJson);                        
                        break;
                        
                    case 'csv':
                        var lines = dataCsv.split(/\r\n|\n/),
                            dataLength = lines.length,
                            headers = lines[0].split(','),
                            indexes = {
                                x: _this.getHeadersIndexes(headers, _this.fieldsX),
                                y: _this.getHeadersIndexes(headers, _this.fieldsY)
                            };
                        for (var i = 1; i < dataLength; i++) {
                            var line = lines[i].split(','),
                                obj = _this.getObjectFromLine(line, indexes);
                            _this.chartData.push(obj);
                        }
                        break;
                }

                var dataLength = _this.chartData.length;
                var countFY = _this.fieldsY.length;
                for (var i = 0; i < countFY; i++) {
                    _this.pointsY[_this.fieldsY[i]] = [];                            
                    _this.paths[_this.fieldsY[i]] = [];
                }                        
                for (var i = 0; i < dataLength; i++) {
                    for (var j = 0; j < countFY; j++) {
                        _this.pointsY[_this.fieldsY[j]].push(_this.chartData[i][_this.fieldsY[j]]);
                    }
                }   
                
                var countFX = _this.fieldsX.length;
                for (var i = 0; i < countFX; i++) {
                    _this.pointsX[_this.fieldsX[i]] = [];
                }                        
                for (var i = 0; i < dataLength; i++) {
                    for (var j = 0; j < countFX; j++) {
                        _this.pointsX[_this.fieldsX[j]].push(_this.chartData[i][_this.fieldsX[j]]);
                    }
                }                      
                
                stepX = _this.xAxe.length / dataLength;
                stepY = _this.yAxe.length / dataLength;
                
                _this.drawDashes(dataLength, stepX, stepY);
                
                var maxY = _this.startPoint.y - Math.floor(stepY * (dataLength - 1));
                var minY = _this.startPoint.y;
                var maxMinY = _this.getMaxMinValues('y');
                var yRatio = (minY - maxY) / (maxMinY.max - maxMinY.min);
                var countFY = _this.fieldsY.length;
                var coords = {};
                for (var i = 0; i < countFY; i++) { 
                    coords[_this.fieldsY[i]] = []; 
                    _this.colors[_this.fieldsY[i]] = _this.getRandomColor();
                }
                for (var i = 0; i < countFY; i++) {
                    for (var j = 0; j < dataLength; j++) {
                        var y = maxY + Math.round((maxMinY.max - _this.pointsY[_this.fieldsY[i]][j]) * yRatio);
                        var x = _this.startPoint.x + stepX * j;
                        coords[_this.fieldsY[i]].push([x, y]);
                    }
                }
                for (var i = 0; i < countFY; i++) {                       
                    _this.paths[_this.fieldsY[i]].push(new Path({
                        segments: coords[_this.fieldsY[i]],
                        strokeColor: _this.colors[_this.fieldsY[i]],
                        strokeWidth: 2,
                        strokeCap: 'round',
                        strokeJoin: 'round',
                        isSelected: false
                    })); 
                    
                    _this.pathTitles[_this.fieldsY[i]] = [];
                    var x = _this.width - _this.padding;
                    var y = _this.padding - i * (_this.xAxeTitleObj.fontSize + 5);
                    _this.pathTitles[_this.fieldsY[i]].push(new PointText({
                        point: [x, y],
                        content: _this.fieldsY[i],
                        fillColor: _this.colors[_this.fieldsY[i]]
                    }));
                }                
                
                var PathMouseEnter = function(field) {
                    return function() {
                        _this.paths[field][0].strokeWidth = 5;
                        _this.pathTitles[field][0].fontWeight = 'bold';
                    }
                }        
                var PathMouseLeave = function(field) {
                    return function() {
                        _this.paths[field][0].strokeWidth = _this.paths[field][0].isSelected ? 5 : 2;
                        _this.pathTitles[field][0].fontWeight = _this.paths[field][0].isSelected ? 'bold' : 'normal';
                    }
                }          
                var PathClick = function(field) {
                    return function() {
                        if (_this.active != field) { 
                            _this.active = field;
                            var length = _this.fieldsY.length;
                            for (var i = 0; i < length; i++) {
                                if (_this.fieldsY[i] != field) {
                                    _this.paths[_this.fieldsY[i]][0].isSelected = false;
                                    _this.paths[_this.fieldsY[i]][0].strokeWidth = 2;
                                    _this.pathTitles[_this.fieldsY[i]][0].fontWeight = 'normal';
                                } else {
                                    _this.paths[field][0].isSelected = true;
                                    _this.paths[field][0].strokeWidth = 5;         
                                    _this.pathTitles[field][0].fontWeight = 'bold'; 
                                }
                            }
                        }
                    }
                }
                for (var i = 0; i < countFY; i++) {
                    var field = _this.fieldsY[i];
                    _this.paths[field][0].onMouseEnter = new PathMouseEnter(field);    
                    _this.paths[field][0].onMouseLeave = new PathMouseLeave(field);   
                    _this.paths[field][0].onClick = new PathClick(field);
                }         
            },
            getObjectFromLine: function(line, indexes) {
                var _this = this, 
                    fieldsXLength = _this.fieldsX.length,
                    fieldsYLength = _this.fieldsY.length,
                    obj = {};
                    
                for (var i = 0; i < fieldsXLength; i++) {
                    var field = _this.fieldsX[i];
                    obj[field] = line[indexes.x[i]];
                }
                for (var i = 0; i < fieldsYLength; i++) {
                    var field = _this.fieldsY[i];
                    obj[field] = line[indexes.y[i]];
                }
                
                return obj;
            },
            drawDashes: function(dataLength, stepX, stepY) {
                var _this = this;
                _this.xDashes = [], _this.yDashes = [], _this.xMarks = [], _this.yMarks = [];
            
                var maxMinY = _this.getMaxMinValues('y');
                var maxValueY = maxMinY.max;
                var minValueY = maxMinY.min;
                var textStepY = (maxValueY - minValueY) / (dataLength - 1);
                
                var maxMinX = _this.getMaxMinValues('x');
                var maxValueX = maxMinX.max;
                var minValueX = maxMinX.min;
                var textStepX = (maxValueX - minValueX) / (dataLength - 1);
                
                for (var i = 0; i < dataLength; i++) {
                    _this.xDashes.push(new Path({
                        segments: [[_this.startPoint.x + Math.floor(stepX * i), _this.startPoint.y - 5], 
                            [_this.startPoint.x + Math.floor(stepX * i), _this.startPoint.y + 5]],
                        strokeColor: 'black',
                        closed: true
                    }));
                    var temp = Math.floor(minValueX + i * textStepX);
                    _this.xMarks.push(new PointText({
                        point: [_this.startPoint.x + Math.floor(stepX * i) - (temp + '').length * 4, _this.startPoint.y + 5 + _this.xAxeTitleObj.fontSize + 5],
                        content: temp,
                        fillColor: 'black'
                    }));
                    
                    _this.yDashes.push(new Path({
                        segments: [[_this.startPoint.x  - 5, _this.startPoint.y - Math.floor(stepY * i)], 
                            [_this.startPoint.x + 5, _this.startPoint.y - Math.floor(stepY * i)]],
                        strokeColor: 'black',
                        closed: true
                    }));
                    temp = Math.floor(minValueY + i * textStepY);
                    _this.yMarks.push(new PointText({
                        point: [_this.startPoint.x - (temp + '').length * 8 - 13, _this.startPoint.y - Math.floor(stepY * i) + 3],
                        content: temp,
                        fillColor: 'black'
                    }));
                }
            },
            getMaxMinValues: function(axeName) {
                var _this = this,
                    dataLength = _this.chartData.length,
                    pointsArray = axeName == 'x' ? _this.pointsX : _this.pointsY,
                    fieldsArray = axeName == 'x' ? _this.fieldsX : _this.fieldsY,
                    maxValue = 0,
                    minValue = parseInt(pointsArray[fieldsArray[0]][0]),
                    count = fieldsArray.length;
                    
                for (var j = 0; j < count; j++) {
                    for (var i = 0; i < dataLength; i++) {
                        var temp = parseInt(pointsArray[fieldsArray[j]][i]);
                        maxValue = temp > maxValue ? temp : maxValue;
                        minValue = temp < minValue ? temp : minValue;
                    }
                }       
                var output = {
                    min: minValue,
                    max: maxValue
                };
                
                return output;
            },     
            getHeadersIndexes: function(headers, axeFields) {
                var fieldsLength = axeFields.length,
                    arr = [];
                for (var i = 0; i < fieldsLength; i++) {
                    var index = headers.indexOf(axeFields[i])
                    if (index != -1) {
                        arr.push(index);
                    }
                }
                
                return arr;
            },            
            getRandomColor: function() {
                var letters = '0123456789ABCDEF'.split('');
                var color = '#';
                for (var i = 0; i < 6; i++ ) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                
                return color;
            },  
            setDefaults: function() {
                var _this = this;
                if (_this.canvas != null) {
                    _this.canvas.remove();
                }
                for (var key in _this.defaults) {
                    if (_this.defaults.hasOwnProperty(key)) {
                        _this[key] = _this.defaults[key];
                    }
                }                
            },
            init: function(parentId, canvasId, xAxeTitle, yAxeTitle) {
                this.createCanvas(parentId, canvasId);
                this.createAxesPoints();
                this.drawAxes();
                this.createAxesTitles(xAxeTitle, yAxeTitle);
                this.drawAxesTitles();  
                this.drawChart();
                paper.view.draw();
            },
            start: function(parentId, canvasId, xAxeTitle, yAxeTitle) {
                var _this = this;
                _this.controls.draw.addEventListener('click', function() {
                    var index = _this.controls.datatype.selectedIndex;
                    var dt = document.getElementsByTagName("option")[index].value.toLowerCase();
                    if (_this.dataType != dt) {
                        _this.setDefaults();
                        _this.dataType = dt;
                        _this.init(parentId, canvasId, xAxeTitle, yAxeTitle);
                    }
                }, false);
            }
        }
    };
    
    var data = [{"day": "1","dollar": "64","euro": "64"},
        {"day": "2","dollar": "56","euro": "62"},
        {"day": "3","dollar": "60","euro": "67"},
        {"day": "4","dollar": "50","euro": "60"},
        {"day": "5","dollar": "54","euro": "64"},
        {"day": "6","dollar": "58","euro": "62"},
        {"day": "7","dollar": "62","euro": "58"},
        {"day": "8","dollar": "63","euro": "57"},
        {"day": "9","dollar": "58","euro": "60"},
        {"day": "10","dollar": "54","euro": "64"}];
    var dataJson = JSON.stringify(data);
    var dataCsv = "day,dollar,euro\n1,54,64\n2,56,62\n3,60,67\n4,50,60\n5,54,64\n6,58,62\n7,62,58\n8,63,57\n9,58,60\n10,54,64";
    
    var flowchart = new Flowchart(500, 500, 'datatype', 'draw');    
    flowchart.start('main-content', 'flowcharts', 'Time', 'Rub');
    
    function jsonLog() {
        var data = Array.prototype.slice.call(arguments);
        console.log(JSON.stringify(data));
    }
})(jQuery);