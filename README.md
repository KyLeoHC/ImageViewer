# ImageViewer
ImageViewer是一个用于web移动端的图片预览组件。
## 引入方式
将本项目dist文件夹中的js文件放到目标项目中即可。
## 使用示例
ImageViewer是这个图片预览组件的核心类，实例化第一个入参是图片数组（必传），第二个为一些可选的选项参数对象。
选项参数包括：
- `container`：一个简单的选择器，代表该图片预览组件所应该插入到的地方（参数可选，默认为body元素）；
- `enableScale`：是否启用图片缩放功能（参数可选，默认为true）
- `startIndex`：开始预览的第一张图片所在数组下标，从0开始（参数可选，默认为0）；
- `headerRender`：头部渲染函数，返回一个html字符串并且会被显示在图片预览界面上方，用于自定义头部显示（参数可选）；
- `footerRender`：尾部渲染函数，返回一个html字符串并且会被显示在图片预览界面下方，用于自定义尾部显示（参数可选）；
- `beforeSwipe`：图片开始滑动时的回调函数，入参为当前显示的图片的下标（参数可选）；
- `afterSwipe`：图片滑动结束并且是切换图片时的回调函数，入参为当前显示的图片的下标（参数可选）；

headerRender和footerRender返回的html字符串，可以为对应的标签添加上`number-current`和`number-total`样式类，该组件
会自动寻找拥有这两个样式类的标签，并且在图片滑动时添加一些数据，`number-current`样式类对应的是当前图片所在的数组下标，
`number-total`样式类对应的是图片总数。
```javascript
var images = ['images/1.png', 'images/2.gif', 'images/3.png', 'images/4.jpeg'];
var imageViewer = new ImageViewer(images, {
    container: 'body',
    enableScale: true,
    startIndex: 0,
    headerRender: function () {
        return '<span></span>';
    },
    footerRender: function () {
        return '<span class="number-current"></span>/<span class="number-total"></span>';
    },
    beforeSwipe: function (current) {
        console.info('current-before: ' + current);
    },
    afterSwipe: function (current) {
        console.info('current-after: ' + current);
    }
});
imageViewer.open();
```
## 内置API
ImageViewer类的实例拥有以下可用的API函数：
- `open`：初始化图片预览组件并且显示；
- `close`：关闭图片预览组件；
- `destroy`：销毁图片预览组件；
- `setImageOption`：设置图片数据，第一个入参为图片数组，第二个入参为开始预览的第一张图片所在数组下标；
- `swipeInByIndex`：将对应的图片切换到当前显示界面上，入参为所要展示的图片所在数组下标；

