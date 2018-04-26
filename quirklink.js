//var quirkLink = "http://algassert.com/quirk#";
var quirkLink = "quirk-big-circuits.html#"

var otherGatesJSON = ",\"gates\":[{\"id\":\"~fp6j\",\"name\":\"iA\",\"matrix\":\"{{0,1},{1,0}}\"},{\"id\":\"~3mtv\",\"name\":\"M+\",\"matrix\":\"{{0,1},{1,0}}\"}]";
//http://algassert.com/quirk#circuit={%22cols%22:[[%22X%22,%22X%22],[%22inputA1%22,%22inputB1%22,%22+=AB1%22]]}
//"gates":[{"id":"~fp6j","name":"iA","matrix":"{{0,1},{1,0}}"},{"id":"~3mtv","name":"M+","matrix":"{{0,1},{1,0}}"}]}

// the character used by quirk for control
var initABasisString = "~fp6j";
var measXBasisString = "~3mtv";
var controlString = "\u2022";
var tGateString = "Z^\u00BC";
var pGateString = "Z^\u00BD";
var vGateString = "X^\u00BD";
var xGateString = "X";
var hGateString = "H";

function addEmptyCircuitColumn(circuit)
{
    var nc = new Array();
    for(var j = 0; j < toolParameters.nrVars; j++)
        nc.push(1);

    circuit.push(nc);
}

function checkCircuitLengthAndCorrect(circuit, required)
{
    if(circuit.length <= required)
    {
        var dif = required - circuit.length + 1;
        for(var i=0; i<dif; i++)
            addEmptyCircuitColumn(circuit);
    }
}

function scheduleGateList(nGateList)
{
    computeFirstWireUsage(nGateList);

    resetAvailableDistilledState();

    var timeStep = -1;
    var newCommands = new Array();//used for sched circ. one gate per line in file

    for (var i = 0; i < nGateList.length - 3; i++)
    {
        timeStep++;

        //skip the first three lines
        //because they are nrVars, inputs and outputs

        var parsedGate = parseUnscheduledGateString(nGateList[i + 3]);

        timeStep += parsedGate.deltaTime;

        var stopDistillations = updateAvailableDistilledStates(timeStep);
        if(stopDistillations)
        {
            newCommands.push("%" + timeStep + "@distoff");
        }

        if(parsedGate.gateType[0] == 'K' || parsedGate.gateType[0] == 'U')
        {
            var a1 = getWireNumber(Number(parsedGate.wires[0]));
            var b1 = getWireNumber(Number(parsedGate.wires[1]));
            var ab1 = getWireNumber(Number(parsedGate.wires[2]));

            var newCommand = parsedGate.gateType[0] + " " + a1 + " " + b1 + " " + ab1;
            newCommands.push(timeStep + "@" + newCommand);
        }
        else
        {
            var newCommandBegin = "" + parsedGate.gateType[0];

            var fromWhere = 0;
            switch (parsedGate.gateType[0]) {
                case "c":
                    var ctr = getWireNumber(Number(parsedGate.wires[0]));
                    fromWhere = 1;

                    newCommandBegin = "c " + ctr;
                    newCommands.push(timeStep + "@" + newCommandBegin);
                    break;
                case "p":
                    break;
                case "h":
                    break;
                case "t":
                    //returnObj.nrTGates += commandSplits.length - 1;
                    // returnObj.nrTGates += parsedGate.wires.length;
                    break;
                case "v":
                    break;
                case "i"/*"ix"*/:
                    newCommandBegin = "a";
                    // returnObj.nrTGates++;
                    break;
                case "m"/*"mx"*/:
                    newCommandBegin = "m";
                    break;
            }
            /*
             * The problem is if T gates and A initialisations can be placed
             * This depends on the availability of distilled A states
             */

            if(toolParameters.delayTGates
                && (parsedGate.gateType[0] == 't' || parsedGate.gateType[0] == 'i'))
            {
                var howmany = parsedGate.wires.length - fromWhere;
                for(var hi = 0; hi < howmany; hi++)
                {
                    /*
                        At this point distilled states are added and consumed one at a time
                        So, I assume it is not possible to fill the buffer
                     */
                    while (!checkAvailableDistilledState())
                    {
                        timeStep++;
                        updateAvailableDistilledStates(timeStep);
                    }
                    var proceedWithDistillation = consumeDistilledState();
                    if(proceedWithDistillation)
                    {
                        newCommands.push("%" + timeStep + "@diston");
                    }
                }
            }

            for(var kk = fromWhere; kk < parsedGate.wires.length; kk++)
            {
                var tgt = getWireNumber(Number(parsedGate.wires[kk]));

                if(parsedGate.gateType[0] == 'c')
                {
                    //this gate is allowed multiple targets
                    newCommands[newCommands.length - 1] += " " + tgt;
                }
                else
                {
                    //single qubit gates are one per line
                    var newCommand = newCommandBegin + " " + tgt;
                    newCommands.push(timeStep + "@" + newCommand);
                }
            }
        }
    }

    return newCommands;
}


function constructQuirkLink(nGateList)
{
    var returnObj = [];
    returnObj.link = quirkLink;

    var circuit = new Array();

    for (var i = 0; i < nGateList.length; i++)
    {
        var parsedGate = parseScheduledGateString(nGateList[i]);

        if(parsedGate.isComment)
            continue;

        if(!toolParameters.noVisualisation)
            checkCircuitLengthAndCorrect(circuit, parsedGate.timeStep);

        if(parsedGate.gateType[0] == 'K' || parsedGate.gateType[0] == 'U')
        {
            var a1 = getWireNumber(Number(parsedGate.wires[0]));
            var b1 = getWireNumber(Number(parsedGate.wires[1]));
            var ab1 = getWireNumber(Number(parsedGate.wires[2]));

            if(!toolParameters.noVisualisation)
            {
                circuit[parsedGate.timeStep][a1] = "inputA1";
                circuit[parsedGate.timeStep][b1] = "inputB1";
                circuit[parsedGate.timeStep][ab1] = parsedGate.gateType[0] == 'K' ? "+=AB1" : "-=AB1";
            }
        }
        else
        {
            var quirkGateType = "";
            var fromWhere = 0;
            switch (parsedGate.gateType[0]) {
                case "c":
                    var ctr = getWireNumber(Number(parsedGate.wires[0]));
                    if(!toolParameters.noVisualisation)
                        circuit[parsedGate.timeStep][ctr] = controlString;
                    quirkGateType = "X";//allow only CX for the moment
                    fromWhere = 1;
                    break;
                case "p":
                    quirkGateType = pGateString;
                    break;
                case "h":
                    quirkGateType = hGateString;
                    break;
                case "t":
                    quirkGateType = tGateString;
                    break;
                case "v":
                    quirkGateType = vGateString;
                    break;
                case "a"/*"ix"*/:
                    quirkGateType = initABasisString;
                    break;
                case "m"/*"mx"*/:
                    quirkGateType = measXBasisString;
                    break;
            }

            for(var kk = fromWhere; kk < parsedGate.wires.length; kk++)
            {
                var tgt = getWireNumber(Number(parsedGate.wires[kk]));

                if(!toolParameters.noVisualisation)
                {
                    circuit[parsedGate.timeStep][tgt] = quirkGateType;
                }
            }
        }
    }

    if(!toolParameters.noVisualisation)
    {
        if(toolParameters.decomposeCliffordT)
            insertDistillationSpacers(circuit, toolParameters.distillationLength, analysisData.nrTGates);
        cleanUselessOnes(circuit);
        returnObj.link += "circuit={\"cols\":" + JSON.stringify(circuit) + otherGatesJSON + "}";
    }
    else
    {
        returnObj.link += "NO_VISUALISATION";
    }

    return returnObj;
}

function cleanUselessOnes(circuit)
{
    for(var i=0; i<circuit.length; i++)
    {
        var fromWhere = circuit[i].length - 1;
        while(circuit[i][fromWhere] == 1)
        {
            fromWhere--;
        }
        circuit[i].splice(fromWhere + 1);

        if(circuit[i].length == 0)
        {
            circuit.splice(i, 1);
            i--;
        }
    }
}

function insertDistillationSpacers(circuit, distance, nrTGates)
{
    /*
     Insert \ldots where distillations are placed and a 0 where two distillations are separated
     */
    var next = -1;
    for(var ti = 0; ti < nrTGates; ti++)
    {
        for(var i = 1; i <= distance; i++)
        {
            var insert = "\u2026";
            if(i % distance == 0)
                insert = "0";

            next++;

            if(next == circuit.length)
            {
                //too much
                return;
            }

            circuit[next].splice(0, 0, insert);
        }
    }

    for(var i = next + 1; i < circuit.length; i++)
    {
        circuit[i].splice(0, 0, 1);
    }
}

function removeDistillationSpacers(circuit)
{
    var nrVars = -1;
    /*
     Remove the first elements \ldots and 0
     */
    for(var i=0; i < circuit.length; i++)
    {
        circuit[i].splice(0, 1);

        if(circuit[i].length > nrVars)
        {
            nrVars = circuit[i].length;
        }
    }

    return nrVars;
}

function parseLink()
{
    /*
     works only for Clifford + T
     */

    var link = document.getElementById("quirkLink").value;

    //for test purposes
    var backUpLink = link;

    //remove first part of link
    link = link.replace(quirkLink+"circuit=", "");
    //remove last }
    link = link.slice(0, -1);

    //this is a JSON
    var circobj = JSON.parse(link);
    //get the columns
    var circuit = circobj.cols;

    //now I have the circuit
    //remove the spacers
    var nNrVars = removeDistillationSpacers(circuit);
    //console.log(circuit);
    console.log(nNrVars);

    gateList = [ ];
    writeFileHeader(nNrVars);


    var nrTimeSlices = circuit.length;
    console.log(nrTimeSlices);

    for(var i=0; i<circuit.length; i++)
    {
        var controlPosition = -1;

        var xTargets = new Array();
        var tGates = new Array();
        var pGates = new Array();
        var vGates = new Array();
        var hGates = new Array();
        var initX = new Array();
        var measX = new Array();

        for(var j=0; j<circuit[i].length; j++)
        {
            switch(circuit[i][j])
            {
                case 1:
                    break;
                case controlString:
                    controlPosition = j;
                    break;
                case xGateString:
                    xTargets.push(j);
                    break;
                case tGateString:
                    tGates.push(j);
                    break;
                case pGateString:
                    pGates.push(j);
                    break;
                case hGateString:
                    hGates.push(j);
                    break;
                case vGateString:
                    vGates.push(j);
                    break;
                case initABasisString:
                    initX.push(j);
                    break;
                case measXBasisString:
                    measX.push(j);
                    break;
            }
        }

        if(controlPosition != -1)
        {
            //there is CX
            placeCX(controlPosition, xTargets);
        }

        //do not introduce corrections for the T gate
        //because I am assuming these are already in circuit
        placeT(false, tGates);
        placeGate("p", pGates);
        placeGate("h", hGates);
        placeGate("v", vGates);
        placeGate("ix", initX);
        placeGate("mx", measX);
    }

    constructQuirkLink();
    console.log(document.getElementById("quirkLink").value == backUpLink);
}

function getLinkFromIFrame()
{
    var tmp = decodeURIComponent(document.getElementById("quirkiframe").contentWindow.location.href);

    var idx = tmp.indexOf(quirkLink);
    if(idx > 0)
    {
        tmp = tmp.substr(idx);
    }

    document.getElementById("quirkLink").value = tmp;
}

function setLink(event)
{
    document.getElementById("quirkiframe").contentWindow.location.href = decodeURIComponent(event.currentTarget.href);

    /*
        I tried everything to cancel event handling
     */
    event.preventDefault();
    event.returnValue = false;
    return false;
}

function deleteFromMemory(id)
{
    var elem = document.getElementById(id);
    elem.parentNode.removeChild(elem);
}


function saveToMemory()
{
    var link = document.getElementById("quirkLink").value;
    var linkid = "saved" + Date.now();
    var msg = "<div id=\"" +  linkid+ "\">";
    msg += "<a onclick=\"setLink(event)\" href=\"" + encodeURIComponent(link) + "\">" + linkid + "</a>";
    msg += "<span onclick=deleteFromMemory(\"" + linkid + "\") style=\"cursor:pointer\">[X]</span>";
    msg += "</div>";

    document.getElementById("Memory").innerHTML += msg;
}