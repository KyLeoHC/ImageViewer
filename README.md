# ImageViewer
ImageViewer是一个用于web移动端的图片预览组件。

## 在线示例
请使用手机打开链接查看，PC端请打开控制台模拟移动设备
[demo](http://freeui.org/imageViewer2/)

## 引入方式
将本项目dist文件夹中的js文件放到目标项目中即可。

## 使用示例
ImageViewer是这个图片预览组件的核心类，实例化第一个入参是图片数组（必传），第二个为一些可选的选项参数对象。
选项参数包括：
- `container`：一个简单的选择器，代表该图片预览组件所应该插入到的地方(参数可选，默认为body元素);
- `enableScale`：是否启用图片缩放功能(参数可选，默认为true);
- `enableTapClose`：是否允许单击关闭图片预览(参数可选，默认为false);
- `fadeInFn`：是否开启图片预览渐变打开效果(参数可选);
- `fadeOutFn`：是否开启图片预览渐变关闭效果(参数可选);
- `startIndex`：开始预览的第一张图片所在数组下标，从0开始(参数可选，默认为0);
- `headerRender`：头部渲染函数，返回一个html字符串并且会被显示在图片预览界面上方，用于自定义头部显示(参数可选);
- `footerRender`：尾部渲染函数，返回一个html字符串并且会被显示在图片预览界面下方，用于自定义尾部显示(参数可选);
- `beforeSwipe`：图片开始滑动时的回调函数，入参为当前显示的图片的下标(参数可选);
- `afterSwipe`：图片滑动结束并且是切换图片时的回调函数，入参为当前显示的图片的下标(参数可选);
- `swipeFirstRight`：当前图片是第一张并且向右滑动结束时的回调函数，第一个入参为当前ImageViewer实例，第二个入参是滑动的X轴距离(参数可选);
- `swipeLastLeft`：当前图片是最后一张并且向左滑动结束时的回调函数，第一个入参为当前ImageViewer实例，第二个入参是滑动的X轴距离(参数可选);

headerRender和footerRender返回的html字符串，可以为对应的标签添加上`number-current`和`number-total`样式类，该组件
会自动寻找拥有这两个样式类的标签，并且在图片滑动时添加一些数据，`number-current`样式类对应的是当前图片所在的数组下标，
`number-total`样式类对应的是图片总数。
```javascript
document.addEventListener('DOMContentLoaded', function () {
    // 图片对象说明:
    // thumbnail: 缩略图的链接(非必传)
    // url: 原图的链接(必传)
    // el: 用于计算位置以实现渐变动画(非必传，不需要动画的时候可以忽略)
    // var images = [
    //     {thumbnail: 'thumbnails/2.jpg', url: 'images/2.jpg', el: document.getElementById('img1')},
    //     {thumbnail: 'thumbnails/3.jpg', url: 'images/3.jpg', el: document.getElementById('img2')},
    //     {thumbnail: 'thumbnails/4.jpg', url: 'images/4.jpg', el: document.getElementById('img3')},
    //     {thumbnail: 'thumbnails/5.jpg', url: 'images/5.jpg', el: document.getElementById('img4')},
    //     {thumbnail: 'thumbnails/6.jpg', url: 'images/6.jpg', el: document.getElementById('img5')},
    //     {thumbnail: 'thumbnails/7.jpg', url: 'images/7.jpg', el: document.getElementById('img6')},
    //     {thumbnail: 'thumbnails/8.jpg', url: 'images/8.jpg', el: document.getElementById('img7')}
    // ];
    var images = [
        {url: 'images/2.jpg'},
        {url: 'images/3.jpg'},
        {url: 'images/4.jpg'},
        {url: 'images/5.jpg'}
    ];
    window.imageViewer = new ImageViewer(images, {
        container: 'body',
        enableScale: true,
        enableTapClose: true,
        fadeIn: true,
        fadeOut: true,
        startIndex: 0,
        headerRender: function () {
            setTimeout(function () {
                document.getElementById('close').addEventListener('click', function () {
                    imageViewer.close();
                }, false);
            }, 0);
            return '<div id="close">关闭</div>';
        },
        footerRender: function () {
            return '<span class="number-current"></span>/<span class="number-total"></span>';
        },
        beforeSwipe: function (current) {
            console.info('current-before: ' + current);
        },
        afterSwipe: function (current) {
            console.info('current-after: ' + current);
        },
        swipeLastLeft: function (imageViewer, distance) {
            console.log('swipeLastLeft', distance);
            // if (distance > 50) {
            //     imageViewer.setImageOption([{
            //         thumbnail: 'thumbnails/6.jpg',
            //         url: 'images/6.jpg',
            //         el: document.getElementById('img5')
            //     }]);
            //     return true;
            // }
        },
        swipeFirstRight: function (imageViewer, distance) {
            console.log('swipeFirstRight', distance);
            // if (distance > 30) {
            //     imageViewer.setImageOption([
            //         {thumbnail: 'thumbnails/7.jpg', url: 'images/7.jpg', el: document.getElementById('img6')},
            //         {thumbnail: 'thumbnails/8.jpg', url: 'images/8.jpg', el: document.getElementById('img7')}
            //     ]);
            //     return true;
            // }
        }
    });

    document.getElementsByClassName('img-list')[0].addEventListener('click', function (event) {
        var index = event.target.getAttribute('data-index');
        if (index) {
            imageViewer.open(parseInt(index));
            // imageViewer.open(0);
        }
    }, false);
}, false);
```

## 内置API
ImageViewer类的实例拥有以下可用的API函数：
- `open`：初始化图片预览组件并且显示，入参为想要展示的图片所在数组下标；
- `close`：关闭图片预览组件；
- `destroy`：销毁图片预览组件；
- `setImageOption`：设置图片数据，第一个入参为图片数组，第二个入参为开始预览的第一张图片所在数组下标；
- `swipeInByIndex`：将对应的图片切换到当前显示界面上，入参为所要展示的图片所在数组下标；

