
let gamePaused = false;

const button = document.getElementById("pauseButton");
button.addEventListener("click",pauseToggle);

const createCookieButton = document.getElementById("cookieCreateButton");
createCookieButton.addEventListener("click", createSnakeCookie);
const deleteCookieButton = document.getElementById("cookieDeleteButton");
deleteCookieButton.addEventListener("click", deleteSnakeCookie);
const loadCookieButton = document.getElementById("cookieLoadButton");
loadCookieButton.addEventListener("click", loadSnakeCookie);

function cookieButtonToggle(){ //only show the cooke delete and load buttons if cookies exist
if (document.cookie.length > 0){
    deleteCookieButton.style.display = "";
    loadCookieButton.style.display = "";
}
else{
    deleteCookieButton.style.display = "none";
    loadCookieButton.style.display = "none";
}
}
cookieButtonToggle();
const canvas = document.getElementById("snakeSpace");
let canvCont = canvas.getContext("2d");

const appleImage = document.createElement("img");
appleImage.src = "img/apple.png";


const gradientObj = canvCont.createLinearGradient(0,0,canvas.clientWidth/2,0);
gradientObj.addColorStop(0,"black");
gradientObj.addColorStop(1,"red");

const gameColors =  {
    // backgroundColor:"white", // 
    backgroundColor:"white", // get snake canvas css background
    
    snakeHeadColor:"orange",
    snakeTailColor: gradientObj,//"red",
    boardColor:"black",
    strokeColor:"red",
    textColor:"black",
    textFont: "30px Verdana"
}

const curFields = 25;
const ratio = (canvas.clientHeight > canvas.clientWidth) ? (canvas.clientWidth / canvas.clientHeight) : (canvas.clientHeight / canvas.clientWidth);
const standardCount = Math.round(curFields * (ratio)); // determine the square Count on start

// canvas will resize on different screen sizes
let canvasxSize = canvas.clientWidth;
let canvasySize = canvas.clientHeight;

let xFields = 0;
let yFields = 0;
let smallerSize = 0;
if (canvasxSize > canvasySize){
    xFields = curFields;//10
    yFields = standardCount;
    smallerSize = canvasySize;
}
else {
    xFields = standardCount;
    yFields = curFields;//10
    smallerSize = canvasxSize;

}
let freeFields = xFields * yFields;
let squareSize = Math.round((smallerSize) / (standardCount));


function calcSquareSizeDependingOnCanvas(canvas){
    if (canvas.width !== canvasxSize){
        canvasxSize = canvas.width;
    }
    if (canvas.height !== canvasySize){
        canvasySize = canvas.height;
    }
    smallerSize = (canvasxSize > canvasySize ? canvasySize : canvasxSize);
    // recalculate the saure Sizes and round them
    squareSize = Math.round((smallerSize) / (standardCount));
}



// function euclideanGCD(a,b){
//     if (b == 0){
//         return a;
//     }
//     return euclideanGCD(b, a % b);
// }

// const greastestCommonDivisor = euclideanGCD(canvas.clientHeight, canvas.clientWidth);
// let xFields = canvas.clientWidth / greastestCommonDivisor;//10
// let yFields = canvas.clientHeight / greastestCommonDivisor;





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

function intDirectionToString(int){ // facing obj method, so I dont have to change the other code using Facing.directionString()
    switch(int){
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
        this.updateFields = updateFields;
        if (snakeTail.length === 0){
            this.snakeTail = [];
            for (let i = size - 1; i >= 0; i--){
                this.snakeTail.push(new Position(xHeadPosition + i, yHeadPosition)); // the highest Index has the head and lowest have the following tail pieces 
                this.updateFields.push(new Field(xHeadPosition + i, yHeadPosition, "tail",facingDirection));        
                // update global free fields
                freeFields = freeFields-1
            }
        }
        else {
            this.snakeTail = snakeTail;
            for (let i = 0; i < this.snakeTail.length; i++){
                this.updateFields.push(new Field(this.snakeTail[i].getX(),this.snakeTail[i].getY(), "tail", facingDirection)) // TODO safe snakes as Fields
            }
            freeFields = freeFields - snakeTail.length // TODO on deleting Snake/losing Snake update freeFields
        }
        this.gameOver = false;
        
        //
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
        console.log(this.updateFields);
        let headPosition = this.updateFields.filter((curField) => (curField.getContent() == "head"))
                                            .map((headPosition) => new Position(headPosition.getX(), headPosition.getY()))[0];
        console.log(headPosition)
        this.updateFields = this.updateFields 
                                            .concat(
                                            this.snakeTail.map((curVal) => new Field(curVal.getX(), curVal.getY(), "empty", new Facing("up"))));
        if (headPosition != null){ // fix for getting called twice
            // filtering hit position
            // remove the collided head piece from the pieces that have to be drawn if its not from the same snake

            this.updateFields = this.updateFields.filter((curField) => !(curField.getX() === headPosition.getX() && curField.getY() === headPosition.getY()));
                                                                                                                                                                            
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

function animateFields(animatedFields,fieldInterpolationFunc,animationStep,animate){
    for (let i = 0; i < animatedFields.length; i++){
        let widthToDraw = squareSize;
        let heightToDraw = squareSize;
        let curAnimationProgress = animatedFields[i].getCompleted();
        let drawnField = animatedFields[i];
        curxPos = drawnField.getX() * (squareSize);
        curyPos = drawnField.getY() * (squareSize);
        let editedxPos = curxPos; //* 0.5;
        let editedyPos = curyPos; // * 0.5;
        canvCont.beginPath();

        if (drawnField.getContent() === "tail"){ // case tail
            canvCont.fillStyle = gameColors.snakeTailColor;    
        }
        else if(drawnField.getContent() === "empty"){ // case empty
            canvCont.fillStyle = gameColors.backgroundColor;    
        }
        else if(drawnField.getContent() === "head"){ // case head
            canvCont.fillStyle = gameColors.snakeHeadColor;
        }
        else if (drawnField.getContent() === "apple"){
            // spawn apple and skip
            canvCont.fillStyle = gameColors.backgroundColor;
            canvCont.fillRect(editedxPos,editedyPos,widthToDraw,heightToDraw);
            canvCont.stroke();
            // always redraw the border
            canvCont.beginPath();
            // todo maybe add as color depending on the current Element
            canvCont.strokeStyle = gameColors.strokeColor;
            canvCont.rect(curxPos,curyPos,squareSize,squareSize);
            canvCont.stroke();
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
        animatedFields[i] = fieldInterpolationFunc(drawnField, animationStep, currentInterpolation);

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
        // todo maybe add as color depending on the current Element
        canvCont.strokeStyle = gameColors.strokeColor;
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

    // find every piece colliding -> the head piece thats on a not empty field that is not an apple
    // add self collided Snakes    

    let collidedSnakes =snakes.filter((curVal) => (!(snakeField[curVal.xHeadPosition + curVal.yHeadPosition * xFields].getContent() === "empty") && 
                                                    !(snakeField[curVal.xHeadPosition + curVal.yHeadPosition * xFields].getContent() === "apple"))); // filter gibt elemete wieder die die Aussage erfüllen
    // findet alle felder die auf denen sich die Köpfe von Schlangen befinden, aber die nicht leer sind
    // für mehrere Schlangen muss
    // for self collisions remove the whole snake
    // check for self collision -> check if the snakes Head Position is in the list snaketail
    let collidedSnakesInfo = collidedSnakes.map((collidedSnake) => 
                                    collidedSnake.getSnakeTail().filter(
                                                    (snakePiece) => 
                                                        snakePiece.getX() == collidedSnake.xHeadPosition && snakePiece.getY() == collidedSnake.yHeadPosition).length > 0 ? 
                                                            [collidedSnake,"self"] : [collidedSnake,""]);
    // console.log(collidedSnakesInfo);
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
            if (snakeField[applexPosition + appleyPosition * xFields].isFree()){ // only draw
                snakeField[applexPosition + appleyPosition * xFields].setContent("apple");
                let field = new Field(applexPosition, appleyPosition, "apple", null);
                currentAnimatedFields.push(new DrawnField(field,1));
            }
            else{// find the next free field
                for (let i = 0; i < xFields; i++){
                    for (let j = 0; j < yFields; j++){
                        if (snakeField[i + j  * xFields].isFree()){ // only draw
                            snakeField[i + j * xFields].setContent("apple");
                            let field = new Field(i, j, "apple", null);
                            currentAnimatedFields.push(new DrawnField(field,1));
                            return;
                        }
                    }
                }   
            }
        }
        
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

// TODO BFS to find a valid way 
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
                canvCont.fillStyle = gameColors.textColor;
                canvCont.fillTest = gameColors.textFont;
                canvCont.fillText(fillString,curxPos,curyPos + squareSize, squareSize);
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
                canvCont.fillStyle = gameColors.backgroundColor;    
                canvCont.fillRect(curxPos, curyPos, squareSize,squareSize);
                canvCont.beginPath();
                canvCont.strokeStyle = gameColors.strokeColor;
                canvCont.rect(curxPos,curyPos,squareSize,squareSize);
                canvCont.stroke();
            }
        }
    }
}

function addSnake(snake){
    // TODO find free positions
    snakeArray.push(snake);
    newSnakeAnimateFields = snake.clearSnakeUpdate().map((field) => new DrawnField(field, 1));
    console.log("added Snake");
    console.log(newSnakeAnimateFields);
    animateFields(newSnakeAnimateFields,interpolateField, animationStep, false);
}

function pauseToggle(){
    gamePaused = !gamePaused;
}


function run(){
    window.requestAnimationFrame(run);
    if (gamePaused){
        animateFields(currentAnimatedFields,interpolateField, animationStep, false); // finish drawing the animated Fields
        currentAnimatedFields = [];
        return;
    }
    let now = performance.now() / 1000;
    let dt = Math.min(now - last, 1);
    elapsedTime = elapsedTime + (now - last);
    last = now;
    if (fps > 0) { 
        fpsThreshold += dt;
        if (fpsThreshold < 1.0 / fps) { // if under the fps threshold abort
            return;
        }
        fpsThreshold -= 1.0 / fps;
        if ((elapsedTime) > fixedTimeStep){
            elapsedTime = 0;
            let headPositions = snakeArray.map((snake) => snake.moveforward());
            for (let i = 0; i < headPositions.length; i++){
                checkCollisions(snakeField,snakeArray);
                if (headPositions[i] != null){
                    if(snakeField[headPositions[i].getX() + headPositions[i].getY() * xFields].getContent() === "apple"){
                        snakeField[headPositions[i].getX() + headPositions[i].getY() * xFields].setContent("empty");
                        snakeArray[i].increaseSnakeSize();
                        spawnApple();
                    }
                }
            }
            animateFields(currentAnimatedFields,interpolateField,animationStep,false); // finish drawing the animated Fields
            currentAnimatedFields = [];
        }
        for (let i = 0; i < snakeArray.length; i++){
            snakeField = updateSnake(snakeField,snakeArray[i]); // calculate the updates snakes and snakefield for every tick
        }
        animateFields(currentAnimatedFields,interpolateField,animationStep,true);
    }
}

function readCookie(cookieName){
    let splitSiteCookie = document.cookie.split(";");
    for(let i = 0; i < splitSiteCookie.length; i++){
        let currentCookie = splitSiteCookie[i];
        while(currentCookie.charAt(0) == ' '){ // remove preceding whitespaces
            currentCookie = currentCookie.substring(1);
        }
        if (currentCookie.indexOf(cookieName) == 0){
            return currentCookie.substring(cookieName.length, currentCookie.length);
        }
    }
    return "";
}

const cookieName = "SnakeCookie"
function createSnakeCookie(){
    // split snakes with . symbol
    let snakesString = ""
    for (let i = 0; i < snakeArray.length;i++){
        console.log(snakeArray[i]);
        snakesString = snakesString + encodeSnake(snakeArray[i]) + ".";
    }
    createCookie(cookieName,snakesString,2,"","");
    cookieButtonToggle();
}

function encodeSnake(snake){
    let jsonSnake = JSON.stringify(snake);
    let encodedSnake = btoa(jsonSnake); // bring to base 64 encoding, this only handles UTF8 but should be fine for snake objects (no escaping needed)
    return encodedSnake;
}

function decodeSnake(b64Snake){
    let decodedSnake = atob(b64Snake);
    let jsonObj = (JSON.parse(decodedSnake));
    let positions = jsonObj.snakeTail.map((genericObj) => new Position(genericObj.xPosition, genericObj.yPosition));
    let snakeObj = new Snake(jsonObj.size,jsonObj.xHeadPosition, jsonObj.yHeadPosition,new Facing(intDirectionToString(jsonObj.facingDirection.direction)),positions, [],jsonObj.isAnimated);
    return snakeObj;
}


function deleteSnakeCookie(){
    deleteCookie(cookieName,"");
    cookieButtonToggle();
}

function loadSnakeCookie(){
    //if cookie is set load content and clear currentSnakes
    let splitSiteCookie = document.cookie.split(";");
    let resultSnakes = [];
    for(let i = 0; i < splitSiteCookie.length; i++){
        let currentCookie = splitSiteCookie[i];
        while(currentCookie.charAt(0) == ' '){ // remove preceding whitespaces
            currentCookie = currentCookie.substring(1);
        }
        if (currentCookie.indexOf(cookieName) == 0){ // found the searched Cookie
            // remove the cookie name from the start of the string
            currentCookie = currentCookie.substring(cookieName.length + 1)  // + 1 to remove the following "=" sign
            // split the cookie with (.)
            let encodedSnakes = currentCookie.split(".");
            for (let i = 0; i < encodedSnakes.length; i++){
                if (encodedSnakes[i].length > 0){
                    resultSnakes.push(decodeSnake(encodedSnakes[i]));
                }
            }
            break;
        }
    }
    if (resultSnakes.length > 0){
        for (let i = 0; i <snakeArray.length; i++){
            snakeArray[i].setSnakeGameOverState();
            updateSnake(snakeField,snakeArray[i]);
        }
        snakeArray = [];
        // empty all current animated fields and redraw
        animateFields(currentAnimatedFields,interpolateField,animationStep,false);
        currentAnimatedFields = [];
        for (let newSnake of resultSnakes){
            addSnake(newSnake);
            animateFields(newSnake.updateFields,interpolateField,animationStep,false);
            mySnake = newSnake;
        }
    }
}

function deleteCookie(cookieName,domain){
    let splitSiteCookie = document.cookie.split(";");
    let resultCookie = "";
    for(let i = 0; i < splitSiteCookie.length; i++){
        let currentCookie = splitSiteCookie[i];
        while(currentCookie.charAt(0) == ' '){ // remove preceding whitespaces
            currentCookie = currentCookie.substring(1);
        }
        if (currentCookie.indexOf(cookieName) == 0){ // found the searched Cookie
            let curDomain = (domain === "" ? "":"Domain=" + domain +";");
            currentCookie = cookieName + "=;" + "Path=/;" + curDomain + "Expires=Thu, 01 Jan 1970 00:00:01 GMT;" + "Max-Age=-9999999999999;";
        }
        resultCookie = resultCookie + currentCookie;
    }
    // console.log(resultCookie);
    document.cookie = resultCookie;
    
}

function createCookie(cookieName,cookieValue,cookieExpiringDay,domain, path){
    const d = new Date();
    d.setTime(d.getTime() + (cookieExpiringDay * 24 * 60 * 60 * 1000));
    const expires = "expires="+d.toUTCString();
    let curDomain = (domain === "" ? "":"Domain=" + domain + ";");
    let resultCookie = cookieName+"="+cookieValue+";"+expires+";"+ curDomain + "Path=/"+ path + ";"; // return the created cookie
    // console.log(resultCookie);
    document.cookie = resultCookie;
}


let fps = 60;
let fpsThreshold = 0;
let last = performance.now() / 1000;
let elapsedTime = 0;

const fixedTimeStep = 800 * 0.001; // half a second for a Time Step of the Snake/ the forward moving
const animationStep = 0.02; // if this is too small the game cant keep up with the fps // TODO make fps dependend on the animationStep? what if the fps wouldnt get met
const currentInterpolation = linearInterpolation;

// initalize all basics
let snakeField = []; // stores the Field where the snake can move
let currentAnimatedFields = [];

let mySnake = new Snake(10, 0, 0, new Facing("up"), [], [] , true);
// console.log(JSON.stringify(mySnake));
let snakeArray = [mySnake]; // stores the snakes on the field
for (let i = 0; i < xFields; i++){
    for (let j = 0; j < yFields; j++){
        snakeField[i + j * xFields] =  new Field(i, j, "empty",null);//emptyField;
    }
}


function setUpSnakeField(){
    snakeField = []; // stores the Field where the snake can move
    currentAnimatedFields = [];

    mySnake = new Snake(10, 0, 0, new Facing("up"), [], [] , true);
    // console.log(JSON.stringify(mySnake));
    snakeArray = [mySnake]; // stores the snakes on the field

    for (let i = 0; i < xFields; i++){
        for (let j = 0; j < yFields; j++){
            snakeField[i + j * xFields] =  new Field(i, j, "empty",null);//emptyField;
        }
    }
}

setUpSnakeField();
drawCanvas();
snakeField = updateSnake(snakeField,mySnake);
spawnApple();
animateFields(currentAnimatedFields,interpolateField, 1, false);

document.addEventListener('keydown', function(event) {
    if(event.key == "r") {
        setUpSnakeField()
        drawCanvas();
        spawnApple();
    }
    else if(event.key == "a") {
        mySnake.turnLeft();
    }
    else if(event.key == "d"){
        mySnake.turnRight();
    }
    else if(event.key == " "){
        pauseToggle()
    }
});

window.onresize = function(){
    calcSquareSizeDependingOnCanvas(canvas);
    drawCanvas();
}


window.onload = function() {
    window.requestAnimationFrame(run);
    calcSquareSizeDependingOnCanvas(canvas);
    drawCanvas();
    };  



// Program Idee 
// erstelle ein Feld auf dem die Schlange sich befinden kann
// drawCall der das Feld zeichnet

// benötigte Daten
// Array das die Felder im Blick behält
// Schlange die Informationen, Länge, geschwindigkeit,facing enthält
// fixed Speed?

// neuste Ideen Zeichen Geschwindigkeit unabhängig von FPS machen
// Tiefensuche für späteres automatisches bewegen zum Mauscursor?
// Animation des vorwärtsbewegens -> animations Kette 
// anhalten der Schlange mit Knopf
