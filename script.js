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

draggables.forEach((draggable) => {
    draggable.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("source", "sidebar");
        e.dataTransfer.setData("part", draggable.dataset.part);
        e.dataTransfer.setData("mat", draggable.dataset.mat);
        draggable.style.opacity = "0.5";
    });
    draggable.addEventListener("dragend", () => {
        draggable.style.opacity = "1";
    });
});

dropZones.forEach((zone) => {
    zone.draggable = true;

    zone.addEventListener("dragstart", (e) => {
        if (!zone.classList.contains("installed")) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("source", "installed");
        e.dataTransfer.setData("part", zone.dataset.target);
        zone.style.opacity = "0.5";
    });

    zone.addEventListener("dragend", (e) => {
        zone.style.opacity = "1";
    });
});

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

        if (partType !== targetType) {
            shakeElement(zone);
            return;
        }

        installPart(targetType, matType);
    });
});

sidebar.addEventListener("dragover", (e) => e.preventDefault());
sidebar.addEventListener("drop", (e) => {
    e.preventDefault();
    const source = e.dataTransfer.getData("source");
    const partType = e.dataTransfer.getData("part");

    if (source === "installed") {
        uninstallPart(partType);
    }
});

// =========================================================
// 2. 组装状态管理
// =========================================================

function installPart(partType, matType) {
    currentAssembly[partType] = matType;
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
        );
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
        startTestBtn.classList.add("pulse");
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
    assemblyScreen.classList.remove("active");
    testScreen.classList.add("active");

    testTrackMarker.appendChild(carContainer);
    carContainer.classList.remove("exploded-view");
    carContainer.classList.add("assembled-view");
    carContainer.style.left = "0px";

    testMessage.textContent = "🚦 引擎启动... 测试开始！";
    resetBtn.style.display = "none";

    setTimeout(runSimulation, 1000);
});

resetBtn.addEventListener("click", () => {
    testScreen.classList.remove("active");
    assemblyScreen.classList.add("active");

    document.getElementById("workbench").appendChild(carContainer);
    carContainer.classList.remove("assembled-view");
    carContainer.classList.add("exploded-view");

    carContainer.style.left = "";
    carContainer.style.bottom = "";
    carContainer.style.position = "";

    cleanUpEffects();
});

// =========================================================
// 4. 物理模拟引擎
// =========================================================

function runSimulation() {
    const { tire, chassis, body, motor, gear } = currentAssembly;

    let errorList = [];

    // --- 1. 逐项检查 (逻辑不变) ---

    if (motor !== "copper") {
        errorList.push({
            part: "motor",
            msg: "马达烧毁 (塑料不导电)",
            anim: "burnout-anim",
            distance: 50,
        });
    }
    if (gear === "soap") {
        errorList.push({
            part: "gear",
            msg: "齿轮打滑 (肥皂太滑)",
            anim: "slip-anim",
            distance: 50,
        });
    }
    if (chassis === "foam") {
        errorList.push({
            part: "chassis",
            msg: "底盘断裂 (泡沫太脆)",
            anim: "shatter-anim",
            distance: 100,
        });
    }

    // 轮胎检查
    if (tire === "glass") {
        errorList.push({
            part: "tire",
            msg: "轮胎震碎 (玻璃易碎)",
            anim: "shatter-anim",
            distance: 100,
        });
    } else if (tire === "plastic") {
        errorList.push({
            part: "tire",
            msg: "轮胎打滑 (抓地力不足)",
            anim: "slip-anim",
            distance: 100,
        });
    }

    // 车身检查
    if (body === "glass") {
        errorList.push({
            part: "body",
            msg: "车身震碎 (强度不足)",
            anim: "shatter-anim",
            distance: 400,
        });
    }

    // --- 2. 汇总结果 (修改了显示逻辑) ---

    const success = errorList.length === 0;
    let displayMsg = "";
    let finalSpeed = 2000;
    let finalDistance = 800;

    if (success) {
        if (body === "metal") {
            displayMsg = "⚠️ 这一项通过了，但是...\n金属车身太重，速度很慢。";
            finalSpeed = 4000;
        } else {
            displayMsg = "🏆 完美运行！\n设计非常合理。";
            finalSpeed = 2000;
        }
        testMessage.style.textAlign = "center"; // 成功信息居中好看
    } else {
        // === 失败显示优化 ===
        // 使用换行符 \n 和列表符号 •
        const errorLines = errorList.map((e) => `• ${e.msg}`);
        displayMsg = `❌ 测试失败，发现 ${errorList.length} 处故障：\n\n${errorLines.join("\n")}`;

        testMessage.style.textAlign = "left"; // 列表左对齐好看

        // 计算最短距离
        finalDistance = Math.min(...errorList.map((e) => e.distance));
        finalSpeed = 1000;
    }

    // --- 3. 执行动画 ---

    carContainer.classList.add("drive-anim");
    carContainer.style.transition = `left ${finalSpeed}ms linear`;

    void carContainer.offsetWidth;
    carContainer.style.left = finalDistance + "px";

    setTimeout(() => {
        carContainer.classList.remove("drive-anim");

        // 设置文本颜色和内容
        if (!success) {
            testMessage.style.color = "#c0392b";
            // 触发所有特效
            errorList.forEach((err) => {
                applyCrashEffect(err.part, err.anim);

                // [修改开始] ---------------------------------------
                if (err.part === "motor" || err.part === "gear") {
                    // 1. 仍然给大容器加 reveal-failure，为了让车身变透明
                    carContainer.classList.add("reveal-failure");

                    // 2. [新增] 准确找到出问题的那个零件 DOM，并单独给它加高亮
                    let selector = "";
                    if (err.part === "motor") selector = ".part-motor";
                    if (err.part === "gear") selector = ".part-gears"; // 注意 HTML 中类名是复数 part-gears

                    const targetPart = carContainer.querySelector(selector);
                    if (targetPart) {
                        targetPart.classList.add("failure-highlight");
                    }
                }
            });
        } else {
            testMessage.style.color = "#27ae60";
        }

        testMessage.textContent = displayMsg; // 这里的 \n 会被 CSS 的 white-space: pre-wrap 识别

        resetBtn.style.display = "block";
    }, finalSpeed);
}

// 辅助函数：应用崩溃特效
function applyCrashEffect(partName, animName) {
    const partElement = document.querySelector(`.test-car .${partName}`);
    if (!partElement) return;

    // 1. 创建特效层
    const effectLayer = document.createElement("div");
    effectLayer.className = `crash-effect ${animName}`;

    // 获取部件的位置和大小，让特效层覆盖它
    const rect = partElement.getBoundingClientRect();
    const carRect = carContainer.getBoundingClientRect();

    effectLayer.style.top = rect.top - carRect.top + "px";
    effectLayer.style.left = rect.left - carRect.left + "px";
    effectLayer.style.width = rect.width + "px";
    effectLayer.style.height = rect.height + "px";

    // 2. 根据不同特效添加额外元素
    // 【核心修改】增加 partName === "tire" 的判断
    // 只有轮胎碎裂时才显示这个“⚡”图标，车身碎裂时不显示
    if (animName === "shatter-anim" && partName === "tire") {
        // 添加碎玻璃图标
        effectLayer.innerHTML = '<div class="glass-shard">⚡</div>';
    } else if (animName === "burnout-anim") {
        // 添加烟雾
        for (let i = 0; i < 3; i++) {
            const smoke = document.createElement("div");
            smoke.className = "smoke-particle";
            smoke.style.left = Math.random() * 20 - 10 + "px";
            smoke.style.animationDelay = i * 0.2 + "s";
            effectLayer.appendChild(smoke);
        }
    }

    carContainer.appendChild(effectLayer);
}

function cleanUpEffects() {
    const allParts = carContainer.querySelectorAll(".drop-zone");
    allParts.forEach((p) => {
        p.classList.remove("shatter-anim", "burnout-anim", "slip-anim", "failure-highlight");
        p.style.opacity = "";
    });

    // [修复] 强制清理特效残留
    const effects = carContainer.querySelectorAll(
        ".effect-smoke, .effect-crash, .effect-spark, .effect-shards",
    );
    effects.forEach((e) => {
        e.style.opacity = "0";
        e.style.animation = "none";
    });

    const shards = carContainer.querySelectorAll(
        ".body-shard-left, .body-shard-right",
    );
    shards.forEach((s) => s.remove());

    carContainer.classList.remove(
        "slip-anim",
        "burnout-anim",
        "reveal-failure",
    );

    testMessage.textContent = "准备出发...";
    testMessage.style.color = "#2f3640";
}
