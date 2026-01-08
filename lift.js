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

    if (floors <= 0 || lifts <= 0 || floors === 1) {
    alert("Invalid input: Simulation needs more than 1 floor or lift");
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
    lift.busy = true;
    lift.direction =
    request.floor > lift.currentFloor ? "up" : "down";

    const liftDiv = document.getElementById(`lift-${lift.id}`);

    const floorsToMove = Math.abs(targetFloor - lift.currentFloor);
    const travelTime = floorsToMove * 2;
    liftDiv.style.transition = `bottom ${travelTime}s linear`;
    const visualFloor = targetFloor - startFloor;
    const CENTER_OFFSET = (FLOOR_HEIGHT - LIFT_HEIGHT) / 2;
    liftDiv.style.bottom = `${visualFloor * FLOOR_HEIGHT + CENTER_OFFSET - FLOOR_BORDER}px`;



    if (request.floor > lift.currentFloor) lift.direction = "up";
    else if (request.floor < lift.currentFloor) lift.direction = "down";
    else lift.direction = null;

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

     lift.queue.sort((a, b) => {
       const dirA =
        a.floor === lift.currentFloor ? null :
        a.floor > lift.currentFloor ? "up" : "down";

       const dirB =
        b.floor === lift.currentFloor ? null :
        b.floor > lift.currentFloor ? "up" : "down";


        if (dirA === lift.direction && dirB !== lift.direction) return -1;
        if (dirA !== lift.direction && dirB === lift.direction) return 1;

        return Math.abs(a.floor - lift.currentFloor)
             - Math.abs(b.floor - lift.currentFloor);
    });

     const nextFloor = lift.queue.shift();    
     moveLiftWithDoors(lift, nextFloor);
}
function getBestLift(floorNumber) {
    let bestLift = null;
    let bestScore = Infinity;

    for (const lift of state.liftList) {
        const distance = Math.abs(lift.currentFloor - floorNumber);
        const queuePenalty = lift.queue.length * 2;

        const score = distance + queuePenalty;

        if (score < bestScore) {
            bestScore = score;
            bestLift = lift;
        }
    }

    return bestLift;
}