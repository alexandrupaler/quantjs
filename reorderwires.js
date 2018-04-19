// the number of the wires
var wireNumber = new Array();

// this method is similar to how the causalgraph operates in the current software
// it is a greedy method of placing the gates on the time axis

function getWireNumber(id)
{
    return wireNumber[id];
}

function computeFirstWireUsage(gateList)
{
    wireNumber = [];

    if(toolParameters.reorderWires)
    {
        var tmpNrW = new Array();

        for (var i = 0; i < gateList.length - 3; i++) {
            var operation = gateList[i + 3].split("|")[0];
            operation = operation.split(" ");

            var targets = new Array();
            //multiple targets
            for (var k = 0; k < operation.length - 1; k++) {
                targets.push(Number(operation[k + 1]));
            }

            for (var j = 0; j < targets.length; j++) {
                var wire = targets[j];
                if (tmpNrW.lastIndexOf(wire) == -1) {
                    tmpNrW.push(wire);
                }
            }
        }
        for(var i=0; i<toolParameters.nrVars; i++)
        {
            wireNumber[tmpNrW[i]] = i;
        }
    }
    else
    {
        for(var i=0; i<toolParameters.nrVars; i++)
            wireNumber.push(i);
    }
}