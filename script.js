// DOM 元素获取
const assemblyScreen = document.getElementById("assembly-screen");
const testScreen = document.getElementById("test-screen");
const sidebar = document.getElementById("sidebar");
const carContainer = document.getElementById("car-container");
const workbench = document.getElementById("workbench");
const testTrackMarker = document.getElementById("test-track-marker");

const startTestBtn = document.getElementById("startTestBtn");
const resetBtn = document.getElementById("resetBtn");
const assemblyStatus = document.getElementById("assembly-status");
const testMessage = document.getElementById("test-message");

// 拖拽源与目标
const draggables = document.querySelectorAll(".draggable-item");
const dropZones = document.querySelectorAll(".drop-zone");

// 数据状态
let currentAssembly = {
    tire: null,
    chassis: null,
    body: null,
    motor: null,
    gear: null,
};

// =========================================================
// 1. 拖拽逻辑 (组装与卸载)
// =========================================================

// --- A. 从仓库拖零件 ---
draggables.forEach((draggable) => {
    draggable.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("source", "sidebar"); // 标记来源
        e.dataTransfer.setData("part", draggable.dataset.part);
        e.dataTransfer.setData("mat", draggable.dataset.mat);
        draggable.style.opacity = "0.5";
    });
    draggable.addEventListener("dragend", () => {
        draggable.style.opacity = "1";
    });
});

// --- B. 从已安装位置拖零件 (卸载/移动) ---
dropZones.forEach((zone) => {
    // 允许已安装的部件被拖动
    zone.draggable = true;

    zone.addEventListener("dragstart", (e) => {
        // 只有已安装了东西才能拖
        if (!zone.classList.contains("installed")) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("source", "installed");
        e.dataTransfer.setData("part", zone.dataset.target); // 告诉目标我是什么类型的零件
        // 视觉反馈
        zone.style.opacity = "0.5";
    });

    zone.addEventListener("dragend", (e) => {
        zone.style.opacity = "1";
        // 如果拖到了非放置区(比如侧边栏或者空白处), 此时需要依靠 drop 事件来处理吗？
        // 不，HTML5 dragend 无法知道 drop 在哪了。
        // 我们需要在 sidebar 上添加 drop 监听来处理"卸载"。
    });
});

// --- C. 放置逻辑 (安装) ---
dropZones.forEach((zone) => {
    zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    });
    zone.addEventListener("dragenter", (e) => {
        e.preventDefault();
        if (!zone.classList.contains("installed")) {
            zone.classList.add("highlight");
        }
    });
    zone.addEventListener("dragleave", () => {
        zone.classList.remove("highlight");
    });

    zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("highlight");

        const source = e.dataTransfer.getData("source");
        const partType = e.dataTransfer.getData("part");
        const matType = e.dataTransfer.getData("mat");
        const targetType = zone.dataset.target;

        // 验证: 只能把对应的零件放进去
        if (partType !== targetType) {
            shakeElement(zone);
            return;
        }

        // 如果是从侧边栏来的，或者是从其他已安装位置来的(虽然目前每个类型只有一个位置)
        // 执行安装
        installPart(targetType, matType);
    });
});

// --- D. 侧边栏放置逻辑 (卸载) ---
sidebar.addEventListener("dragover", (e) => e.preventDefault());
sidebar.addEventListener("drop", (e) => {
    e.preventDefault();
    const source = e.dataTransfer.getData("source");
    const partType = e.dataTransfer.getData("part");

    if (source === "installed") {
        // 卸载该零件
        uninstallPart(partType);
    }
});

// =========================================================
// 2. 组装状态管理
// =========================================================

function installPart(partType, matType) {
    // 1. 更新数据
    currentAssembly[partType] = matType;

    // 2. 更新视觉 (找到对应的 drop-zone)
    // 轮胎有多个，需要一起更新
    const targets = document.querySelectorAll(
        `.drop-zone[data-target="${partType}"]`,
    );
    targets.forEach((el) => {
        // 清除旧材质
        el.classList.remove(
            "rubber",
            "plastic",
            "glass",
            "metal",
            "foam",
            "copper",
            "soap",
        );
        // 添加新材质
        el.classList.add(matType);
        el.classList.add("installed");
    });

    checkCompletion();
}

function uninstallPart(partType) {
    currentAssembly[partType] = null;
    const targets = document.querySelectorAll(
        `.drop-zone[data-target="${partType}"]`,
    );
    targets.forEach((el) => {
        el.classList.remove(
            "rubber",
            "plastic",
            "glass",
            "metal",
            "foam",
            "copper",
            "soap",
            "installed",
        );
    });
    checkCompletion();
}

function checkCompletion() {
    const filled = Object.values(currentAssembly).filter(
        (v) => v !== null,
    ).length;
    const total = 5;

    if (filled === total) {
        assemblyStatus.textContent = "✅ 组装完成，可以测试！";
        assemblyStatus.style.color = "#27ae60";
        startTestBtn.disabled = false;
        startTestBtn.classList.add("pulse"); // 添加一个跳动效果提示点击
    } else {
        assemblyStatus.textContent = `组装进度: ${filled} / ${total}`;
        assemblyStatus.style.color = "#7f8c8d";
        startTestBtn.disabled = true;
        startTestBtn.classList.remove("pulse");
    }
}

function shakeElement(el) {
    el.style.transform = "translateX(5px)";
    setTimeout(() => {
        el.style.transform = "translateX(-5px)";
    }, 50);
    setTimeout(() => {
        el.style.transform = "translate(0)";
    }, 100);
}

// =========================================================
// 3. 场景切换与测试流程
// =========================================================

startTestBtn.addEventListener("click", () => {
    // 1. 切换界面
    assemblyScreen.classList.remove("active");
    testScreen.classList.add("active");

    // 2. 转移小车 DOM
    // 将 car-container 从 workbench 移动到 test-track-marker 内
    testTrackMarker.appendChild(carContainer);

    // 3. 变换形态 (Exploded -> Assembled)
    carContainer.classList.remove("exploded-view");
    carContainer.classList.add("assembled-view");

    // 4. 重置位置
    carContainer.style.left = "0px";

    // 5. 开始物理测试
    testMessage.textContent = "🚦 引擎启动... 测试开始！";
    resetBtn.style.display = "none"; // 测试中不能重置

    setTimeout(runSimulation, 1000); // 稍微延迟一下让用户看清变身过程
});

resetBtn.addEventListener("click", () => {
    // 1. 切换界面
    testScreen.classList.remove("active");
    assemblyScreen.classList.add("active");

    // 2. 转移小车 DOM 回家
    document.getElementById("workbench").appendChild(carContainer);

    // 3. 恢复形态 (Assembled -> Exploded)
    carContainer.classList.remove("assembled-view");
    carContainer.classList.add("exploded-view");

    // 4. 清理动画和位置
    cleanUpEffects();
    carContainer.style.left = ""; // 清除内联样式回到 CSS 默认

    // 注意：不清除 currentAssembly 数据，用户可以基于现有零件微调
});

// =========================================================
// 4. 物理模拟引擎
// =========================================================

function runSimulation() {
    const { tire, chassis, body, motor, gear } = currentAssembly;
    let result = {
        success: true,
        msg: "完美运行！",
        crashPart: null,
        anim: "",
    };
    let speed = 2000; // 默认跑完耗时

    // --- 故障检测逻辑 ---

    // 1. 马达检测
    if (motor !== "copper") {
        result = {
            success: false,
            msg: "马达烧毁！塑料不导电！",
            crashPart: "motor",
            anim: "burnout-anim",
        };
    }
    // 2. 齿轮检测
    else if (gear === "soap") {
        result = {
            success: false,
            msg: "齿轮打滑！肥皂太滑了！",
            crashPart: "gear",
            anim: "slip-anim",
        };
    }
    // 3. 底盘检测
    else if (chassis === "foam") {
        result = {
            success: false,
            msg: "底盘断裂！泡沫太脆！",
            crashPart: "chassis",
            anim: "shatter-anim",
        }; // 用shatter模拟断裂
    }
    // 4. 轮胎检测
    else if (tire === "glass") {
        // 玻璃轮胎跑一半碎
        result = {
            success: false,
            msg: "轮胎震碎了！玻璃不适合做轮子！",
            crashPart: "tire",
            anim: "shatter-anim",
        };
    } else if (tire === "plastic") {
        result = {
            success: false,
            msg: "轮胎打滑！塑料抓地力不足！",
            crashPart: "tire",
            anim: "slip-anim",
        };
    }
    // 5. 车身检测
    else if (body === "glass") {
        result = {
            success: false,
            msg: "车身震碎！玻璃太危险！",
            crashPart: "body",
            anim: "shatter-anim",
        };
    }
    // 金属车身太重
    else if (body === "metal") {
        result = {
            success: true,
            msg: "通过测试！但金属车身太重，速度很慢。",
            crashPart: null,
            anim: "",
        };
        speed = 4000; // 变慢
    }

    // --- 执行动画 ---

    // 开启行驶动画 (悬挂 + 轮子转)
    carContainer.classList.add("drive-anim");

    // 计算移动距离
    // 如果是轮胎/传动故障，原地不动或动一点点
    let distance =
        result.crashPart === "motor" || result.crashPart === "gear" ? 50 : 800;
    if (result.crashPart === "tire" && result.anim === "slip-anim")
        distance = 100;

    // 使用 transition 移动
    // 如果失败，时间缩短
    let duration = result.success ? speed : 1000;
    carContainer.style.transition = `left ${duration}ms linear`;

    // 强制重绘
    void carContainer.offsetWidth;
    carContainer.style.left = distance + "px";

    // --- 结束回调 ---
    setTimeout(() => {
        carContainer.classList.remove("drive-anim"); // 停车

        if (!result.success) {
            testMessage.textContent = "❌ 测试失败: " + result.msg;
            testMessage.style.color = "#c0392b";
            applyCrashEffect(result.crashPart, result.anim);
        } else {
            testMessage.textContent = "🏆 " + result.msg;
            testMessage.style.color = "#27ae60";
        }

        // 显示重置按钮
        resetBtn.style.display = "block";
    }, duration);
}

function applyCrashEffect(partName, animClass) {
    if (!partName) return;

    // 找到对应的零件 DOM
    const parts = carContainer.querySelectorAll(
        `.drop-zone[data-target="${partName}"]`,
    );
    parts.forEach((p) => {
        // 给特定零件加故障动画类 (在CSS中定义)
        p.classList.add(animClass);
        // 如果是整个车的大动作(比如打滑震动)，也给车容器加
        if (animClass === "slip-anim") carContainer.classList.add("slip-anim");
        if (animClass === "burnout-anim")
            carContainer.classList.add("burnout-anim");
    });
}

function cleanUpEffects() {
    // 移除所有故障动画类
    const allParts = carContainer.querySelectorAll(".drop-zone");
    allParts.forEach((p) => {
        p.classList.remove("shatter-anim", "burnout-anim", "slip-anim");
    });
    carContainer.classList.remove("slip-anim", "burnout-anim");

    testMessage.textContent = "准备出发...";
    testMessage.style.color = "#2f3640";
}
