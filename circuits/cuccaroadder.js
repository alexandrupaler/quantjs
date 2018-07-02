function CuccaroAdderGenerator()
{

}

CuccaroAdderGenerator.prototype.getParameters = function()
{
    var params = {};

    params["nrLogQubits"] = ["Nr. Cucc. Qubits", 2];

    return params;
}


CuccaroAdderGenerator.prototype.adaptParameterValues = function(readParams)
{
    var adaptedParameters = {};

    adaptedParameters.nrLogQubits = readParams.nrLogQubits;
    adaptedParameters.nrVars = 2 * readParams.nrLogQubits + 2;//two carries: in and out

    return adaptedParameters;
}

CuccaroAdderGenerator.prototype.computeQubitPositions = function(params)
{
    /*
     The qubit order is 0,b0,...,bn,0,a0,...,an
     The carry out (the qubit zero/0) is in the middle
     The carry in (the qubit zero/0) is the first
     */

    var positions = {};
    positions.a = [];
    positions.b = [];
    positions.carry = [0, params.nrLogQubits + 1];

    for (var i=0; i<params.nrLogQubits; i++)
    {
        positions.b.push(1 + i);
        positions.a.push(params.nrLogQubits + 2 + i);
    }

    return positions;
}

CuccaroAdderGenerator.prototype.addMajorityGate = function(gatePl, a, b, c)
{
    gatePl.placeCX(c, [b]);
    gatePl.placeCX(c, [a]);
    gatePl.placeControlledRotationGate("X", 1, [a, b], [c]);
}

CuccaroAdderGenerator.prototype.addUnMajorityGate = function(gatePl, a, b, c)
{
    gatePl.placeControlledRotationGate("X", 1, [a, b], [c]);
    gatePl.placeCX(c, [a]);
    gatePl.placeCX(a, [b]);
}

CuccaroAdderGenerator.prototype.generateCircuit = function(tmpParameterValues, toolParameters)
{
    var params = this.adaptParameterValues(tmpParameterValues);
    var gatePl = new GatePlacer(toolParameters);
    gatePl.writeFileHeader(params.nrVars);

    var positions = this.computeQubitPositions(params);

    var prevCarry = positions.carry[0];
    for(var i=0; i<params.nrLogQubits; i++)
    {
        this.addMajorityGate(gatePl, prevCarry, positions.b[i], positions.a[i]);
        prevCarry = positions.a[i];
    }

    // gatePl.placeCX(positions.a[params.nrLogQubits - 1], [ positions.carry[1] ]);
    gatePl.placeCX(prevCarry, [ positions.carry[1] ]);

    prevCarry = positions.a[params.nrLogQubits - 2];
    for(var i=params.nrLogQubits - 1; i>=0; i--)
    {
        this.addUnMajorityGate(gatePl, prevCarry, positions.b[i], positions.a[i]);
        if(i == 1)
            prevCarry = positions.carry[0];
        else
            prevCarry = positions.a[i - 2];

    }

    return gatePl.echoCommands.gateList;
}