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
    let result = {
        success: true,
        msg: "完美运行！",
        crashPart: null,
        anim: "",
    };
    let speed = 2000;

    if (motor !== "copper") {
        result = {
            success: false,
            msg: "马达烧毁！塑料不导电！",
            crashPart: "motor",
            anim: "burnout-anim",
        };
    } else if (gear === "soap") {
        result = {
            success: false,
            msg: "齿轮打滑！肥皂太滑了！",
            crashPart: "gear",
            anim: "slip-anim",
        };
    } else if (chassis === "foam") {
        result = {
            success: false,
            msg: "底盘断裂！泡沫太脆！",
            crashPart: "chassis",
            anim: "shatter-anim",
        };
    } else if (tire === "glass") {
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
    } else if (body === "glass") {
        result = {
            success: false,
            msg: "车身震碎！玻璃太危险！",
            crashPart: "body",
            anim: "shatter-anim",
        };
    } else if (body === "metal") {
        result = {
            success: true,
            msg: "通过测试！但金属车身太重，速度很慢。",
            crashPart: null,
            anim: "",
        };
        speed = 4000;
    }

    carContainer.classList.add("drive-anim");

    let distance =
        result.crashPart === "motor" || result.crashPart === "gear" ? 50 : 800;
    if (result.crashPart === "tire" && result.anim === "slip-anim")
        distance = 100;
    if (result.crashPart === "body") distance = 400;

    let duration = result.success
        ? speed
        : result.crashPart === "body"
          ? 1000
          : 1000;
    carContainer.style.transition = `left ${duration}ms linear`;

    void carContainer.offsetWidth;
    carContainer.style.left = distance + "px";

    setTimeout(() => {
        carContainer.classList.remove("drive-anim");

        if (!result.success) {
            testMessage.textContent = "❌ 测试失败: " + result.msg;
            testMessage.style.color = "#c0392b";
            applyCrashEffect(result.crashPart, result.anim);

            if (result.crashPart === "motor" || result.crashPart === "gear") {
                carContainer.classList.add("reveal-failure");
            }
        } else {
            testMessage.textContent = "🏆 " + result.msg;
            testMessage.style.color = "#27ae60";
        }

        resetBtn.style.display = "block";
    }, duration);
}

function applyCrashEffect(partName, animClass) {
    if (!partName) return;

    if (partName === "body" && animClass === "shatter-anim") {
        const bodyPart = carContainer.querySelector(
            '.drop-zone[data-target="body"]',
        );
        if (bodyPart) {
            bodyPart.style.opacity = "0";
            const shardLeft = bodyPart.cloneNode(true);
            const shardRight = bodyPart.cloneNode(true);

            shardLeft.className =
                "drop-zone part-body installed body-shard-left glass";
            shardRight.className =
                "drop-zone part-body installed body-shard-right glass";
            shardLeft.style.opacity = "1";
            shardRight.style.opacity = "1";

            carContainer.appendChild(shardLeft);
            carContainer.appendChild(shardRight);

            const shardsEffect = carContainer.querySelector(".effect-shards");
            if (shardsEffect) {
                shardsEffect.style.opacity = 1;
                shardsEffect.style.animation = "explode 0.5s forwards";
            }
        }
        return;
    }

    const parts = carContainer.querySelectorAll(
        `.drop-zone[data-target="${partName}"]`,
    );
    parts.forEach((p) => {
        p.classList.add(animClass);
        if (animClass === "slip-anim") carContainer.classList.add("slip-anim");
        if (animClass === "burnout-anim")
            carContainer.classList.add("burnout-anim");
    });
}

function cleanUpEffects() {
    const allParts = carContainer.querySelectorAll(".drop-zone");
    allParts.forEach((p) => {
        p.classList.remove("shatter-anim", "burnout-anim", "slip-anim");
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
