function QuirkLink()
{

}

QuirkLink.quirkLink = "quirk-big-circuits.html#";

// the character used by quirk for control
QuirkLink.initABasisString = "~fp6j";
QuirkLink.measXBasisString = "~3mtv";
QuirkLink.controlString = "\u2022";
QuirkLink.antiControlString = "\u25E6";
QuirkLink.eightGateString = "Z^\u215B";
QuirkLink.tGateString = "Z^\u00BC";
QuirkLink.pGateString = "Z^\u00BD";
QuirkLink.vGateString = "X^\u00BD";
QuirkLink.xGateString = "X";
QuirkLink.hGateString = "H";

QuirkLink.otherGates = undefined;

//var quirkLink = "http://algassert.com/quirk#";

//var otherGatesJSON = ",\"gates\":[{\"id\":\"~fp6j\",\"name\":\"iA\",\"matrix\":\"{{0,1},{1,0}}\"},{\"id\":\"~3mtv\",\"name\":\"M+\",\"matrix\":\"{{0,1},{1,0}}\"}]";
//http://algassert.com/quirk#circuit={%22cols%22:[[%22X%22,%22X%22],[%22inputA1%22,%22inputB1%22,%22+=AB1%22]]}
//"gates":[{"id":"~fp6j","name":"iA","matrix":"{{0,1},{1,0}}"},{"id":"~3mtv","name":"M+","matrix":"{{0,1},{1,0}}"}]}

QuirkLink.cleanOtherGatesJSON = function()
{
    this.otherGates = {gates : []};

    this.addGateToOtherGatesJSON("~fp6j", "iA");
    this.addGateToOtherGatesJSON("~3mtv", "M+");
}

QuirkLink.generateOtherGatesJSON = function()
{
    var ret = JSON.stringify(this.otherGates);

    return "," + ret.substring(1, ret.length - 1);
}

QuirkLink.addGateToOtherGatesJSON = function(id, name)
{
    var ngate = {id : id,
        name: name,
        matrix : "{{0,1},{1,0}}"//dummy matrix for the moment
    };

    //check that the matrix id is not in the collection

    if( ! this.otherGates.gates.find(function(f){ return f.id == ngate.id}))
    {
        this.otherGates.gates.push(ngate);
    }
}

QuirkLink.addRotationToOtherGatesJSON = function(piFraction, pauliName)
{
    if(pauliName == undefined)
        pauliName = "Z";

    var newId = undefined;
    var newName = undefined;

    switch(Math.abs(piFraction))
    {
        case 1:
            newId = "Z";
            break;
        case 2:
            newId = QuirkLink.pGateString;
            break;
        case 3:
            newId = QuirkLink.tGateString;
            break;
        case 4:
            newId = QuirkLink.eightGateString;
            break;
        default:
            newId = "Z^\u215F" + Math.pow(2, Math.abs(piFraction))/2;
            newName = newId;
            break;
    }

    //Negative Rotations
    if(piFraction < 0)
    {
        newId = newId.replace("^", "^-");
    }

    /*
     The strings stored in QuirkLink are for Z
     It is possible to replace them to get a different Pauli fraction rotation
     */
    if(pauliName != "Z")
    {
        console.log("quirk replace: " + newId);
        newId = newId.replace("Z", pauliName);
    }

    /*
        This gate does not exist in Quirk
     */
    if (newName != undefined)
    {
        newName = newId;//maybe it was changed before
        newId = "~" + newId;
        this.addGateToOtherGatesJSON(newId, newName);
    }

    return newId;
}

QuirkLink.addEmptyCircuitColumn = function (circuit, localNrVars)
{
    var nc = new Array();
    for(var j = 0; j < localNrVars; j++)
        nc.push(1);

    circuit.push(nc);
}

QuirkLink.checkCircuitLengthAndCorrect = function(circuit, required, localNrVars)
{
    if(circuit.length <= required)
    {
        var dif = required - circuit.length + 1;
        for(var i=0; i<dif; i++)
            this.addEmptyCircuitColumn(circuit, localNrVars);
    }
}

function arrangeDecomposedCircuit(nGateList, wireOrder)
{
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

        var parsedGate = UnscheduledGate.parseUnscheduledGateString(nGateList[i]);

        timeStep += parsedGate.deltaTime;

        var scheduledGate = new ScheduledGate();
        scheduledGate.timeStep = timeStep;
        scheduledGate.gateType = parsedGate.gateType;//[0];

        for(var j=0; j<parsedGate.wires.length; j++)
        {
            //scheduledGate.wires.push(Number(parsedGate.wires[j]));
            var newWireNumber = wireOrder.getWireNumber(Number(WireUtils.eliminateWireNegation(parsedGate.wires[j])));
            scheduledGate.wires.push(newWireNumber);
        }

        switch (parsedGate.gateType[0]) {
            case "c":
                //scheduledGate.gateType = "c";
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
            case "C":
                //scheduledGate.gateType = parsedGate.gateType;
                break;
        }

        newCommands.push(scheduledGate.toString());
    }

    return newCommands;
}

function scheduleGateList(nGateList, nrTGates)
{
    resetAvailableDistilledState();
    maxNrAToGenerate = nrTGates;

    var newCommands = new Array();//used for sched circ. one gate per line in file
    newCommands.push(nGateList[0]);
    newCommands.push(nGateList[1]);
    newCommands.push(nGateList[2]);

    var accumulatedTimeStepIncrement = 0;

    //skip the first three lines
    //because they are nrVars, inputs and outputs
    var prevTimeStep = -1;
    var distillationResult = DistillationResult.WORKING;
    var consumeResult = DistillationResult.DONTCARE;

    for (var i = 3; i < nGateList.length; i++)
    {
        var parsedGate = ScheduledGate.parseScheduledGateString(nGateList[i]);

        var timeStep = parsedGate.timeStep;
        var ntimeStep = timeStep + accumulatedTimeStepIncrement;

        /*
         This is related to what to write in the gate list
         */
        if(prevTimeStep != ntimeStep)
        {
            if (consumeResult == DistillationResult.STARTNOW) {
                if (distillationResult != DistillationResult.STOPNOW) {
                    newCommands.push("%" + prevTimeStep + "@diston");

                    console.log("DISTON when " + distillationResult);
                }
            }
            else
            {
                if (distillationResult == DistillationResult.STOPNOW) {
                    newCommands.push("%" + prevTimeStep + "@distoff");
                }
            }

            distillationResult = DistillationResult.WORKING;
            consumeResult = DistillationResult.DONTCARE;
        }

        distillationResult = updateAvailableDistilledStates(ntimeStep);
        /*
            AppendChartData is performed after a potential consume
         */
        if((parsedGate.gateType[0] == 't' || parsedGate.gateType[0] == 'a'))
        {
            //can I consume?
            var howmany = parsedGate.wires.length;
            for(var hi = 0; hi < howmany; hi++)
            {
                while (!checkAvailableDistilledState())
                {
                    accumulatedTimeStepIncrement++;
                    ntimeStep = timeStep + accumulatedTimeStepIncrement;

                    distillationResult = updateAvailableDistilledStates(ntimeStep);
                }

                consumeResult = consumeDistilledState(ntimeStep);
            }
        }

        //update the timestep of this gate
        parsedGate.timeStep += accumulatedTimeStepIncrement;
        prevTimeStep = parsedGate.timeStep;

        newCommands.push(parsedGate.toString());
    }

    return newCommands;
}


QuirkLink.constructQuirkLink = function(nGateList, analysisData)
{
    this.cleanOtherGatesJSON();

    var returnObj = [];
    returnObj.link = this.quirkLink;

    var circuit = new Array();

    //the same trick with reading the number of vars from the first line
    var localNrVars = Number(nGateList[0].split(" ")[1]);

    //first three are file header
    for (var i = 3; i < nGateList.length; i++)
    {
        var parsedGate = ScheduledGate.parseScheduledGateString(nGateList[i]);

        if(parsedGate.isComment)
            continue;

        if(!toolParameters.noVisualisation)
            this.checkCircuitLengthAndCorrect(circuit, parsedGate.timeStep, localNrVars);

        if(parsedGate.gateType[0] == 'K' || parsedGate.gateType[0] == 'U')
        {
            var a1 = Number(WireUtils.eliminateWireNegation(parsedGate.wires[0]));
            var b1 = Number(WireUtils.eliminateWireNegation(parsedGate.wires[1]));
            var ab1 = Number(WireUtils.eliminateWireNegation(parsedGate.wires[2]));

            if(!toolParameters.noVisualisation)
            {
                circuit[parsedGate.timeStep][a1] = "inputA1";
                circuit[parsedGate.timeStep][b1] = "inputB1";
                circuit[parsedGate.timeStep][ab1] = parsedGate.gateType[0] == 'K' ? "+=AB1" : "-=AB1";
            }
        }
        else if(parsedGate.gateType[0] == 'C')
        {
            /*
            This is used in QROM, and I do not modify it for the time being
             */
            var nsplit = parsedGate.gateType.split("_");
            var nr1 = Number(nsplit[1]);
            var nr2 = Number(nsplit[2]);

            for(var ci=0; ci<nr1; ci++) {
                var wire = parsedGate.wires[ci];
                var qComm = this.controlString;
                if(WireUtils.isNegatedWire(wire)) {
                    qComm = this.antiControlString;
                    // wire = eliminateWireNegation(wire);
                }
                circuit[parsedGate.timeStep][WireUtils.eliminateWireNegation(wire)] = qComm;//"dec1"
            }

            //after rep qubits
            var afterRepQ = nr1 + nr1 - 1;
            for(var ci=afterRepQ; ci<afterRepQ + nr2; ci++) {
                circuit[parsedGate.timeStep][ci] = "X";
            }
        }
        else if(parsedGate.gateType[0] == 'X' || parsedGate.gateType[0] == 'Y' || parsedGate.gateType[0] == 'Z')
        {
            /*
             This is used in QFTAdder
             */
            var nsplit = parsedGate.gateType.split("_");
            var nr1 = Number(nsplit[1]);
            var nr2 = Number(nsplit[2]);
            var nr3 = Number(nsplit[3]);//the pi fraction


            var rotId = this.addRotationToOtherGatesJSON(nr3, parsedGate.gateType[0]+"");

            for(var ci=0; ci<nr1; ci++)
            {
                var wire = parsedGate.wires[ci];
                var qComm = this.controlString;
                if(WireUtils.isNegatedWire(wire)) {
                    qComm = this.antiControlString;
                    wire = WireUtils.eliminateWireNegation(wire);
                }
                circuit[parsedGate.timeStep][wire] = qComm;//"dec1"
            }

            //after rep qubits
            var targetsStart = nr1;
            for(var ci=targetsStart; ci<parsedGate.wires.length; ci++) {
                var wire = parsedGate.wires[ci];
                circuit[parsedGate.timeStep][wire] = rotId;
            }
        }
        else
        {
            var quirkGateType = "";
            var fromWhere = 0;
            switch (parsedGate.gateType[0]) {
                case "c":
                    var ctr = Number(parsedGate.wires[0]);
                    if(!toolParameters.noVisualisation)
                        circuit[parsedGate.timeStep][ctr] = this.controlString;
                    quirkGateType = "X";//allow only CX for the moment
                    fromWhere = 1;
                    break;
                case "p":
                    quirkGateType = this.pGateString;
                    break;
                case "h":
                    quirkGateType = this.hGateString;
                    break;
                case "t":
                    quirkGateType = this.tGateString;
                    break;
                case "v":
                    quirkGateType = this.vGateString;
                    break;
                case "a"/*"ix"*/:
                    quirkGateType = this.initABasisString;
                    break;
                case "m"/*"mx"*/:
                    quirkGateType = this.measXBasisString;
                    break;
            }

            for(var kk = fromWhere; kk < parsedGate.wires.length; kk++)
            {
                var tgt = Number(parsedGate.wires[kk]);

                if(!toolParameters.noVisualisation)
                {
                    console.log(parsedGate.timeStep + " " + tgt + "...." + parsedGate.toString());
                    circuit[parsedGate.timeStep][tgt] = quirkGateType;
                }
            }
        }
    }

    if(!toolParameters.noVisualisation)
    {
        if(toolParameters.decomposeCliffordT && toolParameters.distillAndConsumeTStates)
            this.insertDistillationSpacers(circuit,
                toolParameters.distillationLength,
                analysisData.nrTGates);
        this.cleanUselessOnes(circuit);
        returnObj.link += "circuit={\"cols\":" + JSON.stringify(circuit) + this.generateOtherGatesJSON() + "}";
    }
    else
    {
        returnObj.link += "NO_VISUALISATION";
    }

    return returnObj;
}

QuirkLink.cleanUselessOnes = function(circuit)
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

QuirkLink.insertDistillationSpacers = function(circuit, distance, nrTGates)
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

QuirkLink.removeDistillationSpacers = function(circuit)
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

/*
    Does not handle custom gates and adding them to the dictionary
 */
QuirkLink.parseLink = function()
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
    var nNrVars = this.removeDistillationSpacers(circuit);
    //console.log(circuit);
    console.log(nNrVars);

    // gateList = [];
    // writeFileHeader(nNrVars);

    var gatePl = new GatePlacer(toolParameters);

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
                case this.controlString:
                    controlPosition = j;
                    break;
                case this.xGateString:
                    xTargets.push(j);
                    break;
                case this.tGateString:
                    tGates.push(j);
                    break;
                case this.pGateString:
                    pGates.push(j);
                    break;
                case this.hGateString:
                    hGates.push(j);
                    break;
                case this.vGateString:
                    vGates.push(j);
                    break;
                case this.initABasisString:
                    initX.push(j);
                    break;
                case this.measXBasisString:
                    measX.push(j);
                    break;
            }
        }

        if(controlPosition != -1)
        {
            //there is CX
            gatePl.placeCX(controlPosition, xTargets);
        }

        //do not introduce corrections for the T gate
        //because I am assuming these are already in circuit
        gatePl.placeT(false, tGates);
        gatePl.placeGate("p", pGates);
        gatePl.placeGate("h", hGates);
        gatePl.placeGate("v", vGates);
        gatePl.placeGate("ix", initX);
        gatePl.placeGate("mx", measX);
    }

    this.constructQuirkLink();
    console.log(document.getElementById("quirkLink").value == backUpLink);
}

QuirkLink.getLinkFromIFrame = function()
{
    var tmp = decodeURIComponent(document.getElementById("quirkiframe").contentWindow.location.href);

    var idx = tmp.indexOf(this.quirkLink);
    if(idx > 0)
    {
        tmp = tmp.substr(idx);
    }

    document.getElementById("quirkLink").value = tmp;
}

QuirkLink.setLink = function(event)
{
    document.getElementById("quirkiframe").contentWindow.location.href = decodeURIComponent(event.currentTarget.href);

    /*
        I tried everything to cancel event handling
     */
    event.preventDefault();
    event.returnValue = false;
    return false;
}

QuirkLink.deleteFromMemory = function(id)
{
    var elem = document.getElementById(id);
    elem.parentNode.removeChild(elem);
}


QuirkLink.saveToMemory = function()
{
    var link = document.getElementById("quirkLink").value;
    var linkid = "saved" + Date.now();
    var msg = "<div id=\"" +  linkid+ "\">";
    msg += "<a onclick=\"QuirkLink.setLink(event)\" href=\"" + encodeURIComponent(link) + "\">" + linkid + "</a>";
    msg += "<span onclick=QuirkLink.deleteFromMemory(\"" + linkid + "\") style=\"cursor:pointer\">[X]</span>";
    msg += "</div>";

    document.getElementById("generatorMemory").innerHTML += msg;
}