function generateAdderCircuit()
{
    gateList = [];

    writeFileHeader(toolParameters.nrVars);

    /*first half*/
    for(var i = 0; i < toolParameters.nrLogQubits; i++)
    {
        var prevCarry = (3 * i - 1);
        var bit1 = (3 * i + 0);
        var bit2 = (3 * i + 1);
        var bit3 = (3 * i + 2);

        if(i == 0)
        {
            placeK(bit1, bit2, bit3, toolParameters.decomposeCliffordT);
        }
        else if(i == (toolParameters.nrLogQubits - 1))
        {
            placeCX(prevCarry, [ bit2 ]);
        }
        else
        {
            placeCX( prevCarry, [bit1, bit2] );
            placeK(bit1, bit2, bit3, toolParameters.decomposeCliffordT);
            placeCX(prevCarry, [bit3]);
        }
    }

    /*second half*/
    for(var i = toolParameters.nrLogQubits - 1; i >=0 ; i--)
    {
        var prevCarry = (3 * i - 1);
        var bit1 = (3 * i + 0);
        var bit2 = (3 * i + 1);
        var bit3 = (3 * i + 2);

        if(i == 0)
        {
            placeU(bit1, bit2, bit3, toolParameters.decomposeCliffordT ? 2 : 0);
        }
        else if(i == (toolParameters.nrLogQubits - 1))
        {
           /*do nothing*/
        }
        else
        {
            placeCX(prevCarry, [bit3]);
            placeU(bit1, bit2, bit3, toolParameters.decomposeCliffordT ? 2 : 0);
            placeCX( prevCarry, [bit1], toolParameters.decomposeCliffordT ? -1 : 0);
        }
    }
    for(var i = 0; i < toolParameters.nrLogQubits; i++)
    {
        var bit1 = (3 * i + 0);
        var bit2 = (3 * i + 1);

        placeCX(bit1, [ bit2 ], i == 0 ? 0 : -1);
    }
}