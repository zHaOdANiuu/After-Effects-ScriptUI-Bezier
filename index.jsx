/**
 * @file 贝塞尔曲线示例
 * @data 2024/8/6
 */
(function(globalThis) {
    function cubicBezier(t, p1, p2, p3, p4) {
        var b1 = Math.pow(t, 3);
        var b2 = Math.pow(t, 2) * 3 * (1 - t);
        var b3 = Math.pow(1 - t, 2) * 3 * t;
        var b4 = Math.pow(1 - t, 3);
        return [ p1[0] * b1 + p2[0] * b2 + p3[0] * b3 + p4[0] * b4, p1[1] * b1 + p2[1] * b2 + p3[1] * b3 + p4[1] * b4 ];
    }
    var Graphics = {
        _intFillWithStroke: function(graph, options) {
            options.fill.color.length < 4 && options.fill.color.push(options.fill.opacity);
            options.fill.visible && graph.fillPath(graph.newBrush(0, options.fill.color));
            options.stroke.color.length < 4 && options.stroke.color.push(options.stroke.opacity);
            options.stroke.visible && graph.strokePath(graph.newPen(0, options.stroke.color, options.stroke.width));
        },
        drawRect: function(graph, position, options) {
            graph.newPath();
            graph.rectPath(position[0] - options.size[0] / 2, position[1] - options.size[1] / 2, options.size[0], options.size[1]);
            this._intFillWithStroke(graph, options);
        },
        drawCircle: function(graph, position, options) {
            graph.newPath();
            graph.ellipsePath(position[0] - options.size[0] / 2, position[1] - options.size[1] / 2, options.size[0], options.size[1]);
            this._intFillWithStroke(graph, options);
        },
        drawPoint: function(graph, position, size, color) {
            graph.newPath();
            graph.ellipsePath(position[0] - size[0] / 2, position[1] - size[1] / 2, size[0], size[1]);
            graph.fillPath(graph.newBrush(0, color));
        },
        drawLine: function(graph, fromPos, toPos, color, width) {
            graph.newPath();
            graph.moveTo(fromPos[0], fromPos[1]);
            graph.lineTo(toPos[0], toPos[1]);
            graph.strokePath(graph.newPen(0, color, width ? width : 1));
        },
        fillBg: function(graph, size, color) {
            graph.newPath();
            graph.rectPath(0, 0, size[0], size[1]);
            graph.fillPath(graph.newBrush(0, color));
            graph.closePath();
        }
    };
    var win = new Window("palette");
    var group = win.add("group");
    var spline = group.add("customview");
    var data = {
        viewSize: [ 500, 500 ],
        pointSize: [ 15, 15 ],
        pointColor: [ 1, 0, 0 ],
        lineWidth: 5,
        lineColor: [ 1, 1, 1 ],
        threshold: 0.04
    };
    group.alignChildren = [ "left", "top" ];
    spline.size = data.viewSize;
    var Curves = function() {
        function Curves(startPoint, StartControlPoint, endControlPoint, endPoint) {
            this.startPoint = startPoint;
            this.StartControlPoint = StartControlPoint;
            this.endControlPoint = endControlPoint;
            this.endPoint = endPoint;
        }
        Curves.prototype.getPoint = function(t) {
            return cubicBezier(t, this.startPoint, this.StartControlPoint, this.endControlPoint, this.endPoint);
        };
        return Curves;
    }();
    var offset = data.pointSize[0] / 2;
    var curves = new Curves([ offset, data.viewSize[1] - offset ], [ data.viewSize[0] - offset, data.viewSize[1] - offset ], [ offset, offset ], [ data.viewSize[0] - offset, offset ]);
    var isOver = function(pointPos, pointSize, mousePos) {
        return pointPos[0] > mousePos[0] - pointSize / 2 && pointPos[0] < mousePos[0] + pointSize / 2 && pointPos[1] > mousePos[1] - pointSize / 2 && pointPos[1] < mousePos[1] + pointSize / 2;
    };
    spline.onDraw = function() {
        Graphics.drawLine(this.graphics, curves.startPoint, curves.StartControlPoint, data.lineColor, data.lineWidth);
        Graphics.drawLine(this.graphics, curves.endPoint, curves.endControlPoint, data.lineColor, data.lineWidth);
        var i = 0;
        while (i < 1) {
            var point = curves.getPoint(i);
            Graphics.drawLine(this.graphics, point, curves.getPoint(i + data.threshold), data.lineColor, data.lineWidth);
            Graphics.drawPoint(this.graphics, point, data.pointSize, data.pointColor);
            i += data.threshold;
        }
        Graphics.drawPoint(this.graphics, curves.StartControlPoint, data.pointSize, data.pointColor);
        Graphics.drawPoint(this.graphics, curves.endControlPoint, data.pointSize, data.pointColor);
    };
    var leftClickStatus = false;
    var controlPointState = null;
    spline.addEventListener("mousedown", function(e) {
        leftClickStatus = true;
        var clientPos = [ e.clientX, e.clientY ];
        if (isOver(curves.StartControlPoint, data.pointSize[0], clientPos)) {
            controlPointState = 1;
        } else if (isOver(curves.endControlPoint, data.pointSize[0], clientPos)) {
            controlPointState = 2;
        }
    });
    spline.addEventListener("mousemove", function(e) {
        if (!leftClickStatus) {
            return;
        }
        var clientPos = [ e.clientX, e.clientY ];
        if (controlPointState === 1) {
            curves.StartControlPoint = clientPos;
        } else if (controlPointState === 2) {
            curves.endControlPoint = clientPos;
        } else {
            controlPointState = null;
        }
        spline.notify('onDraw');
    });
    spline.addEventListener("mouseup", function() {
        leftClickStatus = false;
        controlPointState = null;
    });
    win.show();
})(this);
