


let canvas = document.getElementById("snakeSpace");
let canvasxSize = canvas.clientWidth;
let canvasySize = canvas.clientHeight;


let xFields = (canvasxSize % 2) == 0 ? 21 : 21;
let yFields = (canvasxSize % 2) == 0 ? 11 : 11;

let canvCont = canvas.getContext("2d");

let squareSize = canvasxSize / xFields;


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

class Field{
    constructor(xIndex,yIndex,content){
        this.xIndex = xIndex;
        this.yIndex = yIndex;
        this.content = content;
    }
    getX(){
        return this.xIndex;
    }
    getY(){
        return this.yIndex;
    }
    getContent(){
        return this.content;
    }
    isFree(){
        return this.content === "0";
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
            this.updateFields.push(new Field(xHeadPosition + i, yHeadPosition, "1"));
        }
        this.updateFields[this.updateFields.length - 1].content = "2";
    }

    clearSnakeUpdate(){
        let curSnakeUpate = this.updateFields;
        this.updateFields = [];
        return curSnakeUpate;
    }

    willCollide(snakeField){
        let nextPosition = this.nextPosition(); // xPos
        if (snakeField[nextPosition.getX() + nextPosition.getY() * xFields].content === "0"){
            return false;
        }
        return true;
    }

    // up = 0
    // right = 1
    // down = 2
    // left 3

    nextPosition(){
        if (this.facingDirection.facingUp()) {
            // inside bounds
            if(this.yHeadPosition - 1 >= 0){
                return new Position(this.xHeadPosition, this.yHeadPosition - 1);
            }
            else{ // Out of bounds
                return new Position(this.xHeadPosition, yFields - 1);
            }
        }
        else if (this.facingDirection.facingDown()) {
            // add to new head Position 
            if(this.yHeadPosition + 1 > yFields - 1){ // out of bounds
                return new Position(this.xHeadPosition, 0);
            }
            else{
                return new Position(this.xHeadPosition, this.yHeadPosition + 1);
            }
        }
        else if (this.facingDirection.facingRight()) {
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
        this.snakeTail.push(this.nextPosition());
        // update the updateField
        if (this.size > 1) {
            this.updateFields.push(new Field(this.xHeadPosition, this.yHeadPosition,"1")); // set the old head position to 1 if the snake is longer than 1 -> has a tail
        }
        // TODO add null check
        this.updateFields.push(new Field(oldTail.getX(), oldTail.getY(), "0")); // set the removed tail position to 0
        //snakeField[this.snakeTail.length - 1].content = "2"; // set the head position to "2"

        // update the head Position and add to update Fields
        this.xHeadPosition = this.snakeTail[this.snakeTail.length - 1].getX();
        this.yHeadPosition = this.snakeTail[this.snakeTail.length - 1].getY();

        this.updateFields.push(new Field(this.xHeadPosition, this.yHeadPosition, "2"));
    }

}

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
    drawSnake(snakeField, snake);
}

function drawSnake(snakeField, snake){
    // draw the first Snake
    let snakeUpdate = snake.clearSnakeUpdate();
    for (let i = 0; i < snakeUpdate.length; i++){
        let field = snakeUpdate[i];
        // update the safed Snake Field
        snakeField[field.getX() + field.getY() * xFields].content = field.getContent(); 
        // redraw the Snake Canvas
        curxPos = field.getX() * squareSize;
        curyPos = field.getY() * squareSize;
        if (field.getContent() === "1"){ // case tail
            canvCont.beginPath();
            canvCont.fillStyle = "red";    
            canvCont.fillRect(curxPos,curyPos,squareSize,squareSize);
            canvCont.stroke();
        }
        else if(field.getContent() == "0"){
            canvCont.beginPath();
            canvCont.fillStyle = "white";    
            canvCont.fillRect(curxPos,curyPos,squareSize,squareSize);
            canvCont.stroke();
        }
        else if(field.getContent() == "2"){ // case head
            canvCont.beginPath();
            canvCont.fillStyle = "black";    
            canvCont.fillRect(curxPos,curyPos,squareSize,squareSize);
            canvCont.stroke();
        }
        // always redraw the border
        canvCont.beginPath();
        canvCont.rect(curxPos,curyPos,squareSize,squareSize);
        canvCont.stroke();
    }
}

let mySnake = new Snake(4, 0, 0, new Facing("left"), [], []);

let snakeField = [];
for (let i = 0; i < xFields; i++){
    for (let j = 0; j < yFields; j++){
        snakeField[i + j * xFields] =  new Field(i, j, "0")//emptyField;
    }
}

// DFS to find a valid way 
function shortestWayToPosition(Field){

}

// (i,j) mit i = 3, j=2
// (0,0) (1,0) (2,0)
// (0,1) (1,1) (2,1)
// -> 0 1 2 3 4 5


let fps = 3;
let fpsThreshold = 0;
let last = performance.now() / 1000;
let repitition = 0;

function run(){
    repitition = repitition + 1;
    window.requestAnimationFrame(run);
    let now = performance.now() / 1000;
    let dt = Math.min(now - last, 1);
    last = now;
    if (fps > 0) {
        fpsThreshold += dt;
        if (fpsThreshold < 1.0 / fps) {
            return;
        }
        fpsThreshold -= 1.0 / fps;
        mySnake.moveforward();
        if (repitition >= 200){
            repitition = 0;
            mySnake.turnRight();
        }
        drawCanvas(snakeField,mySnake);
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
// Tiefensuche für späteres automatisches bewegen zum Mauscursor
// Animation des vorwärtsbewegens -> animations Kette 