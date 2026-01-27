const car = document.getElementById("car");
const message = document.getElementById("message");
const runBtn = document.getElementById("runBtn");
const resetBtn = document.getElementById("resetBtn");

// 拖拽相关
const draggables = document.querySelectorAll(".draggable-item");
const dropZones = document.querySelectorAll(".drop-zone");

// 组装状态
let currentAssembly = {
    tire: null,
    chassis: null,
    body: null,
    motor: null,
    gear: null,
};

// ==========================================
// 拖拽逻辑 (Drag & Drop)
// ==========================================

draggables.forEach((draggable) => {
    draggable.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("part", draggable.dataset.part);
        e.dataTransfer.setData("mat", draggable.dataset.mat);
        // 拖拽时的半透明效果
        draggable.style.opacity = "0.5";
    });

    draggable.addEventListener("dragend", () => {
        draggable.style.opacity = "1";
    });
});

dropZones.forEach((zone) => {
    zone.addEventListener("dragover", (e) => {
        e.preventDefault(); // 允许放置
        e.dataTransfer.dropEffect = "copy";
    });

    zone.addEventListener("dragenter", (e) => {
        e.preventDefault();
        // 只有类型匹配时才高亮 (可选)
        zone.classList.add("highlight");
    });

    zone.addEventListener("dragleave", () => {
        zone.classList.remove("highlight");
    });

    zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("highlight");

        const partType = e.dataTransfer.getData("part");
        const matType = e.dataTransfer.getData("mat");
        const targetType = zone.dataset.target;

        // 验证位置
        if (partType !== targetType) {
            playShakeEffect(zone); // 视觉反馈：位置不对时晃动
            showMessage("❌ 零件位置不对哦！请对应虚线框放置。", "error");
            return;
        }

        // 1. 更新数据
        currentAssembly[targetType] = matType;

        // 2. 更新视觉
        if (targetType === "tire") {
            document
                .querySelectorAll(".part-tire")
                .forEach((tire) => updateZoneVisual(tire, matType));
        } else {
            updateZoneVisual(zone, matType);
        }

        // 3. 检查完成度
        checkAssemblyComplete();

        showMessage(
            `🛠️ 已安装：${getMatName(matType)} ${getPartName(partType)}`,
            "normal",
        );
    });
});

function updateZoneVisual(element, mat) {
    // 移除旧材质
    element.classList.remove(
        "plastic",
        "metal",
        "glass",
        "rubber",
        "foam",
        "copper",
        "soap",
    );
    // 添加新材质
    element.classList.add(mat);
    // 标记为已安装
    element.classList.add("installed");
}

function playShakeEffect(element) {
    element.style.transform = "translateX(5px)";
    setTimeout(() => {
        element.style.transform = "translateX(-5px)";
    }, 50);
    setTimeout(() => {
        element.style.transform = "translate(0)";
    }, 100);
}

// 检查组装是否完成
function checkAssemblyComplete() {
    const allInstalled = Object.values(currentAssembly).every(
        (val) => val !== null,
    );
    if (allInstalled) {
        runBtn.disabled = false;
        runBtn.textContent = "🚀 启动测试";
        runBtn.style.transform = "scale(1.05)";
        showMessage("✅ 组装完成！快点击「启动测试」验证你的设计！", "success");
    }
}

// ==========================================
// 运行 & 重置
// ==========================================

runBtn.onclick = () => {
    checkPhysics(
        currentAssembly.tire,
        currentAssembly.chassis,
        currentAssembly.body,
        currentAssembly.motor,
        currentAssembly.gear,
    );
};

resetBtn.onclick = () => {
    // 位置重置
    car.style.left = "100px";

    // 数据重置
    currentAssembly = {
        tire: null,
        chassis: null,
        body: null,
        motor: null,
        gear: null,
    };

    // 视觉重置
    dropZones.forEach((zone) => {
        zone.classList.remove(
            "plastic",
            "metal",
            "glass",
            "rubber",
            "foam",
            "copper",
            "soap",
            "installed",
        );
    });

    // 动画重置
    resetAnimations();

    runBtn.disabled = true;
    runBtn.textContent = "🚀 启动测试";
    runBtn.style.transform = "none";

    showMessage("🔧 车辆已拆解，请重新组装。", "normal");
};

function resetAnimations() {
    car.className = "car"; // 移除所有附加动画类
    // 强制重置 transform 属性 (针对 collapse 效果)
    document.querySelector(".part-body").style.transform = "";
    document.querySelector(".internal-mechanics-layer").style.transform = "";
    document.querySelector(".part-chassis").style.transform = "";
    document.querySelector(".part-chassis").style.filter = "";
    // 隐藏特效
    document
        .querySelectorAll(
            ".effect-smoke, .effect-crash, .effect-spark, .effect-shards",
        )
        .forEach((el) => (el.style.opacity = 0));
    // 恢复马达颜色
    document
        .querySelectorAll(".part-motor .svg-fill-area")
        .forEach((el) => (el.style.fill = ""));
}

// ==========================================
// 物理逻辑与动画控制
// ==========================================

function checkPhysics(tireM, chassisM, bodyM, motorM, gearM) {
    resetAnimations();

    // 1. 马达检测 (导电性)
    if (motorM !== "copper") {
        fail("🚫 启动失败：马达不工作！(非铜线无法导电)");
        car.classList.add("burnout-anim"); // 烧毁/故障动画
        return;
    }

    // 2. 齿轮检测 (坚韧性)
    if (gearM === "soap") {
        fail("🧼 传动失败：肥皂齿轮太滑太软，直接失效！");
        car.classList.add("slip-anim"); // 打滑动画也能用于齿轮失效
        return;
    }

    // 3. 底盘检测 (硬度)
    if (chassisM === "foam") {
        fail("👎 结构坍塌：泡沫底盘太软，被压扁了！");
        car.classList.add("collapse-anim"); // 压垮动画
        return;
    }
    if (chassisM === "plastic" && bodyM === "metal") {
        // 特殊情况：塑料底盘扛不住金属车身
        fail("⚠️ 承重不足：塑料底盘撑不住厚重的金属车身，裂开了！");
        car.classList.add("collapse-anim");
        return;
    }

    // 4. 轮胎检测 (摩擦力)
    if (tireM === "plastic" || tireM === "glass") {
        fail("⛸️ 无法前进：硬轮子摩擦力太小，原地打滑！");
        car.classList.add("slip-anim");

        if (tireM === "glass") {
            setTimeout(() => {
                car.classList.remove("slip-anim");
                car.classList.add("shatter-anim"); // 玻璃破碎动画
                fail("💥 糟糕！玻璃轮子在剧烈震动中碎了！");
            }, 800);
        }
        return;
    }

    // 5. 车身检测 (安全性)
    if (bodyM === "glass") {
        runCar(300); // 跑一小段
        setTimeout(() => {
            fail("💥 危险：玻璃车身太脆，被震碎了！");
            car.classList.remove("drive-anim");
            car.classList.add("shatter-anim"); // 破碎动画
        }, 1000);
        return;
    }

    // --- 成功行驶 ---
    let distance = 800;
    let msg = "✅ 完美匹配！赛车性能卓越，全速前进！";

    if (bodyM === "metal") {
        distance -= 300;
        msg = "✅ 成功！但是...金属车身太重了，速度提不起来。";
    }
    if (gearM === "plastic") {
        distance -= 100;
        msg += " (注意: 塑料齿轮磨损较快)";
    }

    success(msg);
    runCar(distance);
}

function runCar(dist) {
    // 强制触发重绘以确保动画从头播放
    void car.offsetWidth;
    car.style.left = dist + "px";
    car.classList.add("drive-anim");
}

function showMessage(text, type) {
    message.textContent = text;
    message.className = "message-box"; // reset
    if (type === "error") {
        message.style.background = "#ff7675";
        message.style.color = "white";
        message.style.borderColor = "#d63031";
    } else if (type === "success") {
        message.style.background = "#55efc4";
        message.style.color = "#00b894";
        message.style.borderColor = "#00b894";
    } else {
        message.style.background = "#f1f2f6";
        message.style.color = "#2f3542";
    }
}
function fail(t) {
    showMessage(t, "error");
}
function success(t) {
    showMessage(t, "success");
}

// 辅助文字映射
function getMatName(m) {
    const map = {
        rubber: "橡胶",
        plastic: "塑料",
        glass: "玻璃",
        metal: "金属",
        foam: "泡沫",
        copper: "铜",
        soap: "肥皂",
    };
    return map[m] || m;
}
function getPartName(p) {
    const map = {
        tire: "轮胎",
        chassis: "底盘",
        body: "车身",
        motor: "马达",
        gear: "齿轮",
    };
    return map[p] || p;
}
