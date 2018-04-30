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

function arrangeDecomposedCircuit(nGateList)
{
    computeFirstWireUsage(nGateList);

    var timeStep = -1;
    var newCommands = new Array();//used for sched circ. one gate per line in file

    //skip the first three lines
    //because they are nrVars, inputs and outputs
    newCommands.push(nGateList[0]);
    newCommands.push(nGateList[1]);
    newCommands.push(nGateList[2]);

    for (var i = 3; i < nGateList.length; i++)
    {
        timeStep++;

        var parsedGate = parseUnscheduledGateString(nGateList[i]);

        timeStep += parsedGate.deltaTime;

        var scheduledGate = constructEmptyScheduledGate();
        scheduledGate.timeStep = timeStep;
        scheduledGate.gateType = parsedGate.gateType[0];

        for(var j=0; j<parsedGate.wires.length; j++)
        {
            scheduledGate.wires.push(Number(parsedGate.wires[j]));
        }

        switch (parsedGate.gateType[0]) {
            case "c":
                scheduledGate.gateType = "c";
                break;
            case "p":
                break;
            case "h":
                break;
            case "t":
                break;
            case "v":
                break;
            case "i"/*"ix"*/:
                scheduledGate.gateType = "a";
                break;
            case "m"/*"mx"*/:
                scheduledGate.gateType = "m";
                break;
            case "K":
                break;
            case "U":
                break;
        }

        newCommands.push(toStringScheduledGate(scheduledGate));
    }

    return newCommands;
}

function scheduleGateList(nGateList, nrTGates)
{
    resetAvailableDistilledState();
    maxNrAToGenerate = nrTGates;
    console.log(nrTGates);

    var newCommands = new Array();//used for sched circ. one gate per line in file
    newCommands.push(nGateList[0]);
    newCommands.push(nGateList[1]);
    newCommands.push(nGateList[2]);

    var accumulatedTimeStepIncrement = 0;

    for (var i = 3; i < nGateList.length; i++)
    {
        //skip the first three lines
        //because they are nrVars, inputs and outputs

        var parsedGate = parseScheduledGateString(nGateList[i]);

        var timeStep = parsedGate.timeStep;
        var distillationResult = DistillationResult.WORKING;
        var consumeResult = DistillationResult.DONTCARE;

        distillationResult = updateAvailableDistilledStates(timeStep + accumulatedTimeStepIncrement);
        /*
            AppendChartData is performed after a potential consume
         */
        if((parsedGate.gateType[0] == 't' || parsedGate.gateType[0] == 'a'))
        {
            //can I consume?
            var howmany = parsedGate.wires.length;
            for(var hi = 0; hi < howmany; hi++)
            {
                var ntimeStep = timeStep + accumulatedTimeStepIncrement;

                while (!checkAvailableDistilledState()) {

                    appendChartData(ntimeStep, distillationResult);

                    accumulatedTimeStepIncrement++;
                    ntimeStep = timeStep + accumulatedTimeStepIncrement;

                    distillationResult = updateAvailableDistilledStates(ntimeStep);
                }

                // a consume takes always? the distillation factory in the working/distilled state
                //I can consume
                consumeResult = consumeDistilledState(ntimeStep);
                if(distillationResult == DistillationResult.STOPNOW)
                    appendChartData(ntimeStep, DistillationResult.DISTILLED);
                /*else if (distillationResult == DistillationResult.STOPPED)
                    appendChartData(ntimeStep, DistillationResult.WORKING);
                */else
                    appendChartData(ntimeStep, distillationResult);
            }
        }
        else
        {
            appendChartData(timeStep + accumulatedTimeStepIncrement, distillationResult);
        }

        /*
            This is related to what to write in the gate list
         */
        if(consumeResult == DistillationResult.STARTNOW)
        {
            if(distillationResult != DistillationResult.STOPNOW)
            {
                newCommands.push("%" + timeStep + "@diston");
            }
        }
        else
        {
            if(distillationResult = DistillationResult.STOPNOW)
            {
                newCommands.push("%" + timeStep + "@distoff");
            }
        }

        //update the timestep of this gate
        parsedGate.timeStep += accumulatedTimeStepIncrement;
        newCommands.push(toStringScheduledGate(parsedGate));
    }

    return newCommands;
}


function constructQuirkLink(nGateList, analysisData)
{
    var returnObj = [];
    returnObj.link = quirkLink;

    var circuit = new Array();

    //first three are file header
    for (var i = 3; i < nGateList.length; i++)
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
        if(toolParameters.decomposeCliffordT && toolParameters.distillAndConsumeTStates)
            insertDistillationSpacers(circuit,
                toolParameters.distillationLength,
                analysisData.nrTGates);
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
    for(var i=0; i<aStatesData.separators.length; i++)
    {
        var insert = "";//distill
        switch(aStatesData.separators[i])
        {
            case DistillationResult.WORKING:
                insert = "\u2026";
                break;
            case DistillationResult.DISTILLED:
            case DistillationResult.STOPNOW:
                insert = "0";
                break;
            case DistillationResult.STOPPED:
                insert = "NeGate";
                break;
        }

        circuit[i].splice(0, 0, insert);
    }
    for(var i = aStatesData.separators.length; i < circuit.length; i++)
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