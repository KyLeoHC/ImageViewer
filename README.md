<a href="https://www.npmjs.com/package/image-viewer-gallery"><img src="https://img.shields.io/npm/v/image-viewer-gallery.svg" alt="Version"></a>

# ImageViewer
ImageViewer是一个用于web移动端的图片预览组件。

## demo
请使用手机打开链接查看，PC端请打开控制台模拟移动设备
[demo](http://freeui.org/imageViewer2/)

## 引入方式
### 常规script标签引入
将本项目dist文件夹中的`imageViewer.min.js`文件放到目标项目或者CDN，通过script标签加载，访问挂载到全局window的ImageViewer类实例化使用
### npm install
``` bash
npm install image-viewer-gallery --save-dev
```
如果目标项目本身就是基于webpack + babel开发的话，可以直接引入`import ImageViewer from 'image-viewer-gallery'`，需要注意的是确保配置好stylus-loader和html-loader。

如果目标项目没有配置babel编译或者也不是用webpack构建的，可以直接require引入dist文件夹下的`imageViewer.common.js`文件(`image-viewer-gallery/dist/imageViewer.common.js`)。

## 使用示例
ImageViewer是这个图片预览组件的核心类，实例化第一个入参是图片数组（必传），第二个为一些可选的选项参数对象。
选项参数包括：
- `container`：一个简单的选择器，代表该图片预览组件所应该插入到的地方(参数可选，默认为body元素);
- `duration`: 渐变动画速度(参数可选，默认333，单位为ms);
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

`fadeInFn`和`fadeOutFn`选项的函数，返回值可以是一个元素节点对象，也可以是一个结构为`{width,height,top,left}`的对象值，还可以什么都不返回。

headerRender和footerRender返回的html字符串，可以为对应的标签添加上`number-current`和`number-total`样式类，该组件
会自动寻找拥有这两个样式类的标签，并且在图片滑动时添加一些数据，`number-current`样式类对应的是当前图片所在的数组下标，
`number-total`样式类对应的是图片总数。
```javascript
document.addEventListener('DOMContentLoaded', function () {
    function getElement(index) {
        // 可以不返回任何一个值，仅仅传入一个空函数指明要开启渐变动画
        // 也可以直接返回position数据 {top: 0, left: 0, width: 0, height: 0}
        // 也可以直接就是一个空函数，不返回任何值(此时只有简单的透明度渐变动画)
        return document.getElementById('img' + (index + 1));
    }

    // 图片对象说明:
    // thumbnail: 缩略图的链接(非必传)
    // url: 原图的链接(必传)
    var images = [
        {url: 'thumbnails/2.jpg'},
        {thumbnail: 'thumbnails/3.jpg', url: 'images/3.jpg'},
        {thumbnail: 'thumbnails/4.jpg', url: 'images/4.jpg'},
        {thumbnail: 'thumbnails/5.jpg', url: 'images/5.jpg'},
        {thumbnail: 'thumbnails/6.jpg', url: 'images/6.jpg'},
        {thumbnail: 'thumbnails/7.jpg', url: 'images/7.jpg'},
        {url: 'thumbnails/8.jpg'}
    ];
    // 也可以先实例化 var imageViewer = new ImageViewer()
    // 后续再调用'setImageOption'设置图片数据和'setOption'设置预览选项
    // 最后再调用open函数打开预览
    window.imageViewer = new ImageViewer(images, {
        container: 'body',
        enableScale: true,
        enableTapClose: true,
        startIndex: 0,
        fadeInFn: getElement,
        fadeOutFn: getElement,
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
            //         url: 'images/6.jpg'
            //     }]);
            //     return true;
            // }
        },
        swipeFirstRight: function (imageViewer, distance) {
            console.log('swipeFirstRight', distance);
            // if (distance > 30) {
            //     imageViewer.setImageOption([
            //         {thumbnail: 'thumbnails/7.jpg', url: 'images/7.jpg'},
            //         {thumbnail: 'thumbnails/8.jpg', url: 'images/8.jpg'}
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
- `setOption`：设置预览参数，参考使用示例的ImageViewer类第二个入参参数介绍；
- `swipeInByIndex`：将对应的图片切换到当前显示界面上，入参为所要展示的图片所在数组下标；

## License

[MIT License](https://github.com/KyLeoHC/ImageViewer/blob/master/LICENSE)