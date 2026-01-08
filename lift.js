let startFloor = 0;
console.log("lift.js loaded");
const FLOOR_BORDER = 1;
const FLOOR_HEIGHT = 80;
const LIFT_WIDTH = 60;
const LIFT_HEIGHT = 60;
const LIFT_GAP = 10;
const shaft = document.getElementById("shaft");
const floorsUI = document.getElementById("floors-ui"); 

const floorsInput = document.getElementById("floors");
const liftsInput = document.getElementById("lifts");
const generateBtn = document.getElementById("generate");
const building = document.getElementById("building");


const state = {
    floors: 0,
    lifts: 0,
    liftList: []
};

generateBtn.addEventListener("click", () => {
    const floors = Number(floorsInput.value);
    const lifts = Number(liftsInput.value);

    if (floors < 2 || lifts < 1) {
    alert("Need at least 2 floors and 1 lift");
    return;
   }

    state.floors = floors;
    state.lifts = lifts;
    state.liftList = [];

    building.style.display = "flex";

    createBuilding();
    createLifts();
});



function createBuilding() {
    shaft.innerHTML = "";
    floorsUI.innerHTML = "";
    const shaftWidth = state.lifts * (LIFT_WIDTH + LIFT_GAP);
    const visibleFloors = state.floors;
    startFloor = 0;


    shaft.style.width = `${shaftWidth}px`;
    building.style.width = `${shaftWidth + 200}px`; 

    building.style.display = "flex";
    building.style.alignItems = "stretch";
   

    shaft.style.position = "relative";
    shaft.style.width = state.lifts * (LIFT_WIDTH + LIFT_GAP) + "px";
    shaft.style.height = visibleFloors * FLOOR_HEIGHT + "px";
    shaft.style.border = "2px solid black";

    floorsUI.style.display = "flex";
    floorsUI.style.flexDirection = "column";

    for (let i = state.floors - 1; i >= startFloor; i--) {
        const floor = document.createElement("div");
        floor.className = "floor";
        const label = document.createElement("span");
        label.textContent = `Floor ${i}`;
        
        const btnGroup = document.createElement("div");

        if (i < state.floors - 1) {
           const upBtn = document.createElement("button");
           upBtn.textContent = "▲";
           upBtn.className = "floor-btn up";
           upBtn.onclick = () => handleLiftCall(i, upBtn);
           btnGroup.appendChild(upBtn);
        }

        if (i > 0) {
           const downBtn = document.createElement("button");
           downBtn.textContent = "▼";
           downBtn.className = "floor-btn down";
           downBtn.onclick = () => handleLiftCall(i, downBtn);
           btnGroup.appendChild(downBtn);
        }

        floor.appendChild(label);
        floor.appendChild(btnGroup);
        floorsUI.appendChild(floor);

    }

}



function createLifts() {
    state.liftList = [];
    shaft.innerHTML ="";


    for (let i = 0; i < state.lifts; i++) {
        const lift = {
            id: i,
            currentFloor: 0,
            busy: false,
            direction: null,
            doorsOpen: false,
            queue: [],
            activeStops: [] 
        };
        state.liftList.push(lift);

        const liftDiv = document.createElement("div");
        liftDiv.id = `lift-${i}`;
        liftDiv.className = "lift";
        liftDiv.style.left = `${10 
        + i * (LIFT_WIDTH + LIFT_GAP)}px`;
        liftDiv.style.bottom = `-${FLOOR_BORDER}px`;


       
        const leftDoor = document.createElement("div");
        leftDoor.className = "door left";

      
        const rightDoor = document.createElement("div");
        rightDoor.className = "door right";

        liftDiv.appendChild(leftDoor);
        liftDiv.appendChild(rightDoor);
        shaft.appendChild(liftDiv);
    }
}

function handleLiftCall(floorNumber, buttonElement) {
    const lift = getBestLift(floorNumber);
    if (!lift) {
        return;
    }

    buttonElement.classList.add("active");

    lift.queue.push({
        floor: floorNumber,
        button: buttonElement
    });
    console.log("Lift queue now:", lift.queue);
    if (!lift.busy) {
        processLiftQueue(lift);
    }
}




function moveLiftWithDoors(lift, request) {
    const targetFloor = request.floor;

    const liftDiv = document.getElementById(`lift-${lift.id}`);

    const floorsToMove = Math.abs(targetFloor - lift.currentFloor);
    const travelTime = floorsToMove * 2;
    liftDiv.style.transition = `bottom ${travelTime}s linear`;
    const visualFloor = targetFloor - startFloor;
    liftDiv.style.bottom = `${visualFloor * FLOOR_HEIGHT - FLOOR_BORDER}px`;

    setTimeout(() => {
        lift.currentFloor = targetFloor;
        openDoors(lift);
        request.button.classList.remove("active");

        
        setTimeout(() => {
            closeDoors(lift);

            setTimeout(() => {
                processLiftQueue(lift);
            }, 2500);

        }, 2500);

    }, travelTime * 1000);
}



function openDoors(lift) {
    const liftDiv = document.getElementById(`lift-${lift.id}`);
    const leftDoor = liftDiv.children[0];
    const rightDoor = liftDiv.children[1];

    leftDoor.style.transform = "translateX(-100%)";
    rightDoor.style.transform = "translateX(100%)";

    lift.doorsOpen = true;
}

function closeDoors(lift) {
    const liftDiv = document.getElementById(`lift-${lift.id}`);
    const leftDoor = liftDiv.children[0];
    const rightDoor = liftDiv.children[1];

    leftDoor.style.transform = "translateX(0)";
    rightDoor.style.transform = "translateX(0)";

    lift.doorsOpen = false;
}

function processLiftQueue(lift) {
    if (lift.queue.length === 0) {
        lift.busy = false;
        lift.direction = null;
        return;
    }

    if (!lift.busy) {
        const next = lift.queue[0];
        lift.direction = next.floor > lift.currentFloor ? "up" : "down";
        lift.busy = true;
    }

    let directionQueue = lift.queue.filter(req =>
        lift.direction === "up"
            ? req.floor >= lift.currentFloor
            : req.floor <= lift.currentFloor
    );

    if (directionQueue.length === 0) {
        lift.direction = lift.direction === "up" ? "down" : "up";
        setTimeout(() => processLiftQueue(lift), 0);
        return;
    }
    directionQueue.sort((a, b) =>
        lift.direction === "up"
            ? a.floor - b.floor
            : b.floor - a.floor
    );

    const nextStop = directionQueue[0];
    lift.queue = lift.queue.filter(req => req !== nextStop);

    moveLiftWithDoors(lift, nextStop);
}

function getBestLift(floorNumber) {
    const idleLifts = state.liftList.filter(l => !l.busy);
    const candidates = idleLifts.length ? idleLifts : state.liftList;

    let bestLift = null;
    let bestDistance = Infinity;

    for (const lift of candidates) {
        const distance = Math.abs(lift.currentFloor - floorNumber);
        if (distance < bestDistance) {
            bestDistance = distance;
            bestLift = lift;
        }
    }

    return bestLift;
}
