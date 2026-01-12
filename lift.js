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
    liftList: [],
    pendingRequests: []
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
            upQueue: [],
            downQueue: []
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
  const direction =
    floorNumber === 0 ? "up" :
    floorNumber === state.floors - 1 ? "down" :
    buttonElement.classList.contains("up") ? "up" : "down";

  buttonElement.classList.add("active");

  state.pendingRequests.push({
    floor: floorNumber,
    direction,
    button: buttonElement
  });

  assignPendingRequests();
}
function assignPendingRequests() {
  for (let i = 0; i < state.pendingRequests.length; i++) {
    const req = state.pendingRequests[i];
    const lift = getBestEligibleLift(req);

    if (!lift) continue;

    addRequestToLift(lift, req);
    state.pendingRequests.splice(i, 1);
    i--;
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
                assignPendingRequests();

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
    if (
     lift.upQueue.length === 0 &&
     lift.downQueue.length === 0
    ) {
  lift.busy = false;
  lift.direction = null;
  assignPendingRequests();

  return;
}

  if (!lift.busy) {
    if (lift.upQueue.length > 0) {
      lift.direction = "up";
      lift.busy = true;
    } else if (lift.downQueue.length > 0) {
      lift.direction = "down";
      lift.busy = true;
    } else {
      return;
    }
  }

  const queue =
    lift.direction === "up" ? lift.upQueue : lift.downQueue;

  if (queue.length === 0) {
    lift.busy = false;
    lift.direction = null;
    assignPendingRequests();
    return;
  }

  const nextStop = queue.shift();
  moveLiftWithDoors(lift, nextStop);
}  

function addRequestToLift(lift, req) {
  if (req.floor > lift.currentFloor) {
    lift.upQueue.push(req);
    lift.upQueue.sort((a, b) => a.floor - b.floor);
  } else if (req.floor < lift.currentFloor) {
    lift.downQueue.push(req);
    lift.downQueue.sort((a, b) => b.floor - a.floor);
  } else {
    openDoors(lift);
    setTimeout(() => closeDoors(lift), 2500);
    req.button.classList.remove("active");
    return;
  }

  if (!lift.busy) {
    processLiftQueue(lift);
  }
}


function getBestEligibleLift(req) {
  let bestLift = null;
  let bestDistance = Infinity;

  for (const lift of state.liftList) {
    if (!isEligible(lift, req)) continue;

    const dist = Math.abs(lift.currentFloor - req.floor);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestLift = lift;
    }
  }

  return bestLift;
}
function isEligible(lift, req) {
  if (!lift.busy) return true;

  if (
    lift.direction === req.direction &&
    (
      (lift.direction === "up" && req.floor >= lift.currentFloor) ||
      (lift.direction === "down" && req.floor <= lift.currentFloor)
    )
  ) {
    return true;
  }

  return false;
}
