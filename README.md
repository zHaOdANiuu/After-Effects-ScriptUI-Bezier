# 实现

1. 实现三阶贝塞尔的函数
2. 明白ScriptUI的绘制api
3. 明白交互的过程,和数据的更新
4. 绘制视图

## 实现三阶贝塞尔函数

```js
function cubicBezier(t, p1, p2, p3, p4)
{
        var b1 = Math.pow(t, 3);
        var b2 = Math.pow(t, 2) * 3 * (1 - t);
        var b3 = Math.pow(1 - t, 2) * 3 * t;
        var b4 = Math.pow(1 - t, 3);
        return [ p1[0] * b1 + p2[0] * b2 + p3[0] * b3 + p4[0] * b4, p1[1] * b1 + p2[1] * b2 + p3[1] * b3 + p4[1] * b4 ];
}
```

原理就不说了,我本身也不懂

## ScriptUI的绘制api

* 在ScriptUI里,要绘制一条线,需要在控件的onDraw的事件函数里写,具体如下:

```js
this.graphics.newPath(); // 新建路径空间
this.graphics.moveTo(number, number); // 设置初始点
this.graphics.lineTo(number, number); // 设置下一个点的位置
this.graphics.strokePath(this.graphics.newPen(0, [number,number,number], number)); // 添加描边路径
```

## 交互

我们要明确一点,三阶贝塞尔是有2个控制器的,而我们的鼠标是只有一个的,所以在交互的时候,要判断是那个控制器在活动
所以需要一个变量`controlPointState`,我们把它初始化为`null`,然后就是监听鼠标的按下,抬起,移动这三个事件,我们
需要一个变量`leftClickStatus`来保证交换的准确性,把它初始化为`false`.

* 但在此之前我们需要一个全局数据和一个类来处理数据.

```js
var data = {
        viewSize: [ 500, 500 ],
        pointSize: [ 15, 15 ],
        pointColor: [ 1, 0, 0 ],
        lineWidth: 5,
        lineColor: [ 1, 1, 1 ],
        threshold: 0.04
};
var Curves = function()
{
        function Curves(startPoint, StartControlPoint, endControlPoint, endPoint)
        {
            this.startPoint = startPoint;
            this.StartControlPoint = StartControlPoint;
            this.endControlPoint = endControlPoint;
            this.endPoint = endPoint;
        }
        Curves.prototype.getPoint = function(t)
        {
            return cubicBezier(t, this.startPoint, this.StartControlPoint, this.endControlPoint, this.endPoint);
        };
        return Curves;
}();
var offset = data.pointSize[0] / 2;
var curves = new Curves([ offset, data.viewSize[1] - offset ], [ data.viewSize[0] - offset, data.viewSize[1] - offset ], [ offset, offset ], [ data.viewSize[0] - offset, offset ]);
```

* 在鼠标按下的时候,我们把`leftClickStatus`设置为true,然后写一个函数`isOver`来判断鼠标点了那个控件
如果点了下面的控件,就设置为1,反之设置为2.然后更新数据,最后在重绘控制,用`notify('onDraw')`;

```js
// 传一下控件的位置,大小,和鼠标的位置
var isOver = function(pointPos, pointSize, mousePos)
{
        return pointPos[0] > mousePos[0] - pointSize / 2
        && pointPos[0] < mousePos[0] + pointSize / 2
        && pointPos[1] > mousePos[1] - pointSize / 2
        && pointPos[1] < mousePos[1] + pointSize / 2;
};
spline.addEventListener("mousedown", function(e)
{
      leftClickStatus = true;
      var clientPos = [ e.clientX, e.clientY ];
      if (isOver(curves.StartControlPoint, data.pointSize[0], clientPos)) controlPointState = 1;
      else if (isOver(curves.endControlPoint, data.pointSize[0], clientPos)) controlPointState = 2;
});
```

* 在鼠标移动的时候,我们判断`leftClickStatus`是否为true,如果是true,就判断鼠标点了那个控件,然后设置`controlPointState`为1或2.

```js
spline.addEventListener("mousemove", function(e)
{
        if (!leftClickStatus)  return;
        var clientPos = [ e.clientX, e.clientY ];
        if (controlPointState === 1) curves.StartControlPoint = clientPos;
        else if (controlPointState === 2) curves.endControlPoint = clientPos;
        else controlPointState = null;
        spline.notify('onDraw');
});
```

* 在鼠标抬起的时候,我们把`leftClickStatus`设置为false,`controlPointState`设置为`null`

```js
spline.addEventListener("mouseup", function()
{
        leftClickStatus = false;
        controlPointState = null;
});
```

## 绘制

```js
// Graphics是我封装的一个对象,代码里面有具体实现
spline.onDraw = function()
{
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
```
