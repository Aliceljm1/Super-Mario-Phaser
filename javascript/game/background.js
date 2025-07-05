var Ucren = require( "../lib/ucren" );
var layer = require( "../layer" );
var timeline = require( "../timeline" );

// Vision therapy background system
var backgroundCanvas, image, canvasContext;
var backgroundMode = 0; // 0: original, 1: grayscale stripes, 2: red-white stripes, 3: red-blue flashing
var switchTimer, animationTimer;
var currentTime = 0;
var scrollOffset = 0;

var MODES = {
    ORIGINAL: 0,
    GRAY_STRIPES: 1,
    RED_WHITE_STRIPES: 2,
    RED_BLUE_FLASH: 3,
    GREEN_RED_STRIPES: 4
};

var SWITCH_INTERVAL = 10000; // 10秒切换一次背景
var ANIMATION_SPEED = 30; // 30ms刷新率

var random = Ucren.randomNumber;

// 创建canvas元素用于动态生成背景
function createBackgroundCanvas() {
    backgroundCanvas = document.createElement('canvas');
    backgroundCanvas.width = 640;
    backgroundCanvas.height = 480;
    canvasContext = backgroundCanvas.getContext('2d');
}

// 生成灰白条纹背景
function generateGrayStripes() {
    canvasContext.clearRect(0, 0, 640, 480);
    var stripeWidth = 20;
    var offset = (scrollOffset % (stripeWidth * 2));
    
    for (var x = -stripeWidth + offset; x < 640 + stripeWidth; x += stripeWidth * 2) {
        canvasContext.fillStyle = '#ffffff';
        canvasContext.fillRect(x, 0, stripeWidth, 480);
        canvasContext.fillStyle = '#808080';
        canvasContext.fillRect(x + stripeWidth, 0, stripeWidth, 480);
    }
}

// 生成红白条纹背景
function generateRedWhiteStripes() {
    canvasContext.clearRect(0, 0, 640, 480);
    var stripeWidth = 25;
    var offset = (scrollOffset % (stripeWidth * 2));
    
    for (var x = -stripeWidth + offset; x < 640 + stripeWidth; x += stripeWidth * 2) {
        canvasContext.fillStyle = '#ff0000';
        canvasContext.fillRect(x, 0, stripeWidth, 480);
        canvasContext.fillStyle = '#ffffff';
        canvasContext.fillRect(x + stripeWidth, 0, stripeWidth, 480);
    }
}

// 生成红绿条纹背景
function generateRedGreenStripes() {
    canvasContext.clearRect(0, 0, 640, 480);
    var stripeWidth = 30;
    var angle = currentTime * 0.002; // 旋转角度
    
    canvasContext.save();
    canvasContext.translate(320, 240);
    canvasContext.rotate(angle);
    canvasContext.translate(-320, -240);
    
    for (var x = -100; x < 800; x += stripeWidth * 2) {
        canvasContext.fillStyle = '#ff0000';
        canvasContext.fillRect(x, -100, stripeWidth, 680);
        canvasContext.fillStyle = '#00ff00';
        canvasContext.fillRect(x + stripeWidth, -100, stripeWidth, 680);
    }
    
    canvasContext.restore();
}

// 生成红蓝闪烁背景
function generateRedBlueFlash() {
    canvasContext.clearRect(0, 0, 640, 480);
    
    // 使用正弦波创建平滑的颜色过渡
    var phase = (currentTime * 0.005) % (Math.PI * 2);
    var redIntensity = Math.sin(phase) * 0.5 + 0.5; // 0-1之间
    var blueIntensity = Math.sin(phase + Math.PI) * 0.5 + 0.5; // 相位相反
    
    // 创建渐变背景
    var gradient = canvasContext.createLinearGradient(0, 0, 640, 480);
    gradient.addColorStop(0, `rgb(${Math.floor(redIntensity * 255)}, 0, ${Math.floor(blueIntensity * 255)})`);
    gradient.addColorStop(0.5, `rgb(${Math.floor(redIntensity * 128)}, 0, ${Math.floor(blueIntensity * 128)})`);
    gradient.addColorStop(1, `rgb(${Math.floor(redIntensity * 255)}, 0, ${Math.floor(blueIntensity * 255)})`);
    
    canvasContext.fillStyle = gradient;
    canvasContext.fillRect(0, 0, 640, 480);
    
    // 添加闪烁的圆点效果
    var dotCount = 20;
    for (var i = 0; i < dotCount; i++) {
        var x = (i * 137 + currentTime * 0.1) % 640;
        var y = (i * 97 + currentTime * 0.08) % 480;
        var radius = Math.sin(currentTime * 0.003 + i) * 10 + 15;
        
        var dotPhase = phase + i * 0.5;
        var dotRed = Math.sin(dotPhase) * 0.5 + 0.5;
        var dotBlue = Math.sin(dotPhase + Math.PI) * 0.5 + 0.5;
        
        canvasContext.beginPath();
        canvasContext.arc(x, y, radius, 0, Math.PI * 2);
        canvasContext.fillStyle = `rgba(${Math.floor(dotRed * 255)}, 0, ${Math.floor(dotBlue * 255)}, 0.6)`;
        canvasContext.fill();
    }
}

// 更新背景动画
function updateBackgroundAnimation() {
    currentTime += ANIMATION_SPEED;
    scrollOffset += 1; // 滚动速度
    
    switch (backgroundMode) {
        case MODES.GRAY_STRIPES:
            generateGrayStripes();
            break;
        case MODES.RED_WHITE_STRIPES:
            generateRedWhiteStripes();
            break;
        case MODES.RED_BLUE_FLASH:
            generateRedBlueFlash();
            break;
        case MODES.GREEN_RED_STRIPES:
            generateRedGreenStripes();
            break;
        default:
            return; // 原始背景不需要动画更新
    }
    
    if (image && backgroundMode !== MODES.ORIGINAL) {
        // 将canvas内容转换为图像并更新背景
        var dataURL = backgroundCanvas.toDataURL();
        image.attr({ src: dataURL });
    }
}

// 切换背景模式
function switchBackgroundMode() {
    backgroundMode = (backgroundMode + 1) % 5;
    console.log('切换到弱视训练背景模式:', getModeName(backgroundMode));
    
    if (backgroundMode === MODES.ORIGINAL) {
        // 切换回原始背景
        if (image) {
            image.attr({ src: "images/background.jpg" });
        }
    } else {
        // 立即更新新模式的背景
        updateBackgroundAnimation();
    }
}

// 获取模式名称
function getModeName(mode) {
    switch (mode) {
        case MODES.ORIGINAL: return "原始背景";
        case MODES.GRAY_STRIPES: return "灰白条纹 (对比敏感度训练)";
        case MODES.RED_WHITE_STRIPES: return "红白条纹 (颜色对比训练)";
        case MODES.RED_BLUE_FLASH: return "红蓝闪烁 (双眼抑制训练)";
        case MODES.GREEN_RED_STRIPES: return "红绿旋转条纹 (眼球追踪训练)";
        default: return "未知模式";
    }
}

exports.set = function(){
    // 创建canvas用于动态背景生成
    createBackgroundCanvas();
    
    // 创建背景图像
    image = layer.createImage( "default", "images/background.jpg", 0, 0, 640, 480 );
    
    // 启动定时切换
    exports.startVisionTherapy();
    
    console.log('弱视训练背景系统已启动');
    console.log('当前模式:', getModeName(backgroundMode));
};

exports.wobble = function(){
    var wobbleTime = timeline.setInterval( wobble, 50 );
    return wobbleTime;
};

exports.stop = function(){
    if (switchTimer) {
        switchTimer.stop();
        switchTimer = null;
    }
    if (animationTimer) {
        animationTimer.stop();
        animationTimer = null;
    }
    if (image) {
        image.attr({ x: 0, y: 0 });
    }
};

// 启动弱视训练模式
exports.startVisionTherapy = function(){
    // 启动背景切换定时器
    switchTimer = timeline.setInterval(switchBackgroundMode, SWITCH_INTERVAL);
    
    // 启动动画更新定时器
    animationTimer = timeline.setInterval(updateBackgroundAnimation, ANIMATION_SPEED);
};

// 停止弱视训练模式
exports.stopVisionTherapy = function(){
    if (switchTimer) {
        switchTimer.stop();
        switchTimer = null;
    }
    if (animationTimer) {
        animationTimer.stop();
        animationTimer = null;
    }
    
    // 恢复原始背景
    backgroundMode = MODES.ORIGINAL;
    if (image) {
        image.attr({ src: "images/background.jpg" });
    }
};

// 手动切换背景模式
exports.switchMode = function(){
    switchBackgroundMode();
};

// 获取当前模式信息
exports.getCurrentMode = function(){
    return {
        mode: backgroundMode,
        name: getModeName(backgroundMode)
    };
};

function wobble(){
    var x, y;
    x = random( 12 ) - 6;
    y = random( 12 ) - 6;
    if (image) {
        image.attr({ x: x, y: y });
    }
}