// author: Wendy Shu
// Sample zipcode to search for lenders: 94040, 95112

let store = window.localStorage;
let graph = document.getElementById("graph");
let g = graph.getContext("2d");  
let width = graph.width, height = graph.height, months=0, monthlyPayment=0;

// reset the field values. On html page, add a "reset" button 
function reset() {
    document.getElementById('amount').value='';
    document.getElementById('interest').value='';
    document.getElementById('period').value='';
    document.getElementById('zipcode').value='';
    document.getElementById('monthly').innerHTML='';
    document.getElementById('total').innerHTML='';
    document.getElementById('totalInterest').innerHTML='';
    document.getElementById('lenders').innerHTML='';
    store.clear();
    g.clearRect(0, 0, width, height);
}

// Validate input text field values
function validate() {
    let amount = document.getElementById('amount');
    let interest = document.getElementById('interest');
    let period = document.getElementById('period');
    let zipcode = document.getElementById('zipcode');
    
    if( isNaN( amount.value ) || amount.value <= 0 )
    {
        alert( "Please provide a positive number for Amount." );        
        amount.focus();
        amount.value = 0;
        return false;
    }

    if( isNaN( interest.value ) || interest.value <= 0)
    {
        alert( "Please provide a positive number for Annual Interest." );
        interest.focus();
        interest.value = 0;
        return false;
    }

    if( isNaN(period.value ) || period.value <= 0)
    {
        alert( "Please provide a positive number for repayment period." );
        period.focus();
        period.value = 0;
        return false;
    }

    if( isNaN( zipcode.value) || zipcode.value < 0 || (zipcode.value && zipcode.value.length != 5) )
    {
        alert( "Please provide a zip in the format #####." );
        zipcode.focus();
        zipcode.value = "";
        return false;
    }

    return true;
}

function calculate() {
    if (!validate())
        return false;

    let amount = document.getElementById("amount").value;
    amount = parseFloat(amount);     

    //convert the yearly interest integer to monthly interest percentage
    let yearInterest = document.getElementById("interest").value;
    let interest = parseFloat(yearInterest)/100/12;    

    let years = document.getElementById("period").value;    
    months = parseFloat(years) * 12;    

    let zipcode = document.getElementById("zipcode").value;
    let zipcodeValue = parseInt(zipcode);

    let monthly = document.getElementById("monthly");
    let total = document.getElementById("total");    
    let totalInterest = document.getElementById("totalInterest");
        
    let compoundInterest = Math.pow(1+interest, months);               
       
    monthlyPayment = (amount * compoundInterest * interest) / (compoundInterest - 1);
    let totalPayment = monthlyPayment * months;
    let totalInterestPayment = totalPayment - amount;

    // the output is rounded to the format of .xx (two decimal)
    if (monthlyPayment && isFinite(monthlyPayment)) {
        monthly.innerHTML = monthlyPayment.toFixed(2);
        total.innerHTML = totalPayment.toFixed(2);
        totalInterest.innerHTML = totalInterestPayment.toFixed(2);
    } else {
        monthly.innerHTML = "";
        total.innerHTML = "";
        totalInterest.innerHTML = "";
    }
   
    saveToLocal(amount, yearInterest, years, zipcodeValue);
    chart(amount, interest, monthlyPayment, months); 
        
    if (zipcodeValue) 
        getLenders(zipcodeValue);
}

function saveToLocal(amount, interest, years, zipcode) {    
    if (store) {
        store.loan_amount = amount;
        store.loan_interest = interest;
        store.loan_years = years;
        store.loan_zipcode = (zipcode? zipcode:"");
    }
}

window.onload = function () {
    //save the value on local storage    
    if (store && store.loan_amount && store.loan_years) {
        document.getElementById("amount").value = store.loan_amount;
        document.getElementById("interest").value = store.loan_interest;
        document.getElementById("period").value = store.loan_years;
        document.getElementById("zipcode").value = store.loan_zipcode;
    } else {
        document.getElementById("amount").value = 0;
        document.getElementById("interest").value = 0;
        document.getElementById("period").value = 0;
        document.getElementById("zipcode").value = 0;
    }    
};

function paymentToX(payPeriod) { 
    return payPeriod * width / months;      
}

function amountToY(payment) { 
    return height - (payment * height / (monthlyPayment * months * 1.05)); 
}

//draw chart with HTML5 canvas
function chart(principal, interest, monthlyPayment, months) {    
    let thisMonthsInterest = 0;

    if (arguments.length === 0 || !graph.getContext) {
        g.clearRect(0, 0, width, height);
    }    
    
   // darw tatal interest payments in blue
    g.beginPath();
    g.moveTo(paymentToX(0), amountToY(0));
    g.lineTo(paymentToX(months), amountToY(monthlyPayment * months));
    //g.lineTo(paymentToX(months), amountToY(0));
    g.lineWidth = 2;
    g.closePath();    
    g.strokeStyle = 'blue';
    g.stroke();    
    g.fillStyle = "blue";
    g.fill();  
    g.font = "bold 12 px sans-serif";
    g.fillText("Total Interest Payments", 20,20);

    // draw equity in brown color
    var equity = 0;
    g.beginPath();
    g.moveTo(paymentToX(0), amountToY(0));
    for(let p = 1; p <= months; p++) {
        thisMonthsInterest = (principal-equity)*interest;
        equity += (monthlyPayment - thisMonthsInterest);
        g.lineTo(paymentToX(p),amountToY(equity));
    }
    g.lineWidth = 3;   
    g.closePath();
    g.fillStyle = "brown";
    g.fill();
    g.fillText("Total Equity", 20,35);
    
    // draw loan balance in black
    var bal = principal;
    g.beginPath();
    g.moveTo(paymentToX(0),amountToY(bal));
    for(let p = 1; p <= months; p++) {
        thisMonthsInterest = bal*interest;
        bal -= (monthlyPayment - thisMonthsInterest);
        g.lineTo(paymentToX(p),amountToY(bal));
    }
    g.lineWidth = 3;
    g.strokeStyle = 'green';
    g.stroke();
    g.fillStyle = "green";
    g.fillText("Loan Balance", 20,50);     
}

function getRequest() {
    var request;
    if(window.XMLHttpRequest){
        request  = new XMLHttpRequest();      
    }else{
        request = new ActiveXObject();        
    }
    return request;
}

function getLenders(zipcode) {      
    let foundLender = false; 
    let xhrRequest = getRequest();    
    xhrRequest.open('GET', './data.json');
    xhrRequest.onload = function() {    
        if (xhrRequest.status >= 200 && xhrRequest.status < 400) {
            var myJSONData = JSON.parse(xhrRequest.responseText);            
            let outputHTML = '<ul>';
            myJSONData.forEach((ele, idx) => {
               if (ele['zipcode'].search(zipcode) != -1) {
                   if (!foundLender) {
                    foundLender = true;
                   }                        
                    outputHTML += `<li>
                    <p>Name: ${ele['name']}<br>
                     Address: ${ele['address']}<br>                 
                     Phone #: ${ele['phone']}</p>
                 </li>`;
               }                   
            });                        

            if (!foundLender) {
                outputHTML += "Sorry, cannot find any lender in that zipcode";
            }

            outputHTML += '</ul>';            
            document.querySelector('#lenders').innerHTML = outputHTML;              
        } else {
            console.log("we connected to the server, but it returned an error");
        }        
    };

    xhrRequest.onerror = function(){
        console.log("connection error");
    };
    xhrRequest.send();  
}
