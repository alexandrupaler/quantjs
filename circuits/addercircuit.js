function GidneyAdderGenerator()
{
}

GidneyAdderGenerator.prototype.getParameters = function()
{
    var params = {};

    params["nrLogQubits"] = ["Nr. Qubits", 2];

    return params;
}


GidneyAdderGenerator.prototype.adaptParameterValues = function(readParams)
{
    var adaptedParameters = {};

    adaptedParameters.nrLogQubits = readParams.nrLogQubits;
    adaptedParameters.nrVars = 3 * (readParams.nrLogQubits - 1 ) + 2;

    console.log(adaptedParameters);

    return adaptedParameters;
}

GidneyAdderGenerator.prototype.generateCircuit = function(tmpParameterValues, toolParameters)
{
    var parameterValues = this.adaptParameterValues(tmpParameterValues);

    var gatePl = new GatePlacer(toolParameters);

    gatePl.writeFileHeader(parameterValues.nrVars);

    /*first half*/
    for(var i = 0; i < parameterValues.nrLogQubits; i++)
    {
        var prevCarry = (3 * i - 1);
        var bit1 = (3 * i + 0);
        var bit2 = (3 * i + 1);
        var bit3 = (3 * i + 2);

        if(i == 0)
        {
            // nanoarch paper
            gatePl.placeK(bit1, bit2, bit3, toolParameters.decomposeCliffordT? 2 : 0);
        }
        else if(i == (parameterValues.nrLogQubits - 1))
        {
            gatePl.placeCX(prevCarry, [ bit2 ]);
        }
        else
        {
            gatePl.placeCX( prevCarry, [bit1, bit2] );
            // placeK(bit1, bit2, bit3, toolParameters.decomposeCliffordT);
            // nanoarch paper
            gatePl.placeK(bit1, bit2, bit3, toolParameters.decomposeCliffordT ? 2 : 0);
            gatePl.placeCX(prevCarry, [bit3]);
        }
    }

    /*second half*/
    for(var i = parameterValues.nrLogQubits - 1; i >=0 ; i--)
    {
        var prevCarry = (3 * i - 1);
        var bit1 = (3 * i + 0);
        var bit2 = (3 * i + 1);
        var bit3 = (3 * i + 2);

        if(i == 0)
        {
            gatePl.placeU(bit1, bit2, bit3, toolParameters.decomposeCliffordT ? 2 : 0);
        }
        else if(i == (parameterValues.nrLogQubits - 1))
        {
           /*do nothing*/
        }
        else
        {
            gatePl.placeCX(prevCarry, [bit3]);
            gatePl.placeU(bit1, bit2, bit3, toolParameters.decomposeCliffordT ? 2 : 0);
            gatePl.placeCX( prevCarry, [bit1], toolParameters.decomposeCliffordT ? -1 : 0);
        }
    }
    for(var i = 0; i < parameterValues.nrLogQubits; i++)
    {
        var bit1 = (3 * i + 0);
        var bit2 = (3 * i + 1);

        gatePl.placeCX(bit1, [ bit2 ], i == 0 ? 0 : -1);
    }

    return gatePl.echoCommands.gateList;
}