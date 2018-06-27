function QFTAdderGenerator()
{

}

QFTAdderGenerator.prototype.getParameters = function()
{
    var params = {};

    params["nrLogQubits"] = ["Nr. Qubits", 2];

    return params;
}


QFTAdderGenerator.prototype.adaptParameterValues = function(readParams)
{
    var adaptedParameters = {};

    adaptedParameters.nrLogQubits = readParams.nrLogQubits;
    adaptedParameters.nrVars = 2 * readParams.nrLogQubits + 1;//the last one is carry

    return adaptedParameters;
}

QFTAdderGenerator.prototype.computeQubitPositions = function(params)
{
    /*
     The qubit order is b0,...,bn,0,a0,...,an
     */

    var positions = {};
    positions.a = [];
    positions.b = [];

    for (var i =0; i<params.nrLogQubits; i++)
    {
        positions.b.push(i);
        positions.a.push(params.nrLogQubits + i);
    }
    positions.a.push(2 * params.nrLogQubits);

    return positions;
}

QFTAdderGenerator.prototype.generateCircuit = function(tmpParameterValues, toolParameters)
{
    var params = this.adaptParameterValues(tmpParameterValues);
    var gatePl = new GatePlacer(toolParameters);
    gatePl.writeFileHeader(params.nrVars);

    var positions = this.computeQubitPositions(params);

    /*
        The QFT
     */
    for(var i=0; i<params.nrLogQubits + 1; i++)
    {
        gatePl.placeGate("h", [ positions.a[i] ]);
        var fraction = 1;
        for(var j=i + 1; j<params.nrLogQubits + 1; j++)
        {
            fraction++;
            gatePl.placeControlledRotationXGate(fraction, [ positions.a[j] ], [ positions.a[i] ]);
        }
    }

    /*
        The addition part
     */
    for(var i=0; i<params.nrLogQubits + 1; i++)
    {
        var fraction = 0;
        for(var j = i - 1; j<params.nrLogQubits; j++)
        {
            fraction++;

            //skip the first rotation which would theoretically be controlled by b_{-1}
            if(j == -1)
                continue;

            gatePl.placeControlledRotationXGate(fraction, [ positions.b[j] ], [ positions.a[i] ]);
        }
    }

    /*
     The inverse QFT uses a negative fraction, because it is the inverse rotation
     */
    for(var i=params.nrLogQubits; i>=0; i--)
    {
        var fraction = 1;
        for(var j=params.nrLogQubits; j >= i + 1; j--)
        {
            fraction++;
            gatePl.placeControlledRotationXGate(-fraction, [ positions.a[j] ], [ positions.a[i] ]);
        }
        gatePl.placeGate("h", [ positions.a[i] ]);
    }

    return gatePl.echoCommands.gateList;
}