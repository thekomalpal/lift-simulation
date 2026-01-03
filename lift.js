console.log("lift.js loaded");
const FLOOR_BORDER = 1;
const FLOOR_HEIGHT = 80;
const LIFT_WIDTH = 60;
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

    if (floors <= 0 || lifts <= 0) {
        alert("Please enter valid number of floors and lifts");
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
    const shaftWidth = state.lifts * (LIFT_WIDTH + LIFT_GAP);

    shaft.style.width = `${shaftWidth}px`;
    building.style.width = `${shaftWidth + 200}px`; 

    building.style.display = "flex";
    building.style.alignItems = "stretch";
    shaft.innerHTML = "";
    floorsUI.innerHTML = "";

    shaft.style.position = "relative";
    shaft.style.height = state.floors * FLOOR_HEIGHT + "px";
    shaft.style.width = state.lifts * (LIFT_WIDTH + LIFT_GAP) + "px";
    shaft.style.height = state.floors * FLOOR_HEIGHT + "px";
    shaft.style.border = "2px solid black";

    floorsUI.style.display = "flex";
    floorsUI.style.flexDirection = "column";

    for (let i = state.floors - 1; i >= 0; i--) {
        const floor = document.createElement("div");
        floor.className = "floor";
        const label = document.createElement("span");
        label.textContent = `Floor ${i}`;

        const btn = document.createElement("button");
        btn.textContent = "Call";
        btn.onclick = () => handleLiftCall(i);

        floor.appendChild(label);
        floor.appendChild(btn);
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
            doorsOpen: false,
            queue: []
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



function handleLiftCall(floorNumber) {
   
    const lift = getNearestFreeLift(floorNumber);

    if(!lift) {
        alert("All lifts are busy");
        return;
    }

    if (!lift.queue.includes(floorNumber)) {
        lift.queue.push(floorNumber);
    }

    if (!lift.busy) {
        processLiftQueue(lift);
    }
}



function moveLiftWithDoors(lift, targetFloor) {
    lift.busy = true;
    const liftDiv = document.getElementById(`lift-${lift.id}`);

    const floorsToMove = Math.abs(targetFloor - lift.currentFloor);
    const travelTime = floorsToMove * 2;
    liftDiv.style.transition = `bottom ${travelTime}s linear`;
    liftDiv.style.bottom =  `${targetFloor * FLOOR_HEIGHT - FLOOR_BORDER}px`;
    
    
    setTimeout(() => {
        lift.currentFloor = targetFloor;

        
        openDoors(lift);

        
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
        return;
    }


    const nextFloor = lift.queue.shift();
    moveLiftWithDoors(lift, nextFloor);
}
function getNearestFreeLift(floorNumber) {
    let nearestLift = null;
    let minDistance = Infinity;

    for (const lift of state.liftList) {
        if (lift.busy) continue;

        const distance = Math.abs(lift.currentFloor - floorNumber);

        if (distance < minDistance) {
            minDistance = distance;
            nearestLift = lift;
        }
    }

    return nearestLift;
}
