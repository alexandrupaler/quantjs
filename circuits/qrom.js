/**
 * Generate a total control circuit
 * @param maxIndex
 */
function generateTotalControl(maxIndex /*K*/) {
    //resets the global array. Not good.
    gateList = [];

    writeFileHeader(toolParameters.nrVars);

    var controlIndex = 0;

    //how many l qubits one needs for applying
    //controlled operations on maxIndex logical qubits
    var smallLQubits = Math.ceil(Math.log2(maxIndex));

    var nrControls = smallLQubits + 1;//because of the control qubit +1

    for (var i = 0; i < maxIndex; i++) {
        var binary = binaryRepresentation(i, smallLQubits);

        var gate = constructEmptyUnscheduledGate();
        gate.gateType = "C_" + nrControls + "_" + maxIndex;

        gate.wires.push(controlIndex);

        //for (var j = smallLQubits - 1; j >= 0; j--) {
        for (var j = 0; j<smallLQubits; j++) {
            //TODO: Da-i un numar
            var nextControl = 1 + j;
            if (binary[j] == 0) {
                nextControl = negateWire(nextControl);
            }
            gate.wires.push(nextControl);
        }

        //TODO: plec din start cu ideea ca numarul maxIndex se aplica asupra ultimilor
        //qubits cu X
        //gate += generateMultiQubitGate(maxIndex);
        gate.deltaTime = 0;
        if (toolParameters.decomposeCliffordT) {
            //TODO: adapt this parameter?
            gate.deltaTime = 0;
        }

        //gateList.push(toStringUnscheduledGate(gate));
        echo(toStringUnscheduledGate(gate));
    }

    console.log(gateList.length);
}

function deleteNegativeControls(nGateList)
{
    var ret = nGateList;

    var gate = parseUnscheduledGateString(nGateList[nGateList.length - 1]);

    var originalWires = gate.wires.slice();

    for(var i=0; i<originalWires.length; i++)
    {
        if(isNegatedWire(originalWires[i])) {

            // gate.wires.splice(i, 1);
            // ret[nGateList.length - 1] = toStringUnscheduledGate(gate);

            //check if the following gates have this negated wire too
            for (var j = nGateList.length - 2; j >= 3; j--) {
                var gate2 = parseUnscheduledGateString(nGateList[j]);

                //does this gate include the same negated wire?
                var indexFound = gate2.wires.indexOf(originalWires[i]);
                if (indexFound != -1) {
                    gate2.wires.splice(indexFound, 1);
                }
                else {
                    //this run needs to be ended
                    break;
                }

                ret[j] = toStringUnscheduledGate(gate2);
            }

            //remove from the current gate
            //this remove method does not keep the order of the wires
            // gate.wires[i] = gate.wires[gate.wires.length - 1];
            // gate.wires.pop();
            // i--;

            var iw = gate.wires.indexOf(originalWires[i]);
            gate.wires.splice(iw, 1);
        }
    }

    ret[nGateList.length - 1] = toStringUnscheduledGate(gate);

    return ret;
}

function decomposeToKAndU(nGateList)
{
    gateList = [];

    writeFileHeader(toolParameters.nrVars);

    var controlIndex = 0;

    var nrBits = Math.ceil(Math.log2(toolParameters.nrLogQubits));

    var rep = [];
    rep.push(controlIndex);
    for(var i=0; i<nrBits; i++)
        rep.push(1 + nrBits + i);

    var cxTargets = [];
    for(var i=0; i<toolParameters.nrLogQubits; i++)
    {
        cxTargets.push(1 + 2*nrBits + i);
    }

    for(var i=3; i<nGateList.length; i++)
    {
        var wires = parseUnscheduledGateString(nGateList[i]).wires;//get the gate control wires

        //is this still the control wire?
        // var prevControl = rep[0];//wires[0];//this is the control wire?

        //sequence of K gates
        //first wire is the control qubit
        var nwires = wires;
        nwires.splice(0, 1);

        for(var j = 0; j < nwires.length; j++)
        {
            var ka = rep[j];
            var kb = wires[j];
            // var kt = rep[j + 1];
            var kt = rep[eliminateWireNegation(kb)];

            var localDelay = 0;//-1;
            var whichDecomposition = 0;//toolParameters.decomposeCliffordT ? 1 : 0;
            placeK(ka, kb, kt, whichDecomposition, localDelay);
        }

        //the control from the last rep to the qubits
        var cxDelay = 0;
        // placeCX(rep[rep.length - 1], cxTargets, cxDelay);
        placeCX(rep[eliminateWireNegation(wires[wires.length - 1])], cxTargets, cxDelay);

        //sequence of U gates
        //first wire is the control qubit
        for(var j = nwires.length - 1; j>=0; j--)
        {
            var ka = rep[j];
            var kb = wires[j];
            //var kt = rep[j + 1];
            var kt = rep[eliminateWireNegation(kb)];

            var localDelay = 0;//-1;
            var whichDecomposition = 0;//toolParameters.decomposeCliffordT ? 1 : 0;
            placeU(ka, kb, kt, whichDecomposition, localDelay);
        }
    }
}

/**
 * Iterates through the gate list and applies the hardcoded templates when possible
 * @param nGateList
 * @returns {boolean} true if the template was applied at least once. false otherwise.
 */
function simplifyWithTemplates(nGateList)
{
    // do not use zero for templates
    // actually for wires it should not be used either
    // because - zero = zero
    //TODO: Template-urile nu sunt chiar asa generale precum as vrea
    //trebuie sa le fac permutari de fire ca sa le aplic

    var templates = [
        /*
            Equals cancel
         */
        [
            ["U 1 -2 3", "K 1 -2 3"],
            []
        ],
        [
            ["U -1 2 3", "K -1 2 3"],
            []
        ],
        [
            ["U 1 2 3", "K 1 2 3"],
            []
        ],
        [
            ["U -1 -2 3", "K -1 -2 3"],
            []
        ],
        /*
            Half & Half
         */
        [
            ["U 1 2 3", "K 1 -2 3"],
            ["cx 1 3"]
        ],
        [
            ["U 1 2 3", "K -1 2 3"],
            ["cx 2 3"]
        ],
        [
            ["U 1 -2 3", "K 1 2 3"],
            ["cx 1 3"]
        ],
        [
            ["U -1 2 3", "K 1 2 3"],
            ["cx 2 3"]
        ],
        /*
            Opposite
         */
        [
            ["U 1 2 3", "K -1 -2 3"],
            ["cx 1 3", "cx 2 3"]
        ]
    ];

    var applied = true;

    while( applied )
    {
        applied = false;
        for (var i = 0; i < templates.length; i++) {
           applied = applied || applyTemplate(nGateList, templates[i][0], templates[i][1]);
        }
    }

    return nGateList;
}

function generateQROM2Circuit()
{
    generateTotalControl(toolParameters.nrLogQubits);

    var gl1 = deleteNegativeControls(gateList);
    //  gateList = gl1;//doing this invalidates the raw circ printed in the textarea
    //
    // return;

    // var gl2 =
    decomposeToKAndU(gl1);
    //gateList = gl2;//doing this invalidates the raw circ printed in the textarea

    var gl3 = simplifyWithTemplates(gateList);

    gateList = [];
    writeFileHeader(toolParameters.nrVars);

    if(toolParameters.decomposeCliffordT)
    {
        //the previous version decomposed in placeGate
        //and it was too soon
        //TODO: Fa descompunerea asta sa fie calumea
        var wasCXBefore = false;
        for(var i=3; i<gl3.length; i++)
        {
            var gate = parseUnscheduledGateString(gl3[i]);
            for(var wi=0; wi<gate.wires.length; wi++)
                gate.wires[wi] = eliminateWireNegation(gate.wires[wi]);

            switch(gate.gateType)
            {
                case "K":
                    var delay = -1;
                    if(i==3)
                        delay = 0;
                    placeK(gate.wires[1], gate.wires[0], gate.wires[2], 1, delay);
                    break;
                case "U":
                    var delay = -1;
                    if(wasCXBefore)
                        delay = 0;
                    placeU(gate.wires[1], gate.wires[0], gate.wires[2], 1, delay);

                    wasCXBefore = false;
                    break;
                case "cx":
                    var delay = 0;
                    if(wasCXBefore)
                        delay = 0;

                    var control = gate.wires[0];
                    gate.wires.splice(0, 1);
                    placeCX(control, gate.wires, delay);

                    wasCXBefore = true;
                    break;
            }
        }
    }
    else
    {
        //rewrite the gateList
        for(var i=3; i<gl3.length; i++)
        {
            echo(gl3[i]);
        }
    }

    return gateList;
}

function generateQROMCircuit()
{
    //empty previous existing gate list
    gateList = [];

    var txtField = document.getElementById("circuit");
    txtField.value = "";
    /*
     Prepare the indices for the wires
     */

    var lIndices = new Array();
    var repIndices = new Array();
    var qubIndices = new Array();
    var controlIndex = toolParameters.nrLogQubits;

    for(var i=0; i<toolParameters.nrLogQubits; i++)
    {
        /*reversed order e.g. ... 2, 1, 0*/
        lIndices[i] = fromQubitNrToOrderNr(i, toolParameters.nrLogQubits);;
        repIndices[i] = toolParameters.nrLogQubits + 1 + fromQubitNrToOrderNr(i, toolParameters.nrLogQubits);
    }
    //add control as repIndices of nrLogQubits, because this one is used
    //for a CNOT
    repIndices[toolParameters.nrLogQubits] = controlIndex;

    for(var i=0; i<toolParameters.nrQubits; i++)
    {
        qubIndices[i] = 2 * toolParameters.nrLogQubits + 1 + i;
    }

    writeFileHeader(toolParameters.nrVars);

    //make iterative instead of recursive
    //to simplify output to gate list

    for(var gateIndex = 0; gateIndex < toolParameters.nrQubits; gateIndex++)
    {
        //maximum number of C-Y is gateIndex
        var binaryRep = binaryRepresentation(gateIndex, toolParameters.nrLogQubits);
        echo ("#------ " + binaryRep);


        //CNOT //primul 1 // target pe index, si control pe index - 1
        var idx = firstRightToLeftWithValue(1, binaryRep);
        if(idx != -1)
        {
            if(idx != binaryRep.length)
            {
                //modify idx to represent
                idx = fromOrderNrToQubitNr(idx, toolParameters.nrLogQubits);

                var delayCX = 0;
                if(toolParameters.decomposeCliffordT && idx > 0)
                    delayCX = -1;
                placeCX(repIndices[idx + 1], [repIndices[idx]], delayCX);
            }
        }


        //K gates // pana la primul 1
        var kLocs = allRightToLeftWithValue(0, binaryRep);
        kLocs.reverse();
        // X lIndices[idx]
        // K lIndices[idx] controlIndex repIndices[index]
        for(var kIndex in kLocs)
        {
            var nkIndex = fromOrderNrToQubitNr(kLocs[kIndex], toolParameters.nrLogQubits);

            var ka = lIndices[nkIndex];
            var kb = repIndices[nkIndex + 1];
            var kt = repIndices[nkIndex];

            var whichDecomposition = toolParameters.decomposeCliffordT ? 1 : 0;

            var localDelay = -1;
            if(gateIndex == 0 && ka == 0)
                localDelay = 0;
            placeK(ka, kb, kt, whichDecomposition, localDelay);
        }

        //new circuit - place CX
        //this is where the CX are placed
        //their shape depends on the index of the gates

        var cxtargets2 = [];
        var cxcontrol = repIndices[0];
        for(var cxi = 0; cxi < toolParameters.nrQubits; cxi++)
            cxtargets2.push(qubIndices[cxi]);
        placeCX(cxcontrol, cxtargets2);

        //U gates // pana la primul 0
        var uLocs = allRightToLeftWithValue(1, 	binaryRep);
        // U lIndices[idx] controlIndex repIndices[index]
        for(var kIndex in uLocs)
        {
            var nkIndex = fromOrderNrToQubitNr(uLocs[kIndex], toolParameters.nrLogQubits);
            var ka = lIndices[nkIndex];
            var kb = repIndices[nkIndex + 1];
            var kt = repIndices[nkIndex];

            var localDelay = -1;
            if(nkIndex == 0)
                localDelay = 0;
            placeU (ka, kb, kt, toolParameters.decomposeCliffordT ? 1 : 0, localDelay);
        }
    }
}