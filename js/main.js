
let gamePaused = false;

let button = document.getElementById("pauseButton");
button.addEventListener("click",pauseToggle);

const canvas = document.getElementById("snakeSpace");
const canvasxSize = canvas.clientWidth;
const canvasySize = canvas.clientHeight;
const ratio = (canvas.clientHeight > canvas.clientWidth) ? canvas.clientWidth / canvas.clientHeight : canvas.clientHeight / canvas.clientWidth;


// function euclideanGCD(a,b){
//     if (b == 0){
//         return a;
//     }
//     return euclideanGCD(b, a % b);
// }

// const greastestCommonDivisor = euclideanGCD(canvas.clientHeight, canvas.clientWidth);
// let xFields = canvas.clientWidth / greastestCommonDivisor;//10
// let yFields = canvas.clientHeight / greastestCommonDivisor;
const curFields = 25
const standardCount = Math.round(curFields * (ratio));
let xFields = 0;
let yFields = 0;
if (canvasxSize > canvasySize){
    xFields = curFields;//10
    yFields = standardCount;
}
else {
    xFields = standardCount;
    yFields = curFields;//10
}


let freeFields = xFields * yFields;

let canvCont = canvas.getContext("2d");

let squareSize = (canvasxSize-200) / (xFields);//(canvasxSize > canvasySize) ? canvasxSize / xFields : canvasySize / yFields; // why do i need this offset?
squareSize = Math.round(squareSize);

const appleImage = document.createElement("img");
appleImage.src = "img/apple.png";

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
        return this.content === "empty";
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
    constructor(size, xHeadPosition, yHeadPosition, facingDirection, snakeTail, updateFields,animated){
        this.size = size;
        this.xHeadPosition = xHeadPosition;
        this.yHeadPosition = yHeadPosition;
        this.facingDirection = facingDirection;
        this.snakeTail = snakeTail;
        this.updateFields = updateFields;
        this.gameOver = false;
        for (let i = size - 1; i >= 0; i--){
            snakeTail.push(new Position(xHeadPosition + i, yHeadPosition)); // the highest Index has the head and lowest have the following tail pieces 
            this.updateFields.push(new Field(xHeadPosition + i, yHeadPosition, "tail",facingDirection));        
            // update global free fields
            freeFields = freeFields-1
        }
        this.isAnimated = animated;
        this.updateFields[this.updateFields.length - 1].content = "head";
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
            if (this.updateFields[i].getContent() === "empty"){
                this.updateFields[i].setContent("tail");
                let newTailPosition = new Position(this.updateFields[i].getX(), this.updateFields[i].getY());
                this.snakeTail.unshift(newTailPosition);
                // update global free fields
                freeFields = freeFields-1
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
        let nextPosition = this.nextPosition(new Field(this.xHeadPosition,this.yHeadPosition,"head",this.facingDirection)); // xPos
        if (snakeField[nextPosition.getX() + nextPosition.getY() * xFields].content === "empty"){
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
        
            //if(this.yHeadPosition - 1 >= 0){
            if (field.getY() - 1 >= 0){
                //return new Position(this.xHeadPosition, this.yHeadPosition - 1);
                return new Position(field.getX(), field.getY() -1);
            }
            else{ // Out of bounds
                // return new Position(this.xHeadPosition, yFields - 1);
                return new Position(field.getX(),yFields-1);
            }
        }
        else if (facingDirection.facingDown()) {
            // add to new head Position 
            // if(this.yHeadPosition + 1 > yFields - 1){ // out of bounds
            if (field.getY() + 1 > yFields - 1){
                // return new Position(this.xHeadPosition, 0);
                return new Position(field.getX(), 0);
            }
            else{
                // return new Position(this.xHeadPosition, this.yHeadPosition + 1);
                return new Position(field.getX(), field.getY() + 1);
            }
        }
        else if (facingDirection.facingRight()) {
            //if(this.xHeadPosition + 1 > xFields - 1){ // out of bounds
            if(field.getX() + 1 > xFields - 1){
                // return new Position(0, this.yHeadPosition);
                return new Position(0,field.getY());
            }
            else{ 
                // return new Position(this.xHeadPosition + 1, this.yHeadPosition);
                return new Position(field.getX()+1, field.getY());
            }
        }
        else { // this.facingDirection === "left"{
            // add new head Position 
            // if(this.xHeadPosition - 1 >= 0){
            if(field.getX() - 1 >= 0){
                // return new Position(this.xHeadPosition - 1, this.yHeadPosition);
                return new Position(field.getX() - 1, field.getY());
            }
            else{ // Out of bounds
                return new Position(xFields -1 , field.getY());                
                // return new Position(xFields - 1, this.yHeadPosition);
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
        if (this.gameOver){
            return null;
        }
        let oldTail = null;
        // check for apple
        if (this.snakeTail.length > 0){
            oldTail = this.snakeTail.shift();
        }
        let nextPosition = this.nextPosition(new Field(this.xHeadPosition,this.yHeadPosition,"head",this.facingDirection));
        this.snakeTail.push(nextPosition); // add the new head to the last Element of the snake
        // update the updateField
        if (this.size > 1) {
            let elementAfterHead = new Position(this.snakeTail[this.snakeTail.length - 2].getX(), this.snakeTail[this.snakeTail.length - 2].getY());
            let facing = relativePosition(new Position(this.snakeTail[this.snakeTail.length - 1].getX(), this.snakeTail[this.snakeTail.length - 1].getY()),elementAfterHead);
            // console.log("second Snake Tile");
            // console.log(facing);
            this.updateFields.push(new Field(this.xHeadPosition, this.yHeadPosition,"tail",facing)); // set the old head position to 1 if the snake is longer than 1 -> has a tail
        }
        let facing = relativePosition(new Position(this.snakeTail[0].getX(), this.snakeTail[0].getY()),new Position(oldTail.getX(), oldTail.getY())); // the direction the tail is facing has to be removed in this direction
        // console.log("disappearing tail Snake Tile");
        // console.log(facing);
        this.updateFields.push(new Field(oldTail.getX(), oldTail.getY(), "empty",facing)); // set the removed tail position to 0
        //snakeField[this.snakeTail.length - 1].content = "2"; // set the head position to "2"

        // update the head Position and add to update Fields
        facing = relativePosition(new Position(this.snakeTail[this.snakeTail.length - 1].getX(),this.snakeTail[this.snakeTail.length - 1].getY()),new Position(this.xHeadPosition, this.yHeadPosition));
        // console.log("head");
        // console.log(facing);
        this.xHeadPosition = this.snakeTail[this.snakeTail.length - 1].getX();
        this.yHeadPosition = this.snakeTail[this.snakeTail.length - 1].getY();

        this.updateFields.push(new Field(this.xHeadPosition, this.yHeadPosition, "head", facing)); // fix facing
        // return the new Head Position
        return new Position(this.xHeadPosition, this.yHeadPosition);
    }

    setSnakeGameOverState(){
        // this.facingDirection = null;
        // this.xHeadPosition = -1;
        // this.yHeadPosition = -1;
        console.log(this.updateFields);
        let headPosition = this.updateFields.filter((curField) => (curField.getContent() == "head"))
                                            .map((headPosition) => new Position(headPosition.getX(), headPosition.getY()))[0];
        console.log(headPosition)
        this.updateFields = this.updateFields 
                                            .concat(
                                            this.snakeTail.map((curVal) => new Field(curVal.getX(), curVal.getY(), "empty", new Facing("up"))));
        if (headPosition != null){ // fix for getting called twice
            // filtering hit position
            console.log(this.updateFields);
            this.updateFields = this.updateFields.filter((curField) => !(curField.getX() === headPosition.getX() && curField.getY() === headPosition.getY())) // remove the collided head piece from the pieces to that have to be drawn
            console.log(this.updateFields);

        }
        this.snakeTail = [];
        this.gameOver = true;
    }

}

function constantInterpolation(currentValue, stepSize, goalValue){
    return goalValue;
}

function linearInterpolation(currentValue,stepSize,goalValue){
    let nextValue = currentValue + stepSize;
    if (nextValue >= goalValue){
        return goalValue;
    }
    return nextValue;
}

function quadraticInterpolation(currentValue, stepSize, goalValue){
    // stepSize * stepSize
    let currentStep = (Math.sqrt(currentValue));
    let nextValue = (currentStep+stepSize)*(currentStep+stepSize);
    if (nextValue >= goalValue){
        return goalValue;
    }
    return nextValue;
}

// x^2
// stepSize = 1
// 1 4 8 16
// 1^2, 2^2, 3^2, 4^2
// (1+1)^2 = 1^2 + 2*1*1+ 1^2
// (4)^2 = (2+2)^2 = 

function interpolateField(drawnField,stepSize,interpolationFunc){
    let resultField = drawnField;
    resultField.setCompleted(interpolationFunc(drawnField.getCompleted(),stepSize,1));
    return resultField;
}

function animateFields(fieldInterpolationFunc,animationStep,animate){
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
        if (drawnField.getContent() === "tail"){ // case tail
            canvCont.fillStyle = "red";    
        }
        else if(drawnField.getContent() === "empty"){ // case empty
            canvCont.fillStyle = "white";    
        }
        else if(drawnField.getContent() === "head"){ // case head
            canvCont.fillStyle = "black";    
        }
        else if (drawnField.getContent() === "apple"){
            // spawn apple and skip
            canvCont.drawImage(appleImage,curxPos,curyPos,squareSize,squareSize);
            continue;
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
        else if (drawnField.getFacing().facingLeft()) {// facing left
            // set the draw width to draw to the 
            widthToDraw = squareSize * curAnimationProgress;
            editedxPos = editedxPos + (squareSize * (1 - curAnimationProgress));
        }
        else{

        }
        currentAnimatedFields[i] = fieldInterpolationFunc(drawnField, animationStep, currentInterpolation);

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
function updateSnake(snakeField,snake){
    // draw the first Snake
    let snakeUpdate = snake.clearSnakeUpdate();
    for (let i = 0; i < snakeUpdate.length; i++){
        let field = snakeUpdate[i];
        // update the safed Snake Field
        snakeField[field.getX() + field.getY() * xFields].content = field.getContent(); 
        // redraw the Snake Canvas
        if (snake.isAnimated){
            let animatedField = new DrawnField(field,0);
            currentAnimatedFields.push(animatedField);
        }
    }
    return snakeField;
}

// check what snakes head collided after moving 
function checkCollisions(snakeField,snakes){
    // filtere die Schlangen nach kopfpositionen die auftreffen und entferne die dann aus dem Spiel
    // für entfernen aus dem Spiel, leere den Schwanz der Schlange
    let collidedSnakes = snakes.filter((curVal) => (!(snakeField[curVal.xHeadPosition + curVal.yHeadPosition * xFields].getContent() === "empty"))); // filter gibt elemete wieder die die Aussage erfüllen
    // TODO fix apple collision
    // findet alle felder die auf denen sich die Köpfe von Schlangen befinden, aber die nicht leer sind
    // für mehrere Schlangen muss
    // snakes.forEach((curVal) => (console.log(snakeField[curVal.xHeadPosition + curVal.yHeadPosition * xFields].getContent()))); // filter gibt elemete wieder die die Aussage erfüllen
    if (collidedSnakes.length > 0){
        console.log(collidedSnakes.length + " lost");
    }
    collidedSnakes.forEach((snake) => snake.setSnakeGameOverState());
    return;
}


// idea for spawning apples randomly on position without a snake -> set with every free field 
function spawnApple(xPosition, yPosition){
    if (freeFields > 0){
        let applexPosition = xPosition;
        let appleyPosition = yPosition;
        if (xPosition == null && yPosition == null){
            applexPosition = Math.round(Math.random() * (xFields - 1));
            appleyPosition = Math.round(Math.random() * (yFields - 1));
        }
        if (freeFields > 0){
            snakeField[applexPosition + appleyPosition * xFields].setContent("apple");
        }
        let field = new Field(applexPosition, appleyPosition, "apple", null);
        currentAnimatedFields.push(new DrawnField(field,1));
    }
}

function createFacing(i){
    switch(i){
        case 0 : return new Facing("up");
        case 1 : return new Facing("right");
        case 2 : return new Facing("down");
        default : return new Facing("left");
    }

}

// BFS to find a valid way 
function wayToPosition(snake, goalPosition){
    let copiedField = snakeField.slice();
    let copiedSnakeTail = snake.getSnakeTail().slice();
    let copiedUpdateFields = snake.updateFields.slice();
    let copiedFacing = new Facing(snake.facingDirection.directionString());
    let tempSnake = new Snake(snake.size,snake.xHeadPosition,snake.yHeadPosition,copiedFacing,copiedSnakeTail,copiedUpdateFields,false);
    let facings = [];
    let currentWay = [];
    let openWays = [];
    openWays.push(tempSnake.nextPosition(new Field(tempSnake.xHeadPosition,tempSnake.yHeadPosition,"2",copiedFacing))); // find the start Position
    let currentPosition = openWays.shift();
    while(!(currentPosition.getX() === goalPosition.getX() && currentPosition.getY() === goalPosition.getY())){
            for (let i = 0;i < 4;i++){
                let foundPosition = tempSnake.nextPosition(new Field(currentPosition.getX(),currentPosition.getY(),"1",createFacing(i)));
                if (copiedField[foundPosition.getX() + foundPosition.getY() * xFields].getContent() === "empty"){
                    openWays.push(foundPosition);
                    currentWay.push(foundPosition);

                    copiedField[foundPosition.getX() + foundPosition.getY() * xFields].setContent("head");
                }
            }
            currentPosition = openWays.shift();
            if (currentPosition == null){
                break;
            }
            // tempSnake.moveforward();
            // updateSnake(copiedField,tempSnake);
     //       currentWay.push(new Position(tempSnake.xHeadPosition,tempSnake.yHeadPosition));
    }
    // sort by x
    // currentWay.sort((x,y) => x.getX() - y.getX());
    // sort by y
    // currentWay.sort((x,y) => x.getY() - y.getY());

    console.log(currentWay);
    facings.push(relativePosition(new Position(currentWay[0].getX(),currentWay[0].getY()), new Position(snake.xHeadPosition, snake.yHeadPosition)));
    for (let i = 1; i < currentWay.length; i++){
        facings.push(relativePosition(new Position(currentWay[i].getX(),currentWay[i].getY()), new Position(currentWay[i-1].getX(), currentWay[i-1].getY())));
    }
    return facings;
}
// (i,j) mit i = 3, j=2
// (0,0) (1,0) (2,0)
// (0,1) (1,1) (2,1)
// -> 0 1 2 3 4 5

function debugCanvas(paintOver){
    let curxPos = 0;
    let curyPos = 0;
    for (let i = 0; i < xFields; i++){
        for (let j = 0; j < yFields; j++){
            curxPos = (i) * squareSize;
            curyPos = (j) * squareSize;
            if (paintOver){
                drawCanvas();
            }
            else {
                let fillString = String(i) + " " + String(j);
                canvCont.fillText(fillString,curxPos,curyPos + squareSize, squareSize * 5);
            }
        }
    }
}


function drawCanvas() {
    let curxPos = 0;
    let curyPos = 0;
    for (let i = 0; i < xFields; i++){
        for (let j = 0; j < yFields; j++){
            if (snakeField[i + j * xFields].content === "empty"){
                curxPos = (i) * squareSize;
                curyPos = (j) * squareSize;
                canvCont.fillStyle = "white";    
                canvCont.fillRect(curxPos, curyPos, squareSize,squareSize);
                canvCont.beginPath();
                canvCont.rect(curxPos,curyPos,squareSize,squareSize);
                canvCont.stroke();
            }
        }
    }
}

function run(){
    window.requestAnimationFrame(run);
    if (gamePaused){
        animateFields(interpolateField, animationStep, false); // finish drawing the animated Fields
        currentAnimatedFields = [];
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
            let headPositions = snakeArray.map((snake) => snake.moveforward());
            // let headPosition = mySnake.moveforward();
            //if (headPosition != null){
            for (let i = 0; i < headPositions.length; i++){
                checkCollisions(snakeField,snakeArray);
                if (headPositions[i] != null){
                    if(snakeField[headPositions[i].getX() + headPositions[i].getY() * xFields].getContent() === "apple"){
                        snakeField[headPositions[i].getX() + headPositions[i].getY() * xFields].setContent("empty");
                        snakeArray[i].increaseSnakeSize();
                    }
                }
            }
            animateFields(interpolateField,animationStep,false); // finish drawing the animated Fields
            currentAnimatedFields = [];
        }
        for (let i = 0; i < snakeArray.length; i++){
            snakeField = updateSnake(snakeField,snakeArray[i]); // calculate the updates snakes and snakefield for every tick
        }
        animateFields(interpolateField,animationStep,true);
    }
}

let fps = 60;
let fpsThreshold = 0;
let last = performance.now() / 1000;
let elapsedTime = 0;

const fixedTimeStep = 800 * 0.001; // half a second for a Time Step of the Snake/ the forward moving
const animationStep = 0.02; // if this is too small the game cant keep up with the fps // TODO make fps dependend on the animationStep? what if the fps wouldnt get met
const currentInterpolation = linearInterpolation;


let snakeField = [];
let currentAnimatedFields = [];
let mySnake = new Snake(10, 0, 0, new Facing("up"), [], [] , true);
let snakeArray = [mySnake];


for (let i = 0; i < xFields; i++){
    for (let j = 0; j < yFields; j++){
        snakeField[i + j * xFields] =  new Field(i, j, "empty",null);//emptyField;
    }
}


drawCanvas();
snakeField = updateSnake(snakeField,mySnake);
animateFields(interpolateField, 1, false);

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

// kleinere Probleme der Apfel wird nur einmal gezeichnet

// Ideen für nächstes Projekt, Animierer dem einfach alle zu animierenden Objekte übergeben werden können + game Regel behandler