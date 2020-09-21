const reader = require('readline');
const rl = reader.createInterface({
    input: process.stdin,
    output: process.stdout
})

function askQuestion(query) {
    let response;

    rl.setPrompt(query);
    rl.prompt();

    return new Promise((resolve) => {
        rl.on('line', (userInput) => {
            response = userInput;
            rl.close();
        });

        rl.on('close', () => {
            resolve(response);
        });
    });
}

let inputStr;
await (async () => {
    inputStr = await askQuestion('Please input p,q, p -> q\n');
})();

let input = inputStr.trim().split(',');

// P, Q = 2
//let numVar = inputTwo.length - 1;
let numVar = input.length - 1;

// P, Q and R are stored as arrays - given their truth tables
// Filling the variable list with empty arrays
let varList = {};
for(let i = 0; i < numVar; i++) {
    Object.assign(varList, {[input[i]]: []});
}

// Filling the Variables' truth tables using binary
for(let row = 0; row < 2 ** numVar; row++) {
    let bin = (row.toString(2)).padStart(numVar, '0');
    
    for(let col = 0; col < numVar; col++) {
        (varList[input[col]]).push(Number(bin[col]));
    }
}

let currRow = 0;

function recursFunc(expression) {
    let returnValue = _recursFunc(expression);
    //console.log(`Return value for expression ${expression} is ${returnValue}`);
    return returnValue == true ? 1 : 0;
}

// Convert (PvQ) -> (~Q) into return (return (PvQ) -> return (~Q))
// Need to have (PvQ), (~Q) and -> 
// Assume the input is of type (blabla) operation (blabla)
function _recursFunc(expression) {
    let twoParentheses = /[,]*\s*([~]*)\(([^"]+)\)\s*(<->|v|\^|->|<-|xor){1}\s*([~]*)\(([^]+)\)\s*/g.exec(expression);  // Separates it into [...,(),operator,(),...]
    let oneParenthesisLeft = /[,]*\s*([~]*)\(([^"]+)\)\s*(<->|v|\^|->|<-|xor){1}\s*([~]*)(\w){1}(?!\))/g.exec(expression);  // Separates it into [...,express,operator,(),...]
    let oneParenthesisRight = /[,]*\s*(?<!\()([~]*)(\w){1}\s*(<->|v|\^|->|<-|xor){1}\s*([~]*)\(([^"]+)\)/g.exec(expression);  // Separates it into [...,(),operator,express,...]
    let noParenthesis = /[,]*(?<!\()([~]*)(\w){1}\s*(<->|v|\^|->|<-|xor){1}\s*([~]*)(\w){1}(?!\))/g.exec(expression);    // Separates it into [...,express,operator,express,...]
    let rightNegatedExpress = /[,]*\s*\(*([\w\s]+)\)*\s*(<->|v|\^|->|<-|xor){1}[\s]*([~]+)\(([^)]+)\)$/g.exec(expression); // Separates it into [express, operator, ~+, express,...]
    let leftNegatedExpress = /([~]+)\(([^)]+)\)\s*(<->|v|\^|->|<-|xor){1}[\s]*\(*([\w\s]*)\)*$/g.exec(expression); // Separates it into [~+, express, operator, express,...]
    let bothNegatedExpress = /([~]+)\(([^)]+)\)\s*(<->|v|\^|->|<-|xor){1}[\s]*([~]+)\(([\w\s]*)\)$/g.exec(expression); // Separates it into [~+, express, operator, ~+, express,...]

    //let negatedExpress = /([~]+)\(([^)]+)\)$/g.exec(expression);
    
    // Trim it if it has spaces
    twoParentheses = (twoParentheses != null) ? twoParentheses.map((curr) => {return (typeof curr == 'string') ? curr.trim() : curr}) : twoParentheses;
    oneParenthesisLeft = (oneParenthesisLeft != null) ? oneParenthesisLeft.map((curr) => {return (typeof curr == 'string') ? curr.trim() : curr}) :  oneParenthesisLeft;
    oneParenthesisRight = (oneParenthesisRight != null) ? oneParenthesisRight.map((curr) => {return (typeof curr == 'string') ? curr.trim() : curr}) : oneParenthesisRight;
    noParenthesis = (noParenthesis != null) ? noParenthesis.map((curr) => {return (typeof curr == 'string') ? curr.trim() : curr}) : noParenthesis;
    rightNegatedExpress = (rightNegatedExpress != null) ? rightNegatedExpress.map((curr) => {return (typeof curr == 'string') ? curr.trim() : curr}) : rightNegatedExpress;
    leftNegatedExpress = (leftNegatedExpress != null) ? leftNegatedExpress.map((curr) => {return (typeof curr == 'string') ? curr.trim() : curr}) :  leftNegatedExpress;
    bothNegatedExpress = (bothNegatedExpress != null) ? bothNegatedExpress.map((curr) => {return (typeof curr == 'string') ? curr.trim() : curr}) : bothNegatedExpress;
    let left;
    let operator;
    let right;
    
    // Handle negatives by returning their opposite if the expression is negative
    // Both sides are negated means we'd like to eval both sides [as parentheses because negation means parentheses].
    if(bothNegatedExpress != undefined) {
        console.table(['Both negated', bothNegatedExpress]);
        left = bothNegatedExpress[2];
        operator = bothNegatedExpress[3];
        right = bothNegatedExpress[5];
        return evalExpression(!recursFunc(left) == true ? 1 : 0, !recursFunc(right) == true ? 1 : 0, operator, currRow); 


        // Past attempts at solving this vvvv 
        //expression = (negatedExpress[1].length % 2 == 0) ? negatedExpress[2] : !negatedExpress[2];
        //return (negatedExpress[1].length % 2 == 0) ? recursFunc(negatedExpress[2]) : !recursFunc(negatedExpress[2]);
    }
    else if(leftNegatedExpress != undefined) {
        console.table(['Negated Left', leftNegatedExpress]);
        left = rightNegatedExpress[1];
        operator = rightNegatedExpress[2];
        right = rightNegatedExpress[4];
        return evalExpression(!recursFunc(left) == true ? 1 : 0, recursFunc(right), operator, currRow); 
    }
    else if(rightNegatedExpress != undefined) {
        console.table(['Negated Right', rightNegatedExpress]);
        left = rightNegatedExpress[1];
        operator = rightNegatedExpress[2];
        right = rightNegatedExpress[4];
        return evalExpression(recursFunc(left), !recursFunc(right) == true ? 1 : 0, operator, currRow); 
    }
   
    // If it's not negative - check what form it is and act accordingly [for eval]
    if(twoParentheses != null) {
      console.table(['Two', twoParentheses] || 'Not both');
      // Set default values 
      left = twoParentheses[2];
      operator = twoParentheses[3];
      right = twoParentheses[5];
      // If it's not undefined - it means it contains ~ 
      if(twoParentheses[1] != undefined || twoParentheses[4] != undefined) {
        // Check how many ~ there are
        if((twoParentheses[1] || '').length % 2 == 1) {
            left = (varList[left] == undefined) ? !left : !varList[left][currRow]; 
        }
        if((twoParentheses[4] || '').length % 2 == 1) {
            right = (varList[right] == undefined) ? !right : !varList[right][currRow]; 
        }
      }
      result = evalExpression(recursFunc(left), recursFunc(right), operator, currRow);
    }
    else if(oneParenthesisLeft != null) {
      console.table(['Left', oneParenthesisLeft] || 'Not left');
      // Set default values 
      left = oneParenthesisLeft[2];
      operator = oneParenthesisLeft[3];
      right = oneParenthesisLeft[5];
      // If it's not undefined - it means it contains ~ 
      if(oneParenthesisLeft[1] != undefined || oneParenthesisLeft[4] != undefined) {
        // Check how many ~ there are
        if((oneParenthesisLeft[1] || '').length % 2 == 1) {
            left = (varList[left] == undefined) ? !left : !varList[left][currRow]; 
        }
        if((oneParenthesisLeft[4] || '').length % 2 == 1) {
            right = (varList[right] == undefined) ? !right : !varList[right][currRow]; 
        }
      }
      result = evalExpression(recursFunc(left), right, operator, currRow);
    }
    else if(oneParenthesisRight != null) {
      console.table(['Right parenthesis', oneParenthesisRight] || 'Not right');
      // Set default values 
      left = oneParenthesisRight[2];
      operator = oneParenthesisRight[3];
      right = oneParenthesisRight[5];
      // If it's not undefined - it means it contains ~ 
      if(oneParenthesisRight[1] != undefined || oneParenthesisRight[4] != undefined) {
        // Check how many ~ there are
        if((oneParenthesisRight[1] || '').length % 2 == 1) {
            left = (varList[left] == undefined) ? !left : !varList[left][currRow]; 
        }
        if((oneParenthesisRight[4] || '').length % 2 == 1) {
            right = (varList[right] == undefined) ? !right : !varList[right][currRow]; 
        }
      }
      result = evalExpression(left, recursFunc(right), operator, currRow);
    }
    else if(noParenthesis != null) {
      console.table(['None', noParenthesis] || 'Has parenth');
      // Set default values 
      left = noParenthesis[2];
      operator = noParenthesis[3];
      right = noParenthesis[5];
      // If it's not undefined - it means it contains ~ 
      if(noParenthesis[1] != undefined || noParenthesis[4] != undefined) {
        // Check how many ~ there are
        if((noParenthesis[1] || '').length % 2 == 1) {
            left = (varList[left] == undefined) ? !left : !varList[left][currRow]; 
        }
        if((noParenthesis[4] || '').length % 2 == 1) {
            right = (varList[right] == undefined) ? !right : !varList[right][currRow]; 
        }
      }
      result = evalExpression(left, right, operator, currRow);
    }
    else if(expression == false) {
        return 0;
    }
    else if(expression == true) {
        return 1;
    }
    else {
        if(expression.length == 1) {
            console.table(['Single', `Returning:${varList[expression][currRow]}`, expression]);
            return varList[expression][currRow];
        }
        else {
            console.log('Not sure what happened~');
        }
    }
}

// Used to log the return value for debugging
function evalExpression(left, right, operator, row) {
    const returnValue = _evalExpression(left, right, operator, row);
    console.log(`[EVAL] Return value: ${returnValue}`);
    return returnValue;
}

// Left is a primitive predicate if it exists in varList
function _evalExpression(left, right, operator, row) {
    console.log(`-------Eval Expression-------`);
    console.log(`Expression: ${left} ${operator} ${right}`);
    console.log(`Row: ${row} means left: ${varList[left] == undefined ? left : varList[left][row]} and right: ${varList[right] == undefined ? right : varList[right][row]}`);
    console.log(`Varlist: ${JSON.stringify(varList)}`);
    // console.trace();
    console.log(`-----------End eval----------`);
    
    switch(operator) {
        case 'v': 
            return or(left, right, row);
        case '^': 
            return and(left, right, row);
        case '->':
            return conditional(left, right, row);
        case '<->':
            return biconditional(left, right, row);

        default: console.log(`Invalid operator ${operator}`);
    }

}

function biconditional(left, right, row) {
    let returnValue = _biconditional(left,right,row);
    console.log(`Result of BICONDITIONAL operation on ${left}, ${right}, ${row} is ${returnValue}`);
    return returnValue;
}
function _biconditional(left, right, row) {
    if(!isNaN(left) && !isNaN(right)) {
        return Number(left) == Number(right) ? 1 : 0;
    }
    else if(!isNaN(left)) {
       return Number(left) == varList[right][row] ? 1 : 0;
    }
    else if(!isNaN(right)) {
        return varList[left][row] == Number(right) ? 1 : 0;
    }
    else {
        return varList[left][row] == varList[right][row] ? 1 : 0;
    }
}

function and(left,right,row) {
    let returnValue = _and(left,right,row);
    console.log(`Result of AND operation on ${left}, ${right}, ${row} is ${returnValue}`);
    return returnValue;
}
function _and(left, right, row){
    if(!isNaN(left) && !isNaN(right)) {
        return Number(left) && Number(right);
    }
    else if(!isNaN(left)) {
       return Number(left) && varList[right][row];
    }
    else if(!isNaN(right)) {
        return varList[left][row] && Number(right);
    }
    else {
        return varList[left][row] && varList[right][row];
    }
}
// Logging function
function or(left,right,row) {
    let returnValue = _or(left,right,row);
    console.log(`Result of OR operation on ${left}, ${right}, ${row} is ${returnValue}`);
    return returnValue;
}
function _or(left, right,row){
    if(!isNaN(left) && !isNaN(right)) {
        return Number(left) || Number(right);
    }
    else if(!isNaN(left)) {
       return Number(left) || varList[right][row];
    }
    else if(!isNaN(right)) {
        return varList[left][row] || Number(right);
    }
    return varList[left][row] || varList[right][row];
}
function conditional(left, right, row) {
    let returnValue = _conditional(left,right,row);
    console.log(`Result of CONDITIONAL operation on ${left}, ${right}, ${row} is ${returnValue}`);
    return returnValue;
}
function _conditional(left, right, row) {
    if(!isNaN(left) && !isNaN(right)) {
        if(left) {
            return right;
        }
        else {
            return 1;
        }
    }
    else if(!isNaN(left)) {
        if(left) {
            return varList[right][row];
        }
        else {
            return 1;
        }
    }
    else if(!isNaN(right)) {
        if(varList[left][row]) {
            return Number(right);
        }
        else {
            return 1;
        }
    }
    else {
        if(varList[left][row]) {
            return varList[right][row];
        }
        else {
            return 1;
        }
    }
}

varList["result"] = [];
//for(let i = 0; i < 2 ** numVar; i++) {
   varList["result"].push(recursFunc(inputStr))
   currRow++;
//}

// The final truth table
console.table(varList);