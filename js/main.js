
let gamePaused = false;

let button = document.getElementById("pauseButton");
button.addEventListener("click",pauseToggle);

const canvas = document.getElementById("snakeSpace");
const canvasxSize = canvas.clientWidth;
const canvasySize = canvas.clientHeight;

let xFields = 22;
let yFields = 22;

let canvCont = canvas.getContext("2d");

let squareSize = (canvasxSize > canvasySize) ? canvasxSize / xFields : canvasySize / yFields;

function pauseToggle(){
    gamePaused = !gamePaused;
}

// up = 0
// right = 1
// down = 2
// left 3
class Facing {
    constructor(directionString){
        if (directionString === "up"){
            this.direction = 0;
        }
        else if(directionString == "right"){
            this.direction = 1;
        }
        else if(directionString == "down"){
            this.direction = 2;
        }
        else{
            this.direction = 3;
        } 
    }
    facingUp(){
        return (this.direction === 0);
    }
    facingRight(){
        return (this.direction === 1);
    }  
    facingDown(){
        return (this.direction === 2);
    }
    facingLeft(){
        return (this.direction === 3);
    }
    turnRight(){
        this.direction = (this.direction + 1) % 4;
        return this.direction;
    }
    turnLeft(){
        if (this.direction == 0){
            this.direction = 3;
        }
        else{
            this.direction = this.direction - 1
        }
        return this.direction;
    }
    returnContent(){
        return this.direction;
    }
    directionString(){
        switch(this.direction){
            case 0:
                return "up";
            case 1:
                return "right";
            case 2:
                return "down";
            default:
                return "left";  
        }
    }
}

class Position{
    constructor(xPosition, yPosition){
        this.xPosition = xPosition;
        this.yPosition = yPosition;
    }
    getX(){
        return this.xPosition;
    }
    getY(){
        return this.yPosition;
    }

}


class Field extends Position{
    constructor(xIndex,yIndex,content,facing){
        super(xIndex, yIndex)//this.xIndex = xIndex;
        //this.yIndex = yIndex;
        this.content = content;
        this.direction = facing;// direction in that its going to be drawn / relative to the snake
    }
    getContent(){
        return this.content;
    }
    setContent(newContent){
        this.content = newContent;
    }
    getFacing(){
        return this.direction;
    }
    isFree(){
        return this.content === "0";
    }
}

class DrawnField extends Field{
    constructor(field,completedPercent){
        super(field.getX(), field.getY(), field.getContent(), field.getFacing());
        this.completedPercent = completedPercent;
    }
    getCompleted(){
        return this.completedPercent;
    }
    setCompleted(value){
        this.completedPercent = value;
    }
}


function onlyOneDifference(x , y){
    // smaller 
    if (x - 1 === y) {
        return -1;
    }
    // bigger 
    if (x + 1 === y){
        return 1;
    }
    return 0;
}

function relativePosition(position1,position2){ // return how the position 2 is relative to position 1 as a "Facing" object, has to watch out for border switches
    // TODO check only if its 1 smaller than the other position
    // field pos2 is on the left side, position2 is the new position to go to
    if ((onlyOneDifference(position2.getY(),position1.getY()) === 1) || (position2.getY() === (yFields - 1) && position1.getY() === 0)){ // went over bounds on bottom or y is smaller
        return (new Facing("down"));
    }
    else if ((onlyOneDifference(position2.getY(),position1.getY()) === -1) || ((position2.getY() === 0) && position1.getY() === (yFields - 1))){ // went over bounds on top or y is bigger
        return (new Facing("up"));
    }
    else if ((onlyOneDifference(position2.getX(),position1.getX()) === 1) || (position2.getX() === (xFields - 1) && position1.getX() === 0)){ // went over bounds on right side or x is bigger
        return (new Facing("right"));
    }
    else if ((onlyOneDifference(position2.getX(),position1.getX()) === -1) || ((position2.getX() === 0 && position1.getX() === (xFields - 1)))){ // went over bounds on left side or x is smaller
        return (new Facing("left"));
    }
    console.error("comparing same positions",position1, position2);
    return null;
}


class Snake{
    constructor(size, xHeadPosition, yHeadPosition, facingDirection, snakeTail, updateFields){
        this.size = size;
        this.xHeadPosition = xHeadPosition;
        this.yHeadPosition = yHeadPosition;
        this.facingDirection = facingDirection;
        this.snakeTail = snakeTail;
        this.updateFields = updateFields;
        for (let i = size - 1; i >= 0; i--){
            snakeTail.push(new Position(xHeadPosition + i, yHeadPosition)); // the highest Index has the head and lowest have the following tail pieces 
            this.updateFields.push(new Field(xHeadPosition + i, yHeadPosition, "1",facingDirection));
        }
        this.updateFields[this.updateFields.length - 1].content = "2";
    }

    clearSnakeUpdate(){
        let curSnakeUpate = this.updateFields;
        this.updateFields = [];
        return curSnakeUpate;
    }

    // findFreeTile(){
    //     // let tailPosition = snakeTail[0];
    //     // let tailFacing = relativePosition()
    //     // for (let i = 0; i < 4; i++){ //check in every direction
    //     //     let freeField = nextPosition(new Field(tailPosition.getX(), tailPosition.getY(),"0",this.tailFacing ); // grow in the position where the tail is facing
    //     //     if ()
    //     // }
    //     // return null;
    //    
    // }

    // increase the snake Size upon moving one tile forward, has to be called before the snake gets drawn and after moving
    increaseSnakeSize(){
        // find the tail that will be emptied
        this.size = this.size + 1;
        for (let i = 0; i < this.updateFields.length; i++){
            if (this.updateFields[i].getContent() === "0"){
                this.updateFields[i].setContent("1");
                let newTailPosition = new Position(this.updateFields[i].getX(), this.updateFields[i].getY());
                this.snakeTail.unshift(newTailPosition);
                return true;
            }
        }
        // remove the update Fields call from the Snake and re add to the snake tail
        return false;
    }

    getSnakeTail(){
        return this.snakeTail;
    }

    willCollide(snakeField){
        let nextPosition = this.nextPosition(new Field(this.xHeadPosition,this.yHeadPosition,"2",this.facingDirection)); // xPos
        if (snakeField[nextPosition.getX() + nextPosition.getY() * xFields].content === "0"){
            return false;
        }
        return true;
    }

    // up = 0
    // right = 1
    // down = 2
    // left 3

    nextPosition(field){
        let facingDirection = field.getFacing();
        if (facingDirection.facingUp()) {
            // inside bounds
            if(this.yHeadPosition - 1 >= 0){
                return new Position(this.xHeadPosition, this.yHeadPosition - 1);
            }
            else{ // Out of bounds
                return new Position(this.xHeadPosition, yFields - 1);
            }
        }
        else if (facingDirection.facingDown()) {
            // add to new head Position 
            if(this.yHeadPosition + 1 > yFields - 1){ // out of bounds
                return new Position(this.xHeadPosition, 0);
            }
            else{
                return new Position(this.xHeadPosition, this.yHeadPosition + 1);
            }
        }
        else if (facingDirection.facingRight()) {
            if(this.xHeadPosition + 1 > xFields - 1){ // out of bounds
                return new Position(0, this.yHeadPosition);
            }
            else{ 
                return new Position(this.xHeadPosition + 1, this.yHeadPosition);
            }
        }
        else { // this.facingDirection === "left"{
            // add new head Position 
            if(this.xHeadPosition - 1 >= 0){
                return new Position(this.xHeadPosition - 1, this.yHeadPosition);
            }
            else{ // Out of bounds
                return new Position(xFields - 1, this.yHeadPosition);
            }
         }
    }

    turnRight(){
        this.facingDirection.turnRight();
    }

    turnLeft(){
        this.facingDirection.turnLeft();
    }

    moveforward()
    {
        let oldTail = null;
        // check for apple
        if (this.snakeTail.length > 0){
            oldTail = this.snakeTail.shift();
        }
        let nextPosition = this.nextPosition(new Field(this.xHeadPosition,this.yHeadPosition,"2",this.facingDirection));
        // let headFacing = nextPosition[1];
        this.snakeTail.push(nextPosition); // add the new head to the last Element of the snake
        // update the updateField
        if (this.size > 1) {
            let elementAfterHead = new Position(this.snakeTail[this.snakeTail.length - 2].getX(), this.snakeTail[this.snakeTail.length - 2].getY());
            let facing = relativePosition(new Position(this.snakeTail[this.snakeTail.length - 1].getX(), this.snakeTail[this.snakeTail.length - 1].getY()),elementAfterHead);
            // console.log("second Snake Tile");
            // console.log(facing);
            this.updateFields.push(new Field(this.xHeadPosition, this.yHeadPosition,"1",facing)); // set the old head position to 1 if the snake is longer than 1 -> has a tail
        }
        let facing = relativePosition(new Position(this.snakeTail[0].getX(), this.snakeTail[0].getY()),new Position(oldTail.getX(), oldTail.getY())); // the direction the tail is facing has to be removed in this direction
        // console.log("disappearing tail Snake Tile");
        // console.log(facing);
        this.updateFields.push(new Field(oldTail.getX(), oldTail.getY(), "0",facing)); // set the removed tail position to 0
        //snakeField[this.snakeTail.length - 1].content = "2"; // set the head position to "2"

        // update the head Position and add to update Fields
        facing = relativePosition(new Position(this.snakeTail[this.snakeTail.length - 1].getX(),this.snakeTail[this.snakeTail.length - 1].getY()),new Position(this.xHeadPosition, this.yHeadPosition));
        // console.log("head");
        // console.log(facing);
        this.xHeadPosition = this.snakeTail[this.snakeTail.length - 1].getX();
        this.yHeadPosition = this.snakeTail[this.snakeTail.length - 1].getY();

        this.updateFields.push(new Field(this.xHeadPosition, this.yHeadPosition, "2", facing)); // fix facing
        // return the new Head Position
        return new Position(this.xHeadPosition, this.yHeadPosition);
    }

}

function linearInterpolation(currentValue,stepSize,goalValue){
    if (currentValue >= goalValue){
        return goalValue;
    }
    return (currentValue + stepSize);
}

function interpolateField(drawnField,stepSize,interpolationFunc){
    let resultField = drawnField;
    resultField.setCompleted(interpolationFunc(drawnField.getCompleted(),stepSize,1));
    return resultField;
}

currentAnimatedFields = [];
function animateFields(fieldInterPolationFunc,animationStep,animate){
    for (let i = 0; i < currentAnimatedFields.length; i++){
        let widthToDraw = squareSize;
        let heightToDraw = squareSize;
        let curAnimationProgress = currentAnimatedFields[i].getCompleted();
        let drawnField = currentAnimatedFields[i];
        curxPos = drawnField.getX() * (squareSize);
        curyPos = drawnField.getY() * (squareSize);
        let editedxPos = curxPos; //* 0.5;
        let editedyPos = curyPos; // * 0.5;
        canvCont.beginPath();
        if (drawnField.getContent() === "1"){ // case tail
            canvCont.fillStyle = "red";    
        }
        else if(drawnField.getContent() === "0"){ // case empty
            canvCont.fillStyle = "white";    
        }
        else if(drawnField.getContent() === "2"){ // case head
            canvCont.fillStyle = "black";    
        }
        if (drawnField.getFacing().facingUp()){ // TODO FIX
            // set upper left corner, so that y coord is at current Progress
            // set height of the rectangle to the current Progress
            editedyPos = editedyPos + (squareSize * (1 - curAnimationProgress));
            heightToDraw = squareSize * curAnimationProgress;
        }
        else if (drawnField.getFacing().facingDown()){
            // leave the upper left coroner and only
            // set height to current progress
            editedyPos = curyPos;
            heightToDraw = squareSize * curAnimationProgress;
        }
        else if (drawnField.getFacing().facingRight()){
            // draw only to percent width but leave to upper corner
            widthToDraw = squareSize * curAnimationProgress;
        }
        else {// facing left
            // set the draw width to draw to the 
            widthToDraw = squareSize * curAnimationProgress;
            editedxPos = editedxPos + (squareSize * (1 - curAnimationProgress));
        }
        currentAnimatedFields[i] = fieldInterPolationFunc(drawnField, animationStep, linearInterpolation);

        if (!animate){
            widthToDraw = squareSize;
            heightToDraw = squareSize;
            editedxPos = curxPos;
            editedyPos = curyPos;
        }
        
        canvCont.fillRect(editedxPos,editedyPos,widthToDraw,heightToDraw);
        canvCont.stroke();
        // always redraw the border
        canvCont.beginPath();
        canvCont.rect(curxPos,curyPos,squareSize,squareSize);
        canvCont.stroke();
    }
}

// first idea for interpolation -> seperate box in smaller boxed draw from the facing side in percent (Math.min((elapsedTime/fixedTimeStep),1)
// safe for every field how far it has been drawn on every animation update continue to draw this fields until completed/ time runs out
function updateSnake(snakeField, snake){
    // draw the first Snake
    let snakeUpdate = snake.clearSnakeUpdate();
    for (let i = 0; i < snakeUpdate.length; i++){
        let field = snakeUpdate[i];
        // update the safed Snake Field
        snakeField[field.getX() + field.getY() * xFields].content = field.getContent(); 
        // redraw the Snake Canvas
        // curxPos = field.getX() * squareSize;
        // curyPos = field.getY() * squareSize;
        let animatedField = new DrawnField(field,0);
        currentAnimatedFields.push(animatedField);
        //interpolatedSnakeDrawing(new DrawnField(field, 0));
    }
}

let freeFields = xFields*yFields; // TODO FIX
function spawnApple(xPosition, yPosition){
    let applexPosition = xPosition;
    let appleyPosition = yPosition;
    if (xPosition == null && yPosition == null){
        applexPosition = Math.round(Math.random() * (xFields - 1));
        appleyPosition = Math.round(Math.random() * (yFields - 1));
    }
    if (freeFields > 0){
        snakeField[applexPosition + appleyPosition * xFields].setContent("apple");
    }
}


// DFS to find a valid way 
function shortestWayToPosition(field, startPosition, goalPosition){
    let currentWay = [];
    return;
}

// (i,j) mit i = 3, j=2
// (0,0) (1,0) (2,0)
// (0,1) (1,1) (2,1)
// -> 0 1 2 3 4 5

function drawCanvas(snakeField, snake) {
    let curxPos = 0;
    let curyPos = 0;

    for (let i = 0; i < xFields; i++){
        for (let j = 0; j < yFields; j++){
            if (snakeField[i + j * xFields].content === "0"){
                canvCont.beginPath();
                curxPos = (i) * squareSize;
                curyPos = (j) * squareSize;
                canvCont.rect(curxPos,curyPos,squareSize,squareSize);
                // if ((i + j * xFields) % 2 == 1){
                //     canvCont.fillStyle = "black";
                // }
                // else {
                //     canvCont.fillStyle = "red";
                // }
                canvCont.stroke();
            }
        }
    }
    updateSnake(snakeField, snake);
    animateFields(interpolateField, 1, false);
}

let fps = 60;
let fpsThreshold = 0;
let last = performance.now() / 1000;
const fixedTimeStep = 300 * 0.001; // half a second for a Time Step of the Snake/ the forward moving
let elapsedTime = 0; // time in seconds
const animationStep = 0.05; // if this is too small the game cant keep up with the fps // TODO make fps dependend on the animationStep? what if the fps wouldnt get met


let mySnake = new Snake(10, 0, 0, new Facing("up"), [], []);

let snakeField = [];
for (let i = 0; i < xFields; i++){
    for (let j = 0; j < yFields; j++){
        snakeField[i + j * xFields] =  new Field(i, j, "0",null);//emptyField;
    }
}


drawCanvas(snakeField,mySnake);
console.log(mySnake.size)
spawnApple(0,yFields-1);
console.log(mySnake.size)

function run(){
    window.requestAnimationFrame(run);
    if (gamePaused){
        animateFields(interpolateField, animationStep, false); // finish the drawing of the snake insantly
        return;
    }
    let now = performance.now() / 1000;
    let dt = Math.min(now - last, 1);
    elapsedTime = elapsedTime + (now - last);
    last = now;
    if (fps > 0) {
        fpsThreshold += dt;
        if (fpsThreshold < 1.0 / fps) { // if under the over the fps threshhold abort
            return;
        }
        fpsThreshold -= 1.0 / fps;
        if ((elapsedTime) > fixedTimeStep){
            elapsedTime = 0;
            let headPosition = mySnake.moveforward();
            console.log(headPosition);
            if(snakeField[headPosition.getX() + headPosition.getY() * xFields].getContent() === "apple"){
                snakeField[headPosition.getX() + headPosition.getY() * xFields].setContent("0");
                mySnake.increaseSnakeSize();
            }
            animateFields(interpolateField,animationStep,false); // finish the Snake if the it didnt get completed during the animation
            currentAnimatedFields = [];
        }
        updateSnake(snakeField, mySnake);
        // only call the animation every step size of the animation to prevent a stuttering snake
        // if (elapsedTime * animationStep >= animationTimeElapsed) { // one animationStep length of time has elapsed
        //     animationTimeElapsed = 0;
        animateFields(interpolateField,animationStep,true);
        // }
    }
}



window.onload = function() {
    window.requestAnimationFrame(run);
    };  

// Program Idee 
// erstelle ein Feld auf dem die Schlange sich befinden kann
// drawCall der das Feld zeichnet

// benötigte Daten
// Array das die Felder im Blick behält
// Schlange die Informationen, Länge, geschwindigkeit,facing enthält
// fixed Speed?

// neuste Ideen Zeichen Geschwindigkeit unabhängig von FPS machen
// Tiefensuche für späteres automatisches bewegen zum Mauscursor hmm wie das implementieren?
// Animation des vorwärtsbewegens -> animations Kette 
// anhalten der Schlange mit Knopf