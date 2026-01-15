const TIME_PER_FLOOR_MS = 2000;
const TIME_OPEN_DOOR_MS = 2500;
const TIME_CLOSE_DOOR_MS = 2500;
const TIME_WAIT_MS = 1000;

let FLOOR_HEIGHT = 100;

let lifts = [];
let floorCount = 0;

function formatFloor(f) {
  return f === 0 ? 'G' : f.toString();
}

function isButtonActive(floor, dir) {
  const btn = document.getElementById(`btn-${dir}-${floor}`);
  return btn ? btn.classList.contains('active') : false;
}

class Lift {
  constructor(id) {
    this.id = id;
    this.currentFloor = 0;
    this.stops = new Set();
    this.isBusy = false;
    this.element = null;
    this.statusElement = null;
    this.direction = null;
    this.nextStop = null;
  }

  setElement(el) {
    this.element = el;
    this.statusElement = el.querySelector('.lift-status-box');
    this.updateVisualPosition(0);
  }

  addStop(floor) {
    this.stops.add(floor);
    this.process();
  }

  updateVisualPosition(durationMs) {
    if (this.element) {
      this.element.style.transition = `bottom ${durationMs}ms linear`;
      this.element.style.bottom = `${(this.currentFloor * FLOOR_HEIGHT) + 5}px`;
    }
  }

  updateStatusDisplay(htmlContent) {
    if (this.statusElement) {
      this.statusElement.innerHTML = htmlContent;
    }
  }

  checkShouldStop() {
    if (!this.stops.has(this.currentFloor)) return false;

    if (this.direction === null) return true;

    if (this.direction === 'UP') {
      const upActive = isButtonActive(this.currentFloor, 'UP');
      if (upActive) return true;

      const hasHigherStops = Array.from(this.stops).some(f => f > this.currentFloor);
      if (hasHigherStops) {
        return false;
      }

      return true;
    }

    if (this.direction === 'DOWN') {
      const downActive = isButtonActive(this.currentFloor, 'DOWN');
      if (downActive) return true;

      const hasLowerStops = Array.from(this.stops).some(f => f < this.currentFloor);
      if (hasLowerStops) {
        return false;
      }

      return true;
    }

    return true;
  }

  async process() {
    if (this.isBusy) return;

    if (this.checkShouldStop()) {
      await this.handleDoorSequence();
      this.process();
      return;
    }

    if (this.stops.size === 0) {
      this.direction = null;
      this.nextStop = null;
      if (this.element) {
        this.element.classList.remove('moving');
      }
      this.updateStatusDisplay('<span>--</span>');
      return;
    }

    let targetFloor = null;
    const requestedFloors = Array.from(this.stops).sort((a, b) => a - b);

    if (this.direction === 'UP') {
      const above = requestedFloors.find(f => f > this.currentFloor);
      if (above !== undefined) {
        targetFloor = above;
      } else {
        this.direction = 'DOWN';
        const below = requestedFloors.filter(f => f < this.currentFloor);
        if (below.length > 0) targetFloor = below[below.length - 1];
      }
    } else if (this.direction === 'DOWN') {
      const below = requestedFloors.filter(f => f < this.currentFloor).sort((a, b) => b - a);
      if (below.length > 0) {
        targetFloor = below[0];
      } else {
        this.direction = 'UP';
        const above = requestedFloors.filter(f => f > this.currentFloor);
        if (above.length > 0) targetFloor = above[0];
      }
    } else {
      const sortedByDist = requestedFloors.sort((a, b) => Math.abs(a - this.currentFloor) - Math.abs(b - this.currentFloor));
      targetFloor = sortedByDist[0];
      this.direction = targetFloor > this.currentFloor ? 'UP' : 'DOWN';
    }

    if (targetFloor !== null && targetFloor !== undefined && targetFloor !== this.currentFloor) {
      this.nextStop = targetFloor;
      await this.moveOneStep();
    } else if (targetFloor === this.currentFloor) {
      await this.handleDoorSequence();
      this.process();
    }
  }

  async moveOneStep() {
    this.isBusy = true;
    if (this.element) {
      this.element.classList.add('moving');

      const arrow = this.direction === 'UP' ? '▲' : '▼';
      const nextStopDisplay = this.nextStop !== null ? formatFloor(this.nextStop) : '--';
      this.updateStatusDisplay(`
        <span style="font-size: 1.1em; margin-right: 4px;">${arrow}</span>
        <span style="font-size: 1.1em;">${nextStopDisplay}</span>
      `);
    }

    if (this.direction === 'UP') this.currentFloor++;
    else if (this.direction === 'DOWN') this.currentFloor--;

    this.updateVisualPosition(TIME_PER_FLOOR_MS);
    await new Promise(r => setTimeout(r, TIME_PER_FLOOR_MS));

    this.isBusy = false;
    this.process();
  }

  async handleDoorSequence() {
    this.isBusy = true;

    const floor = this.currentFloor;
    const currentDir = this.direction;

    const upActive = isButtonActive(floor, 'UP');
    const downActive = isButtonActive(floor, 'DOWN');

    let servicedUp = false;
    let servicedDown = false;

    if (currentDir === 'UP') {
      if (upActive) servicedUp = true;

      const hasHigherStops = Array.from(this.stops).some(f => f > floor);
      if (!hasHigherStops) {
        if (downActive) servicedDown = true;
      }
    } else if (currentDir === 'DOWN') {
      if (downActive) servicedDown = true;

      const hasLowerStops = Array.from(this.stops).some(f => f < floor);
      if (!hasLowerStops) {
        if (upActive) servicedUp = true;
      }
    } else {
      const remainingStops = Array.from(this.stops).filter(f => f !== floor);
      
      if (remainingStops.length > 0) {
        const hasHigher = remainingStops.some(f => f > floor);
        const hasLower = remainingStops.some(f => f < floor);
        
        if (hasHigher && !hasLower) {
          if (upActive) servicedUp = true;
        } else if (hasLower && !hasHigher) {
          if (downActive) servicedDown = true;
        } else if (hasHigher && hasLower) {
          const nextTarget = remainingStops.sort((a, b) => Math.abs(a - floor) - Math.abs(b - floor))[0];
          if (nextTarget > floor && upActive) {
            servicedUp = true;
          } else if (nextTarget < floor && downActive) {
            servicedDown = true;
          }
        }
      } else {
        if (upActive && !downActive) servicedUp = true;
        else if (downActive && !upActive) servicedDown = true;
        else if (upActive && downActive) {
          servicedUp = true;
        }
      }
    }

    if (servicedUp) updateButtonState(floor, 'UP', false);
    if (servicedDown) updateButtonState(floor, 'DOWN', false);

    this.stops.delete(this.currentFloor);

    if (upActive && !servicedUp) assignLift(floor, 'UP');
    if (downActive && !servicedDown) assignLift(floor, 'DOWN');

    if (this.element) {
      this.element.classList.remove('moving');
      this.element.classList.add('doors-open');
      this.updateStatusDisplay(`<span style="font-size: 1.2em;">${formatFloor(this.currentFloor)}</span>`);
    }

    await new Promise(r => setTimeout(r, TIME_OPEN_DOOR_MS));
    await new Promise(r => setTimeout(r, TIME_WAIT_MS));

    if (this.element) {
      this.element.classList.remove('doors-open');
    }

    await new Promise(r => setTimeout(r, TIME_CLOSE_DOOR_MS));

    this.isBusy = false;
  }
}

const numFloorsInput = document.getElementById('numFloors');
const numLiftsInput = document.getElementById('numLifts');
const generateBtn = document.getElementById('generateBtn');
const errorMessage = document.getElementById('error-message');
const simRoot = document.getElementById('simulation-root');
const simContainer = document.getElementById('simulation-container');

function updateFloorHeight() {
  if (window.innerWidth < 480) {
    FLOOR_HEIGHT = 70;
  } else if (window.innerWidth < 768) {
    FLOOR_HEIGHT = 80;
  } else {
    FLOOR_HEIGHT = 100;
  }

  const allFloors = document.querySelectorAll('.floor');
  allFloors.forEach(floor => {
    floor.style.height = `${FLOOR_HEIGHT}px`;
  });

  const allFloorLines = document.querySelectorAll('.floor-line');
  allFloorLines.forEach((line, index) => {
    const floorIndex = Math.floor(index / lifts.length);
    line.style.bottom = `${floorIndex * FLOOR_HEIGHT}px`;
    line.style.height = `${FLOOR_HEIGHT}px`;
  });

  const shaftsContainer = document.querySelector('.shafts-container');
  if (shaftsContainer && floorCount > 0) {
    shaftsContainer.style.height = `${floorCount * FLOOR_HEIGHT}px`;
  }

  lifts.forEach(lift => lift.updateVisualPosition(0));
}

window.addEventListener('resize', updateFloorHeight);

generateBtn.addEventListener('click', () => {
  const f = parseInt(numFloorsInput.value);
  const l = parseInt(numLiftsInput.value);

  let errorText = "";
  if (isNaN(f) || f < 2) {
    errorText = "Number of floors must be at least 2.";
  } else if (f > 20) {
    errorText = "Number of floors must not exceed 20.";
  } else if (isNaN(l) || l < 1) {
    errorText = "Number of lifts must be at least 1.";
  } else if (l > 10) {
    errorText = "Number of lifts must not exceed 10.";
  }

  if (errorText) {
    errorMessage.textContent = errorText;
    errorMessage.classList.remove('hidden');
    return;
  }

  errorMessage.classList.add('hidden');
  initSimulation(f, l);
});

function updateButtonState(floor, dir, isActive) {
  const btn = document.getElementById(`btn-${dir}-${floor}`);
  if (btn) {
    if (isActive) btn.classList.add('active');
    else btn.classList.remove('active');
  }
}

function initSimulation(floors, liftCount) {
  simContainer.innerHTML = '';
  lifts = [];
  floorCount = floors;
  simRoot.classList.remove('hidden');

  updateFloorHeight();

  const floorsCol = document.createElement('div');
  floorsCol.className = 'floors-column';

  for (let i = 0; i < floors; i++) {
    const floorDiv = document.createElement('div');
    floorDiv.className = 'floor';
    floorDiv.style.height = `${FLOOR_HEIGHT}px`;

    let buttonsHtml = '';
    const upBtn = `<button id="btn-UP-${i}" class="direction-btn" onclick="window.callLift(${i}, 'UP')">▲</button>`;
    const downBtn = `<button id="btn-DOWN-${i}" class="direction-btn" onclick="window.callLift(${i}, 'DOWN')">▼</button>`;

    if (i === 0) {
      buttonsHtml = upBtn;
    } else if (i === floors - 1) {
      buttonsHtml = downBtn;
    } else {
      buttonsHtml = upBtn + downBtn;
    }

    floorDiv.innerHTML = `
      <span class="floor-label">${formatFloor(i)}</span>
      <div class="controls">
        ${buttonsHtml}
      </div>
    `;
    floorsCol.appendChild(floorDiv);
  }
  simContainer.appendChild(floorsCol);

  const shaftsContainer = document.createElement('div');
  shaftsContainer.className = 'shafts-container';
  shaftsContainer.style.height = `${floors * FLOOR_HEIGHT}px`;

  for (let i = 0; i < liftCount; i++) {
    const shaft = document.createElement('div');
    shaft.className = 'shaft';

    for (let f = 0; f < floors; f++) {
      const floorLine = document.createElement('div');
      floorLine.className = 'floor-line';
      floorLine.style.bottom = `${f * FLOOR_HEIGHT}px`;
      floorLine.style.height = `${FLOOR_HEIGHT}px`;
      shaft.appendChild(floorLine);
    }

    const liftEl = document.createElement('div');
    liftEl.className = 'lift';
    liftEl.id = `lift-${i}`;

    liftEl.innerHTML = `
        <div class="lift-status-box"><span>--</span></div>
        <div class="door left"></div>
        <div class="door right"></div>
    `;

    shaft.appendChild(liftEl);
    shaftsContainer.appendChild(shaft);

    const liftObj = new Lift(i);
    liftObj.setElement(liftEl);
    lifts.push(liftObj);
  }

  simContainer.appendChild(shaftsContainer);
}

window.callLift = (floorIndex, direction) => {
  const btn = document.getElementById(`btn-${direction}-${floorIndex}`);
  if (btn && btn.classList.contains('active')) return;

  updateButtonState(floorIndex, direction, true);
  assignLift(floorIndex, direction);
};

function assignLift(floor, direction) {
  let bestLift = null;
  let minCost = Infinity;

  for (const lift of lifts) {
    let cost = Infinity;
    const dist = Math.abs(lift.currentFloor - floor);

    if (lift.direction === null) {
      cost = dist;
    } else if (lift.direction === direction) {
      if (direction === 'UP') {
        if (lift.currentFloor <= floor) {
          cost = dist;
        } else {
          cost = dist + (floorCount * 2);
        }
      } else {
        if (lift.currentFloor >= floor) {
          cost = dist;
        } else {
          cost = dist + (floorCount * 2);
        }
      }
    } else {
      cost = dist + floorCount;
    }

    if (cost < Infinity) {
      cost += (lift.stops.size * 0.5);
    }

    if (cost < minCost) {
      minCost = cost;
      bestLift = lift;
    }
  }

  if (!bestLift) {
    bestLift = lifts.sort((a, b) => Math.abs(a.currentFloor - floor) - Math.abs(b.currentFloor - floor))[0];
  }

  if (bestLift) {
    bestLift.addStop(floor);
  }
}
